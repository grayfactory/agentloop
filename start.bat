@echo off
setlocal
cd /d %~dp0backend

start "" http://localhost:8066
uv run uvicorn main:app --port 8066
