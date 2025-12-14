#!/bin/sh
set -e

echo "Running entrypoint: waiting for dependent services..."

# run node wait script (it exits non-zero on timeout)
if [ -x "$(command -v node)" ]; then
  node /wait/wait-for-services.js
  ret=$?
  if [ "$ret" -ne 0 ]; then
    echo "wait-for-services failed with exit code $ret" >&2
    exit $ret
  fi
else
  echo "node not found in image; skipping wait-for-services" >&2
fi

echo "Dependencies available — starting frontend"
exec npm run dev
