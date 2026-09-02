"""OpenAI-backed provider implementation."""

from __future__ import annotations

import logging
import os
import time

import httpx

from incident_agent.llm.base import (
    BaseLLMProvider,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponseFormatError,
    LLMTimeoutError,
)
from incident_agent.llm.environment import (
    GROQ_API_KEY_ENV_VAR,
    OPENAI_API_KEY_ENV_VAR,
    groq_api_key,
    groq_base_url,
    load_project_env,
)
from incident_agent.schemas.llm import (
    LLMCompletionRequest,
    LLMCompletionResponse,
    LLMStructuredReportRequest,
    LLMStructuredReportResponse,
    LLMUsage,
)
from incident_agent.utils.observability import execution_span, get_logger, log_event

logger = get_logger(__name__)

_GROQ_OUTPUT_CONTRACT = (
    "Write the final analyst text only. Plain sentences. "
    "No markdown, tables, headings, or bullet lists. At most 5 sentences."
)
_GROQ_MAX_COMPLETION_TOKENS = 520


class OpenAIProvider(BaseLLMProvider):
    """Provider implementation using OpenAI chat completions API."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        api_key_env_var: str = OPENAI_API_KEY_ENV_VAR,
        base_url: str = "https://api.openai.com/v1",
        provider_name: str = "openai",
        provider_label: str = "OpenAI",
        timeout_seconds: float = 20.0,
        max_retries: int = 3,
        retry_backoff_seconds: float = 1.0,
        model_pricing_usd_per_1k_tokens: dict[str, float] | None = None,
    ) -> None:
        load_project_env()
        self._provider_name = provider_name
        self._provider_label = provider_label
        self._api_key = (api_key if api_key is not None else os.getenv(api_key_env_var) or "").strip()
        if not self._api_key:
            raise LLMProviderError(
                f"Missing {provider_label} API key. Set {api_key_env_var} environment variable."
            )
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds
        self._max_retries = max_retries
        self._retry_backoff_seconds = retry_backoff_seconds
        self._model_pricing_usd_per_1k_tokens = model_pricing_usd_per_1k_tokens or {}

    def complete(self, request: LLMCompletionRequest) -> LLMCompletionResponse:
        prompt = request.prompt
        max_tokens = request.max_output_tokens
        if self._provider_name == "groq":
            prompt = f"{request.prompt}\n\n{_GROQ_OUTPUT_CONTRACT}"
            max_tokens = min(max_tokens, _GROQ_MAX_COMPLETION_TOKENS)
        payload = {
            "model": request.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": request.temperature,
            "max_tokens": max_tokens,
        }
        with execution_span(
            logger,
            event_prefix="provider.call",
            stage=f"{self._provider_name}.complete",
            provider=self._provider_name,
            model=request.model,
        ):
            response_json, latency_ms = self._post_with_retries(payload, model=request.model)
        content = _extract_message_text(response_json)
        return LLMCompletionResponse(
            model=request.model,
            content=content,
            raw_response=response_json,
            usage=_extract_usage(
                response_json=response_json,
                model=request.model,
                latency_ms=latency_ms,
                pricing=self._model_pricing_usd_per_1k_tokens,
            ),
        )

    def generate_structured_report(
        self,
        request: LLMStructuredReportRequest,
    ) -> LLMStructuredReportResponse:
        payload = {
            "model": request.model,
            "messages": [{"role": "user", "content": request.prompt}],
            "temperature": request.temperature,
            "max_tokens": request.max_output_tokens,
            "response_format": {"type": "json_object"},
        }
        with execution_span(
            logger,
            event_prefix="provider.call",
            stage=f"{self._provider_name}.generate_structured_report",
            provider=self._provider_name,
            model=request.model,
        ):
            response_json, latency_ms = self._post_with_retries(payload, model=request.model)
        content = _extract_message_text(response_json)
        try:
            # Ensure it is valid JSON before returning.
            import json

            json.loads(content)
        except ValueError as error:
            raise LLMResponseFormatError("Provider returned malformed JSON content.") from error

        return LLMStructuredReportResponse(
            model=request.model,
            content=content,
            raw_response=response_json,
            usage=_extract_usage(
                response_json=response_json,
                model=request.model,
                latency_ms=latency_ms,
                pricing=self._model_pricing_usd_per_1k_tokens,
            ),
        )

    def _post_with_retries(
        self, payload: dict[str, object], *, model: str
    ) -> tuple[dict[str, object], float]:
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        endpoint = f"{self._base_url}/chat/completions"
        attempt = 0
        while True:
            attempt += 1
            attempt_start = time.perf_counter()
            log_event(
                logger,
                level=logging.INFO,
                event="provider.request.attempt",
                message="sending provider request",
                provider=self._provider_name,
                model=model,
                attempt=attempt,
            )
            try:
                with httpx.Client(timeout=self._timeout_seconds) as client:
                    response = client.post(endpoint, headers=headers, json=payload)
            except httpx.TimeoutException as error:
                if attempt <= self._max_retries:
                    backoff_seconds = self._retry_backoff_seconds * attempt
                    log_event(
                        logger,
                        level=logging.WARNING,
                        event="provider.request.retry",
                        message="retrying provider request after timeout",
                        provider=self._provider_name,
                        model=model,
                        attempt=attempt,
                        reason="timeout",
                        backoff_seconds=backoff_seconds,
                    )
                    time.sleep(backoff_seconds)
                    continue
                log_event(
                    logger,
                    level=logging.ERROR,
                    event="provider.request.failed",
                    message="provider request failed after timeout retries",
                    provider=self._provider_name,
                    model=model,
                    attempt=attempt,
                    reason="timeout",
                )
                raise LLMTimeoutError(f"{self._provider_label} request timed out.") from error
            except httpx.HTTPError as error:
                if attempt <= self._max_retries:
                    backoff_seconds = self._retry_backoff_seconds * attempt
                    log_event(
                        logger,
                        level=logging.WARNING,
                        event="provider.request.retry",
                        message="retrying provider request after network error",
                        provider=self._provider_name,
                        model=model,
                        attempt=attempt,
                        reason="network_error",
                        backoff_seconds=backoff_seconds,
                    )
                    time.sleep(backoff_seconds)
                    continue
                log_event(
                    logger,
                    level=logging.ERROR,
                    event="provider.request.failed",
                    message="provider request failed after network retries",
                    provider=self._provider_name,
                    model=model,
                    attempt=attempt,
                    reason="network_error",
                )
                raise LLMProviderError(
                    f"{self._provider_label} request failed due to network error."
                ) from error

            if response.status_code == 429:
                if attempt <= self._max_retries:
                    backoff_seconds = self._retry_backoff_seconds * attempt
                    log_event(
                        logger,
                        level=logging.WARNING,
                        event="provider.request.retry",
                        message="retrying provider request after rate limit",
                        provider=self._provider_name,
                        model=model,
                        attempt=attempt,
                        reason="rate_limit",
                        status_code=response.status_code,
                        backoff_seconds=backoff_seconds,
                    )
                    time.sleep(backoff_seconds)
                    continue
                log_event(
                    logger,
                    level=logging.ERROR,
                    event="provider.request.failed",
                    message="provider request failed after rate limit retries",
                    provider=self._provider_name,
                    model=model,
                    attempt=attempt,
                    reason="rate_limit",
                    status_code=response.status_code,
                )
                raise LLMRateLimitError(
                    f"{self._provider_label} rate limit exceeded after retries."
                )
            if response.status_code >= 500:
                if attempt <= self._max_retries:
                    backoff_seconds = self._retry_backoff_seconds * attempt
                    log_event(
                        logger,
                        level=logging.WARNING,
                        event="provider.request.retry",
                        message="retrying provider request after server error",
                        provider=self._provider_name,
                        model=model,
                        attempt=attempt,
                        reason="server_error",
                        status_code=response.status_code,
                        backoff_seconds=backoff_seconds,
                    )
                    time.sleep(backoff_seconds)
                    continue
                log_event(
                    logger,
                    level=logging.ERROR,
                    event="provider.request.failed",
                    message="provider request failed after server retries",
                    provider=self._provider_name,
                    model=model,
                    attempt=attempt,
                    reason="server_error",
                    status_code=response.status_code,
                )
                raise LLMProviderError(
                    f"{self._provider_label} server error: status {response.status_code}."
                )
            if response.status_code >= 400:
                log_event(
                    logger,
                    level=logging.ERROR,
                    event="provider.request.failed",
                    message="provider request failed with client error",
                    provider=self._provider_name,
                    model=model,
                    attempt=attempt,
                    reason="client_error",
                    status_code=response.status_code,
                )
                raise LLMProviderError(
                    f"{self._provider_label} request failed with status "
                    f"{response.status_code}: {response.text}"
                )

            try:
                data = response.json()
            except ValueError as error:
                log_event(
                    logger,
                    level=logging.ERROR,
                    event="provider.request.failed",
                    message="provider returned malformed json",
                    provider=self._provider_name,
                    model=model,
                    attempt=attempt,
                    reason="invalid_json",
                )
                raise LLMResponseFormatError(
                    f"{self._provider_label} response was not valid JSON."
                ) from error
            if not isinstance(data, dict):
                log_event(
                    logger,
                    level=logging.ERROR,
                    event="provider.request.failed",
                    message="provider returned non-object json",
                    provider=self._provider_name,
                    model=model,
                    attempt=attempt,
                    reason="invalid_json_shape",
                )
                raise LLMResponseFormatError(
                    f"{self._provider_label} response JSON must be an object."
                )
            duration_ms = round((time.perf_counter() - attempt_start) * 1000, 2)
            log_event(
                logger,
                level=logging.INFO,
                event="provider.request.succeeded",
                message="provider request succeeded",
                provider=self._provider_name,
                model=model,
                attempt=attempt,
                status_code=response.status_code,
                duration_ms=duration_ms,
            )
            return data, duration_ms


def _extract_message_text(response_json: dict[str, object]) -> str:
    choices = response_json.get("choices")
    if not isinstance(choices, list) or not choices:
        raise LLMResponseFormatError("Missing choices in provider response.")
    first = choices[0]
    if not isinstance(first, dict):
        raise LLMResponseFormatError("Invalid choice payload in provider response.")
    message = first.get("message")
    if not isinstance(message, dict):
        raise LLMResponseFormatError("Missing message object in provider response.")
    content = message.get("content")
    if isinstance(content, str) and content.strip():
        return content
    reasoning = message.get("reasoning")
    if isinstance(reasoning, str) and reasoning.strip():
        return reasoning
    raise LLMResponseFormatError("Missing text content in provider response.")


def _extract_usage(
    *,
    response_json: dict[str, object],
    model: str,
    latency_ms: float,
    pricing: dict[str, float],
) -> LLMUsage:
    usage_payload = response_json.get("usage")
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None

    if isinstance(usage_payload, dict):
        raw_prompt = usage_payload.get("prompt_tokens")
        raw_completion = usage_payload.get("completion_tokens")
        raw_total = usage_payload.get("total_tokens")
        if isinstance(raw_prompt, int):
            prompt_tokens = raw_prompt
        if isinstance(raw_completion, int):
            completion_tokens = raw_completion
        if isinstance(raw_total, int):
            total_tokens = raw_total

    estimated_cost_usd: float | None = None
    if total_tokens is not None:
        unit_price = pricing.get(model)
        if unit_price is not None:
            estimated_cost_usd = round((total_tokens / 1000.0) * unit_price, 8)

    return LLMUsage(
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        latency_ms=latency_ms,
        estimated_cost_usd=estimated_cost_usd,
    )


class GroqProvider(OpenAIProvider):
    """OpenAI-compatible Groq chat completions provider."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout_seconds: float = 20.0,
        max_retries: int = 3,
        retry_backoff_seconds: float = 1.0,
        model_pricing_usd_per_1k_tokens: dict[str, float] | None = None,
    ) -> None:
        load_project_env()
        resolved_key = api_key if api_key is not None else groq_api_key()
        super().__init__(
            api_key=resolved_key or "",
            api_key_env_var=GROQ_API_KEY_ENV_VAR,
            base_url=base_url or groq_base_url(),
            provider_name="groq",
            provider_label="Groq",
            timeout_seconds=timeout_seconds,
            max_retries=max_retries,
            retry_backoff_seconds=retry_backoff_seconds,
            model_pricing_usd_per_1k_tokens=model_pricing_usd_per_1k_tokens,
        )
