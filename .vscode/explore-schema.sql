-- This SQL file is designed to be used with Cursor and SQLTools extension
-- It contains various queries to explore your database schema

-- List all tables with column counts
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM 
  information_schema.tables t
WHERE 
  table_schema = 'public'
ORDER BY 
  table_name;

-- Inspect table structure for each table
-- Uncomment the table you want to explore

-- Users table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_name = 'users' 
ORDER BY 
  ordinal_position;

-- Companies table structure
/*
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_name = 'companies' 
ORDER BY 
  ordinal_position;
*/

-- Collaborations table structure
/*
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_name = 'collaborations' 
ORDER BY 
  ordinal_position;
*/

-- Swipes table structure
/*
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_name = 'swipes' 
ORDER BY 
  ordinal_position;
*/

-- Matches table structure
/*
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_name = 'matches' 
ORDER BY 
  ordinal_position;
*/

-- Check foreign key relationships
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- Sample data queries (limit 5 rows for each table)
-- Uncomment to get a sample of data

-- Users sample
/*
SELECT * FROM users LIMIT 5;
*/

-- Companies sample
/*
SELECT * FROM companies LIMIT 5;
*/

-- Collaborations sample
/*
SELECT * FROM collaborations LIMIT 5;
*/