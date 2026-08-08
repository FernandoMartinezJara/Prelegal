#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

docker build -t prelegal .

docker rm -f prelegal >/dev/null 2>&1 || true

if [ -f .env ]; then
  docker run -d --name prelegal --env-file .env -p 8000:8000 prelegal
else
  docker run -d --name prelegal -p 8000:8000 prelegal
fi

echo "Prelegal is running at http://localhost:8000"
