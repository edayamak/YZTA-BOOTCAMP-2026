#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -d .venv ]]; then
  echo ".venv yok. Once: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

source .venv/bin/activate
exec uvicorn app.main:app --reload --reload-dir app --host 127.0.0.1 --port 8000
