#!/bin/sh
set -e

npm run start:worker &
exec npm run start:web
