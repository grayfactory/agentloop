#!/usr/bin/env bash
cd "$(dirname "$0")/backend"

(
  sleep 1
  if command -v open >/dev/null 2>&1; then
    open http://localhost:8066
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:8066
  fi
) &

exec uv run uvicorn main:app --port 8066
