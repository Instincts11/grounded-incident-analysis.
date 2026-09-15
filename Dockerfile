FROM python:3.12-slim-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

RUN pip install --no-cache-dir "poetry==2.2.1"

COPY pyproject.toml poetry.lock README.md ./
COPY src ./src
COPY configs ./configs
COPY data ./data

RUN poetry install --only main --no-ansi

EXPOSE 8000

CMD python -m uvicorn incident_agent.api.main:app --host 0.0.0.0 --port ${PORT:-8000}
