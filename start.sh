#!/bin/sh
set -e
port="${PORT:-8000}"
exec python -m uvicorn incident_agent.api.main:app --host 0.0.0.0 --port "$port"
