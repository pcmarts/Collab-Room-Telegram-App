#!/bin/bash

# Script to clean up specific tables in the PostgreSQL database
# Usage: ./clear_specific_tables.sh [table1] [table2] ...
# Example: ./clear_specific_tables.sh collab_notifications matches
# If no tables are specified, it will clear all three tables: collab_notifications, matches, swipes

# Default tables to clear
tables=("collab_notifications" "matches" "swipes")

# If tables are provided as arguments, use those instead
if [ $# -gt 0 ]; then
    tables=("$@")
fi

echo "Clearing tables: ${tables[*]}"

# Start building the SQL query
sql_query="
-- Disable triggers temporarily to avoid referential integrity issues
SET session_replication_role = 'replica';

"

# Add DELETE statements for each table
for table in "${tables[@]}"; do
    sql_query+="-- Delete all data from $table
DELETE FROM $table;
"
done

# Add statements to re-enable triggers and verify tables are empty
sql_query+="
-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify that tables are empty
"

# Add count queries for each table
for table in "${tables[@]}"; do
    sql_query+="SELECT '$table count: ' || COUNT(*) FROM $table;
"
done

# Execute the SQL query
echo "$sql_query" | psql "$DATABASE_URL"

echo "Tables cleared successfully."