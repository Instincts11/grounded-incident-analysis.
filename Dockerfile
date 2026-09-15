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

COPY start.sh ./start.sh
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

EXPOSE 8000

# Railway Settings still injects `poetry run uvicorn --port $PORT`. ENTRYPOINT
# ignores that and always starts the API on 8000.
ENTRYPOINT ["./start.sh"]
