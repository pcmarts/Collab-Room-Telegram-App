#!/bin/bash

# This script runs The Collab Room in silent mode (ERROR-only logging)
# It uses multiple approaches to ensure silent mode is activated

echo "=== Running The Collab Room in Silent Mode ==="
echo "Setting LOG_LEVEL=0 (ERROR only)"

# 1. Update .env file to ensure it has the correct LOG_LEVEL
if grep -q "LOG_LEVEL=" .env; then
  # Replace existing LOG_LEVEL with 0
  sed -i 's/LOG_LEVEL=.*/LOG_LEVEL=0/' .env
  echo "- Updated LOG_LEVEL=0 in .env file"
else
  # Add LOG_LEVEL=0 to .env
  echo "LOG_LEVEL=0" >> .env
  echo "- Added LOG_LEVEL=0 to .env file"
fi

# 2. Export LOG_LEVEL as environment variable for this shell session
export LOG_LEVEL=0
echo "- Exported LOG_LEVEL=0 to environment"

# 3. Run with direct environment variable override
echo "- Starting server in silent mode"
LOG_LEVEL=0 npm run dev