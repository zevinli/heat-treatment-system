#!/bin/bash
echo "Starting HeatFlow..."
concurrently -k -n server,client -c cyan,magenta \
  "npx tsx --tsconfig tsconfig.node.json server/main.ts" \
  "npx vite --host 0.0.0.0 --port 8080"
