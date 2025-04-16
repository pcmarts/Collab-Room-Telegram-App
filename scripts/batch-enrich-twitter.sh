#!/bin/bash
# Batch script to enrich multiple companies with Twitter data
# Usage: bash scripts/batch-enrich-twitter.sh

# Check if we have the Twitter API key
if [ -z "$X_RAPIDAPI_KEY" ]; then
  echo "Error: X_RAPIDAPI_KEY environment variable is missing"
  exit 1
fi

# List of company IDs and their Twitter handles from approved users
# Format: "COMPANY_ID:TWITTER_HANDLE"
COMPANIES=(
  "42ef5876-fbe4-42e1-943a-36f0bbc689d5:xxx"
  "74c731c0-87c5-445d-b08e-f0bdc0bc0911:BanklessHQ"
  "bcc465d5-208f-41ae-860c-8a886bfc54cc:beastdao"
  "4eeab409-79a7-4402-ba30-403250070f5a:bbt_content"
  "9f1e51d5-1c2e-4468-b49b-1682ffb3fbdc:blockbuzzco"
  "4c95f244-d5c1-4369-9531-834401fdce12:bondexapp"
  "853491d3-5de8-427a-85ea-8fd890a8dba8:jfjfbf"
  "37d79351-b927-4ebc-9f38-41f3d345b099:cookie3_com"
  "21ccdcd3-1df0-4bd0-908b-3a44842babdb:degen"
  "cd34aa4d-fab4-49a6-b83e-522288fa131c:Elfiprotocol"
  "67e71445-2878-4965-a3ba-a4c0a8602e71:mbdtheworld"
  "a392f56b-8d05-47b0-900d-624aca8a6928:empe_io"
  "c229cba0-3a06-4794-8ee0-f1b03fe3d61f:_spacecoin"
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
log_file="twitter-enrichment-$(date +%Y%m%d-%H%M%S).log"
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