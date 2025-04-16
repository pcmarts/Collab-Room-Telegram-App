#!/bin/bash
# Batch script to continue enriching companies with Twitter data from where we left off
# Usage: bash scripts/batch-enrich-twitter-continue4.sh

# Check if we have the Twitter API key
if [ -z "$X_RAPIDAPI_KEY" ]; then
  echo "Error: X_RAPIDAPI_KEY environment variable is missing"
  exit 1
fi

# List of company IDs and their Twitter handles from approved users
# Format: "COMPANY_ID:TWITTER_HANDLE"
COMPANIES=(
  # Process remaining companies
  "be81016b-1f6d-4640-80b7-f88bdbd9282e:isaaclazoff"
  "5a519f15-600f-46c6-a297-e54a13320a0e:liquorice.hq"
  "baa5b263-e968-4db8-b88c-feda5dde2d3e:lunarstrategy"
  "0500695a-e314-40f6-bbd2-4dc368dca173:node_narrative"
  "efae1cba-7d45-4bbd-867e-879be810c131:poapxyz"
  "c8ef6647-9765-4c56-8dc5-6657cb5d73b6:therzlt"
  "831958c9-dfa9-431a-a670-f6c241101be5:re"
  "cb90798e-e059-4d4b-800b-56aadbc55159:rumorsdatingapp"
  "81f14c6b-818d-42e6-83ff-a34e5ef38070:_spacecoin"
  "b0304dc1-6261-4355-9ec6-b1a9392a07d9:surge_dao"
)

# Initialize counters
total=${#COMPANIES[@]}
success=0
failed=0

# Create log file
log_file="twitter-enrichment-continue4-$(date +%Y%m%d-%H%M%S).log"
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