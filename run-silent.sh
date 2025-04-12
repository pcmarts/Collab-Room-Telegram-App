#!/bin/bash

# This script directly sets the LOG_LEVEL environment variable
# and launches the application with ERROR-only logging (silent mode)

echo "=== Running The Collab Room in Silent Mode ==="
echo "Setting LOG_LEVEL=0 (ERROR only)"

# Use env to set the environment variable directly when running the command
env LOG_LEVEL=0 npm run dev

# Alternative methods:
# 1. Export and run in same shell:
# export LOG_LEVEL=0
# npm run dev
#
# 2. Use bash inline variable:
# LOG_LEVEL=0 npm run dev