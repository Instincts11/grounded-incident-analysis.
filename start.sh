#!/bin/sh
set -e
exec python -m uvicorn incident_agent.api.main:app --host 0.0.0.0 --port 8000
