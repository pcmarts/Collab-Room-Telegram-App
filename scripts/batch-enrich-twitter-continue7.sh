#!/bin/bash
# Final batch script to complete Twitter data enrichment
# Usage: bash scripts/batch-enrich-twitter-continue7.sh

# Check if we have the Twitter API key
if [ -z "$X_RAPIDAPI_KEY" ]; then
  echo "Error: X_RAPIDAPI_KEY environment variable is missing"
  exit 1
fi

# List of company IDs and their Twitter handles from approved users
# Format: "COMPANY_ID:TWITTER_HANDLE"
COMPANIES=(
  # Process remaining companies
  "b0304dc1-6261-4355-9ec6-b1a9392a07d9:surge_dao"
  "e8bbd76f-44bc-4e5d-af4e-fc0d9d88d19a:tpan____"
  "56b65a68-332b-4cfd-ba6d-8a65b247dbad:trepa_io"
  "566e8079-7777-441c-8236-dc399f977b6b:mia_unhashed"
  "4a4fddf8-6357-4bfa-9993-f8610a91e1f7:xborghq"
  "80385436-4926-40b3-b07c-b009c3e08a90:zksync"
  "18eccef2-e537-490c-a2eb-4e20fa5d5418:zerion"
  "a1e7b7b9-f469-4387-b990-ad14649066fc:t3rn_io"
)

# Initialize counters
total=${#COMPANIES[@]}
success=0
failed=0

# Create log file
log_file="twitter-enrichment-complete-$(date +%Y%m%d-%H%M%S).log"
echo "Twitter Enrichment Log - $(date)" > $log_file
echo "====================================" >> $log_file

# Process each company
for company in "${COMPANIES[@]}"; do
  # Split the company entry into ID and handle
  IFS=':' read -r -a entry <<< "$company"
  
  company_id="${entry[0]}"
  twitter_handle="${entry[1]}"
  
  echo "========================================"
  echo "Processing company: $company_id"
  echo "Twitter handle: @$twitter_handle"
  echo "[$((success+failed+1))/$total]"
  echo "========================================"
  
  # Log the company being processed
  echo "[$((success+failed+1))/$total] Processing: $company_id (@$twitter_handle)" >> $log_file
  
  # Run the enrichment script
  if node scripts/enrich-company-twitter-data.cjs "$company_id" "$twitter_handle" >> $log_file 2>&1; then
    echo "Successfully enriched company: $company_id (@$twitter_handle)" 
    echo "SUCCESS: $company_id (@$twitter_handle)" >> $log_file
    ((success++))
  else
    echo "Failed to enrich company: $company_id (@$twitter_handle)" 
    echo "FAILED: $company_id (@$twitter_handle)" >> $log_file
    ((failed++))
  fi
  
  # Add a delay to avoid rate limits
  echo "Waiting 3 seconds before next company..."
  sleep 3
done

# Print summary
echo ""
echo "========================================"
echo "ENRICHMENT COMPLETE"
echo "========================================"
echo "Total companies processed: $total"
echo "Successful: $success"
echo "Failed: $failed"
echo ""
echo "Log file: $log_file"

# Add summary to log file
echo "" >> $log_file
echo "=======================================" >> $log_file
echo "ENRICHMENT SUMMARY" >> $log_file
echo "=======================================" >> $log_file
echo "Total companies processed: $total" >> $log_file
echo "Successful: $success" >> $log_file
echo "Failed: $failed" >> $log_file

echo "Batch enrichment process completed!"