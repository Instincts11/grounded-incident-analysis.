install:
	python -m pip install -e .

format-check:
	python -m ruff format --check .

lint:
	python -m ruff check .

typecheck:
	python -m mypy src tests

test:
	python -m pytest

test-unit:
	python -m pytest --no-cov tests/unit

test-integration:
	python -m pytest --no-cov tests/integration

coverage:
	python -m pytest

quality:
	python -m ruff format --check .
	python -m ruff check .
	python -m mypy src tests
	python -m pytest

run-api:
	python -m uvicorn incident_agent.api.main:app --reload --host 127.0.0.1 --port 8000

run-web:
	npm --prefix web run dev

run-demo:
	incident-agent run-demo
