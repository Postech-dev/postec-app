#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test_container="postec-nuvemshop-test-$$"
trap 'docker rm -f "$test_container" >/dev/null 2>&1 || true' EXIT
docker run --detach --rm --name "$test_container" --publish 127.0.0.1::5432 \
  --env POSTGRES_PASSWORD=postec_test --env POSTGRES_DB=postec_test postgres:15.3-alpine >/dev/null
for attempt in {1..60}; do
  if docker exec "$test_container" pg_isready -U postgres -d postec_test >/dev/null 2>&1; then break; fi
  sleep 0.5
done
test_port=$(docker port "$test_container" 5432/tcp | sed 's/.*://')
DATABASE_URL="postgresql://postgres:postec_test@127.0.0.1:$test_port/postec_test" \
  ./node_modules/.bin/tsx --test tests/*.integration.ts
