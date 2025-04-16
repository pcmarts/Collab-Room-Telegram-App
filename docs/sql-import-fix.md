# SQL Import Fix

## Issue Description

The application was failing to deploy due to an import error with the `@neondatabase/serverless` package. The error specifically stated that the module doesn't provide an export named `sql`, causing a crash loop in deployment.

## Root Cause

Several files in the codebase were incorrectly importing the `sql` function from `@neondatabase/serverless` instead of importing it from `drizzle-orm` where it's actually defined. This inconsistency was causing deployment failures.

## Files Fixed

The following files were updated to properly import the `sql` function from `drizzle-orm`:

1. `server/routes/twitter-routes.js`
2. `scripts/enrich-company-twitter-data.js`
3. `scripts/test-company-twitter-enrichment.js`
4. `scripts/enrich-approved-companies.js`

## Changes Made

Changed import statements in each file from:

```javascript
import { sql } from '@neondatabase/serverless';
```

To:

```javascript
import { sql } from 'drizzle-orm';
```

## Explanation

The `sql` function is a core part of the Drizzle ORM and should be imported from `drizzle-orm` directly. The `@neondatabase/serverless` package provides the database client/connection functionality but does not export the `sql` tag function needed for query building.

This fix ensures consistent import patterns across the codebase and aligns with the main application code, which already correctly imports `sql` from `drizzle-orm`.

## Deployment Considerations

If deployment still has timeout issues after fixing these imports, consider the following potential solutions:

1. Check for long-running initialization code in the application startup
2. Look for any heavy database migrations that might be running during startup
3. Review environment variables to ensure all required configurations are present
4. Examine the application logs for any other errors that might be occurring during startup
5. Consider adding more detailed logging around application initialization to pinpoint slowdowns