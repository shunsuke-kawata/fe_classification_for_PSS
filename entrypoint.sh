#!/bin/sh
set -e

echo "Starting frontend without waiting for dependent services..."

exec npm run dev
