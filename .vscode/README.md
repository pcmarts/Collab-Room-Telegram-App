# VSCode and Cursor Configuration

This directory contains configuration files for VSCode and Cursor to help you work with this project more efficiently.

## Database Connection in Cursor

The `settings.json` file contains a database connection configuration for Cursor that connects to your PostgreSQL database. Here's how to use it:

1. Make sure you have the SQLTools extension installed in Cursor.
2. In Cursor, access the SQLTools sidebar (typically a database icon in the sidebar).
3. Look for "Collab Room Database" in the connections list and connect to it.
4. When opening the connection for the first time, you'll be prompted for the database password.
5. If you need to update connection details, edit the `sqltools.connections` section in `settings.json`.

## Database Schema Exploration

There are two files to help you understand and work with the database schema:

1. **db-schema.json**: This file provides Cursor with information about the database schema structure. This helps with:
   - Autocomplete suggestions when writing SQL queries
   - Understanding table relationships
   - Visualizing the database structure

2. **explore-schema.sql**: This is a SQL file with various queries to explore the database schema:
   - List all tables with column counts
   - View table structures (column names, types, constraints)
   - Check foreign key relationships
   - See sample data (commented out by default)
   
   To use this file:
   1. Open it in Cursor
   2. Connect to the database
   3. Execute individual queries by selecting them and using the SQLTools "Run Selected Query" command

## Common Issues and Solutions

### Connection Issues

If you experience connection issues, verify that:

1. The Neon database is running and accessible
2. Your IP is allowed in the Neon database security settings
3. Your credentials are correct

### SSL Issues

By default, the connection is configured to use SSL. If you're having SSL-related issues:

1. Ensure you have proper CA certificates
2. You might need to set `ssl: { rejectUnauthorized: false }` for development (not recommended for production)

## Connection String Format

The full connection string format for this Neon database is:
```
postgresql://[username]:[password]@[host]:[port]/[database]?sslmode=require
```

Replace the placeholders with your actual database credentials.