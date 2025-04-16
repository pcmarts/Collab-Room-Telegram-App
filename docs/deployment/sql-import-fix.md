# SQL Import Fix

## Issue Description

The application was experiencing deployment issues due to incorrect SQL function imports in several files. The specific error occurred when trying to import the `sql` function from `@neondatabase/serverless` when it should have been imported from `drizzle-orm`.

## Affected Files

The following files were identified and fixed:

1. `server/routes/twitter-routes.js`
2. `scripts/enrich-company-twitter-data.js`
3. `scripts/test-company-twitter-enrichment.js`
4. `scripts/enrich-approved-companies.js`

## Solution

In each file, we updated the import statement from:

```javascript
import { sql } from '@neondatabase/serverless';
```

To:

```javascript
import { sql } from 'drizzle-orm';
```

## Technical Explanation

This issue arose because the codebase incorrectly tried to import the `sql` function from the wrong package:

- `@neondatabase/serverless` provides database client and connection functionality
- `drizzle-orm` provides the SQL query builder tools, including the `sql` tag function

When used together, these packages allow applications to connect to a NeonDB PostgreSQL database and build SQL queries. However, each package has specific responsibilities, and the `sql` tag function must be imported from `drizzle-orm`.

## Deployment Improvement

After fixing these imports, the application should deploy successfully without module import errors. No database schema changes were made, and no data was altered. The fix is purely related to code structure and imports.

## Best Practices for the Future

To prevent similar issues in the future:

1. Maintain consistent import patterns across the entire codebase
2. When using Drizzle ORM with NeonDB:
   - Import database client/connection from `@neondatabase/serverless`
   - Import query building tools like `sql` from `drizzle-orm`
3. Use ESLint rules to enforce proper package imports
4. Document architectural decisions for package usage