#!/bin/bash

# Script to clean up specific tables in the PostgreSQL database
# This script will remove all data from collab_notifications, matches, swipes, and sessions tables

echo "Clearing tables: collab_notifications, matches, swipes, sessions"

# Execute the SQL queries
psql $DATABASE_URL << EOF
-- Disable triggers temporarily to avoid referential integrity issues
SET session_replication_role = 'replica';

-- Delete all data from the specified tables
DELETE FROM collab_notifications;
DELETE FROM matches;
DELETE FROM swipes;
DELETE FROM sessions;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify that tables are empty
SELECT 'collab_notifications count: ' || COUNT(*) FROM collab_notifications;
SELECT 'matches count: ' || COUNT(*) FROM matches;
SELECT 'swipes count: ' || COUNT(*) FROM swipes;
SELECT 'sessions count: ' || COUNT(*) FROM sessions;
EOF

echo "Tables cleared successfully."