# Performance Optimization PRD for The Collab Room

## Executive Summary

The Collab Room is a Web3 professional networking platform that requires exceptional performance to provide a seamless user experience within the Telegram WebApp environment. This document presents a comprehensive performance optimization strategy based on a thorough analysis of the existing codebase, application architecture, and documented optimization history.

Our analysis reveals that while significant optimizations have already been implemented - including a three-phase progressive loading system and database query optimizations that reduced response times by 40% - several opportunities remain to further enhance performance. The most impactful optimization areas identified include:

1. **Frontend Rendering Optimization**: Completing code splitting implementation, optimizing component rendering, and improving Telegram WebApp integration.
2. **Data Fetching Enhancements**: Further database query optimization using CTEs, implementing selective HTTP caching, and response compression.
3. **Asset Delivery Improvements**: Implementing proper image loading strategies, component virtualization, and build optimizations.

This PRD presents detailed, code-level recommendations organized into three implementation phases, with predicted performance improvements for each recommendation. By implementing these optimizations, we target a 30% reduction in initial bundle size, >40% reduction in critical API response times, and significant improvements in key Web Vitals metrics.

## Current Application State and Optimizations

The application has already implemented several performance optimizations:

1. **Loading Performance**:
   - Three-phase progressive loading system (HTML splash, React splash, full app)
   - Ultra-light splash screen that renders in under 100ms
   - Optimized application startup with non-blocking initialization
   - Removed artificial loading delays from onboarding flow (welcome page now loads immediately)

2. **Database Optimizations**:
   - Strategic database indexing for discovery cards feature
   - Reduced query execution time from 96ms to 57ms (~40% improvement)
   - SQL-based filtering to reduce backend processing overhead
   - Composite indexes for frequently used query patterns

3. **Frontend Optimizations**:
   - Improved React Query configuration (staleTime: Infinity for many queries)
   - Authentication refresh loop fixes to prevent excessive API calls
   - Silent mode to reduce console output and improve performance

## Remaining Performance Issues

Despite these improvements, the application still experiences performance issues:

1. Incomplete implementation of code splitting for route-based components
2. Non-optimized component re-renders leading to excessive calculations
3. Unoptimized image loading resulting in render delays
4. Potential for further query performance improvements
5. Resource-heavy bundle configuration without appropriate chunking

## Optimization Recommendations

### 1. Database and API Optimizations (High Impact)

#### 1.1 Enhance Database Query Performance
- **Issue**: Despite existing query optimizations, there's room for further improvement in database access.
- **Solution**: Further optimize the query structure by adopting the following strategies:
```typescript
// In server/storage.ts - optimize frequently used queries
export async function searchCollaborationsPaginated(userId: string, filters: FilterOptions = {}) {
  // 1. Use CTE (Common Table Expression) for better query organization
  const query = sql`
    WITH user_preferences AS (
      SELECT * FROM marketing_preferences WHERE user_id = ${userId}
    ),
    filtered_collabs AS (
      SELECT c.*, u.first_name, u.last_name, co.name as company_name
      FROM collaborations c
      JOIN users u ON c.creator_id = u.id
      JOIN companies co ON u.id = co.user_id
      WHERE c.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM swipes
        WHERE swipes.user_id = ${userId}
        AND swipes.collaboration_id = c.id
      )
      -- Other filters...
      ORDER BY c.created_at DESC
      LIMIT ${filters.limit || 10}
    )
    SELECT * FROM filtered_collabs
  `;
  
  // Performance monitoring
  const startTime = performance.now();
  const results = await db.execute(query);
  const endTime = performance.now();
  
  logger.debug(`Query executed in ${(endTime - startTime).toFixed(2)}ms`);
  
  return results;
}
```

#### 1.2 Implement Response Compression
- **Issue**: API responses are not compressed, increasing data transfer time.
- **Solution**: Add compression middleware to Express:
```typescript
import compression from 'compression';

// Add compression for API responses, but configure it appropriately
app.use(compression({
  // Don't compress responses smaller than 1KB
  threshold: 1024,
  // Only compress certain content types
  filter: (req, res) => {
    const contentType = res.getHeader('Content-Type');
    return contentType &&
      (contentType.includes('application/json') ||
       contentType.includes('text/html') ||
       contentType.includes('text/css') ||
       contentType.includes('application/javascript'));
  }
}));
```

#### 1.3 Implement Selective HTTP Caching
- **Issue**: The application currently disables etags with `app.set('etag', false)` to prevent 304 responses.
- **Solution**: Instead of disabling all caching, implement selective HTTP caching for appropriate resources:
```typescript
// In server/routes.ts
// For infrequently changing resources like network stats
app.get("/api/network-stats", (req, res, next) => {
  // Set cache headers for up to 5 minutes
  res.set('Cache-Control', 'public, max-age=300');
  next();
}, async (_req, res) => {
  // Existing handler code
});

// For user-specific data that shouldn't be cached
app.get("/api/user-profile", (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
}, async (req, res) => {
  // Existing handler code
});
```

### 2. Frontend Optimizations (High Impact)

#### 2.1 Complete Code Splitting Implementation
- **Issue**: While the app already uses some lazy loading, not all routes use code splitting, increasing the initial bundle size.
- **Solution**: Expand lazy loading to all routes and ensure proper loading indicators:
```typescript
// In App.tsx - expand code splitting to all routes
import { lazy, Suspense } from "react";

// Lazy load all page components
const Dashboard = lazy(() => import('@/pages/dashboard'));
const DiscoverPage = lazy(() => import('@/pages/DiscoverPageNew'));
const MatchesPage = lazy(() => import('@/pages/MatchesPage'));
const ProfileOverview = lazy(() => import('@/pages/profile-overview'));
const MarketingCollabsNew = lazy(() => import('@/pages/marketing-collabs-new'));
const FiltersDashboard = lazy(() => import('@/pages/filters/dashboard'));
// Apply to all remaining page components...

// Wrap routes with Suspense and fallback
function Router() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/discover" component={DiscoverPage} />
        {/* Other routes */}
      </Switch>
    </Suspense>
  );
}
```

#### 2.2 Optimize Telegram WebApp Integration
- **Issue**: The Telegram WebApp initialization causes performance issues, even after authentication refresh fix.
- **Solution**: Implement improved initialization with minimal impact on rendering:
```typescript
// Optimize Telegram WebApp initialization
function useTelegramInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize outside of render cycle using a layout effect
  useLayoutEffect(() => {
    // Only attempt to initialize once and in client
    if (typeof window !== 'undefined' && !isInitialized) {
      // Use dynamic import to keep initialization code out of main bundle
      import('./utils/TelegramHelper').then(({ initTelegramWebApp }) => {
        initTelegramWebApp({
          expandApp: true,
          debugLog: false // Reduce console output
        });
        setIsInitialized(true);
      }).catch(err => {
        console.error('[TelegramInit] Failed to load helper:', err);
      });
    }
  }, [isInitialized]);
  
  return isInitialized;
}
```

#### 2.3 Implement Virtualization for Card Lists
- **Issue**: Rendering all discovery cards at once causes performance issues.
- **Solution**: Implement virtualized rendering for card lists:
```typescript
// In card list components, implement react-window for efficient rendering
import { FixedSizeList } from 'react-window';

function VirtualizedCardList({ cards }) {
  // Only render cards that are visible in the viewport
  return (
    <FixedSizeList
      height={600}
      width="100%"
      itemCount={cards.length}
      itemSize={400} // Height of each card
      overscanCount={2} // Render 2 items outside visible area
    >
      {({ index, style }) => (
        <div style={style}>
          <CollaborationCard collaboration={cards[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### 3. Image Optimization (Medium Impact)

#### 3.1 Implement Proper Image Lazy Loading
- **Issue**: All images load at once, slowing initial render.
- **Solution**: Add proper image lazy loading:
```jsx
<img 
  src={finalUrl}
  alt={name || "Company"}
  loading="lazy" // Add native lazy loading
  className="h-full w-full object-cover"
  decoding="async" // Add async decoding
  {...(!finalUrl.startsWith('/') ? { crossOrigin: "anonymous" } : {})}
/>
```

#### 3.2 Implement Image CDN Integration
- **Issue**: Image loading from external sources is slow and inconsistent.
- **Solution**: Use an image CDN or implement a proxy service for external images:
```typescript
// server/routes.ts
app.get('/api/image-proxy', async (req, res) => {
  const { url } = req.query;
  // Validate URL
  // Fetch, optimize, cache, and return the image
});
```

#### 3.3 Pre-load Critical Images
- **Issue**: Key images load late in the process.
- **Solution**: Add preload hints for critical images:
```html
<!-- Add to HTML head -->
<link rel="preload" as="image" href="/logo.png" />
```

### 4. React Component Optimizations (Medium Impact)

#### 4.1 Expand Component Memoization
- **Issue**: Despite some memoization in the app (like the SplashScreen component), many components still re-render unnecessarily.
- **Solution**: Identify and memoize expensive or frequently re-rendered components:
```typescript
// Apply React.memo consistently for card components, list items, and modals
const CollaborationCard = React.memo(({ collaboration, onSwipe }) => {
  // Component implementation
  
  // Use useCallback for handlers that are passed as props
  const handleSwipe = useCallback((direction) => {
    onSwipe(collaboration.id, direction);
  }, [collaboration.id, onSwipe]);
  
  return (
    // Component JSX
  );
});

// Add display name for better debugging
CollaborationCard.displayName = 'CollaborationCard';
```

#### 4.2 Optimize State Management
- **Issue**: Overly broad state updates cause unnecessary re-renders of unrelated components.
- **Solution**: Implement more granular state management:
```typescript
// Before: Using a single state object for all user data
const [userData, setUserData] = useState({
  profile: null,
  preferences: null,
  company: null,
  statistics: null
});

// After: Split state into logical concerns
const [profile, setProfile] = useState(null);
const [preferences, setPreferences] = useState(null);
const [company, setCompany] = useState(null);
const [statistics, setStatistics] = useState(null);

// This allows updating only what changed:
setPreferences(newPreferences); // Only triggers re-renders in components that use preferences
```

#### 4.3 Implement Render Profiling
- **Issue**: No visibility into which components are causing performance issues.
- **Solution**: Add a profiling utility to identify problematic components:
```typescript
// Create a higher-order component for measuring render times
function withProfiler<P extends object>(
  Component: React.ComponentType<P>,
  id: string
): React.FC<P> {
  const ProfiledComponent: React.FC<P> = (props) => {
    const renderStart = performance.now();
    
    useEffect(() => {
      const renderTime = performance.now() - renderStart;
      
      // Log slow renders (over 16ms, which would drop below 60fps)
      if (renderTime > 16) {
        console.warn(`[Profiler] ${id} rendered slowly: ${renderTime.toFixed(2)}ms`);
      }
    });
    
    return <Component {...props} />;
  };
  
  return ProfiledComponent;
}

// Usage:
const ProfiledDiscoveryPage = withProfiler(DiscoveryPage, 'DiscoveryPage');
```

#### 4.4 Optimize Event Handler Binding
- **Issue**: Handlers recreated on every render cause frequent garbage collection.
- **Solution**: Optimize event handler binding with useCallback and debouncing:
```typescript
// For search input handlers with debounce
const debouncedSearchHandler = useCallback(
  debounce((value) => {
    // Handle search
    performSearch(value);
  }, 300), // 300ms debounce
  [] // Empty dependency array as debounce creates a stable reference
);

// For scroll event handlers with throttling
const throttledScrollHandler = useCallback(
  throttle(() => {
    // Handle scroll
    checkScrollPosition();
  }, 100), // 100ms throttle
  []
);

// Clean up on unmount
useEffect(() => {
  return () => {
    debouncedSearchHandler.cancel();
    throttledScrollHandler.cancel();
  };
}, [debouncedSearchHandler, throttledScrollHandler]);
```

### 5. Build and Asset Optimizations (Lower Impact)

#### 5.1 Optimize Vite Build Configuration
- **Issue**: Default Vite build configuration may not be optimal.
- **Solution**: Enhance build configuration:
```typescript
// vite.config.ts
import { defineConfig } from "vite";
import path from 'path';
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    target: 'es2020', // Adjust target based on browser support needs
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        passes: 2
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'wouter', '@tanstack/react-query'],
          ui: [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu', 
            'lucide-react',
          ],
        }
      }
    }
  }
});
```

#### 5.2 Add Service Worker for Asset Caching
- **Issue**: No offline caching strategy for static assets.
- **Solution**: Implement a service worker for caching:
```typescript
// Add Workbox or similar library for service worker management
// Cache static assets for offline access and faster subsequent loads
```

## Implementation Prioritization

The recommendations are prioritized based on expected performance impact, taking into account the existing optimization efforts already documented in the changelog:

1. **Phase 1 (Immediate Wins)**
   - Enhanced database query performance with CTEs (1.1)
   - Complete code splitting implementation for all routes (2.1)
   - Image lazy loading with native attributes (3.1)
   - Expand component memoization (4.1)

2. **Phase 2 (Medium-term Improvements)**
   - Optimize Telegram WebApp integration (2.2)
   - Selective HTTP caching implementation (1.3)
   - Response compression (1.2)
   - Optimize state management (4.2)
   - Event handler optimization with debouncing/throttling (4.4)

3. **Phase 3 (Long-term Enhancements)**
   - Component virtualization for card lists (2.3)
   - Image CDN integration (3.2)
   - Implement render profiling (4.3)
   - Vite build optimization with manual chunks (5.1)
   - Service worker implementation (5.2)

## Testing and Validation

To ensure effective implementation and impact measurement of our optimizations, we'll utilize a combination of automated testing and performance monitoring tools. This approach builds on existing testing capabilities while incorporating new measurement methodologies.

### Performance Measurement Strategy

#### 1. Establish Baseline Metrics
Before implementing any optimizations, capture baseline performance metrics using:
- Laboratory tests (controlled environment measurements)
- Real user monitoring (RUM) where possible
- Specific API response time measurements

#### 2. Create Performance Test Suite
Building on the existing `test-query-performance.js` script, develop a comprehensive test suite that covers all critical paths:

```javascript
// performance-test-suite.js
import { performance } from 'perf_hooks';

// Measure API endpoint performance
export async function measureApiPerformance(endpoint, iterations = 5) {
  console.log(`Testing performance for ${endpoint}`);
  const results = [];
  let totalTimeMs = 0;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    const response = await fetch(endpoint);
    await response.json();
    const endTime = performance.now();
    
    const executionTimeMs = endTime - startTime;
    results.push(executionTimeMs);
    totalTimeMs += executionTimeMs;
    console.log(`Iteration ${i+1}: ${executionTimeMs.toFixed(2)}ms`);
  }
  
  // Calculate statistics
  results.sort((a, b) => a - b);
  const median = results[Math.floor(results.length / 2)];
  const min = results[0];
  const max = results[results.length - 1];
  const avg = totalTimeMs / iterations;
  
  return {
    averageTimeMs: avg,
    medianTimeMs: median,
    minTimeMs: min,
    maxTimeMs: max,
    totalIterations: iterations,
    rawResults: results
  };
}

// Test multiple endpoints in sequence and generate report
export async function runPerformanceTest() {
  const criticalEndpoints = [
    '/api/potential-matches',
    '/api/user-swipes',
    '/api/profile',
    '/api/network-stats'
  ];
  
  console.log('Starting performance test suite');
  const results = {};
  
  for (const endpoint of criticalEndpoints) {
    results[endpoint] = await measureApiPerformance(endpoint);
  }
  
  console.table(Object.entries(results).map(([endpoint, data]) => ({
    Endpoint: endpoint,
    'Avg (ms)': data.averageTimeMs.toFixed(2),
    'Median (ms)': data.medianTimeMs.toFixed(2),
    'Min (ms)': data.minTimeMs.toFixed(2),
    'Max (ms)': data.maxTimeMs.toFixed(2)
  })));
  
  return results;
}
```

#### 3. Implement Web Vitals Monitoring
Integrate Web Vitals measurement to track real user experience metrics:

```javascript
// web-vitals-monitor.js
import { getCLS, getFID, getLCP, getTTFB, getFCP } from 'web-vitals';

// Set up persistent logging of metrics
export function initWebVitalsMonitoring(appVersion) {
  // Function to send metrics to analysis endpoint
  function sendToAnalytics(metric) {
    const data = {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      appVersion: appVersion,
      timestamp: Date.now()
    };
    
    // Log to console during development
    console.log('[WebVitals]', data);
    
    // Only in production, send to analytics endpoint
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(err => {
        console.error('[WebVitals] Error sending metric:', err);
      });
    }
  }
  
  // Monitor all Core Web Vitals plus TTFB
  getCLS(sendToAnalytics);  // Cumulative Layout Shift
  getFID(sendToAnalytics);  // First Input Delay
  getLCP(sendToAnalytics);  // Largest Contentful Paint
  getTTFB(sendToAnalytics); // Time To First Byte
  getFCP(sendToAnalytics);  // First Contentful Paint
}
```

#### 4. Database Query Performance Monitoring
Implement a comprehensive database performance monitoring system to track all queries:

```typescript
// db-performance-monitor.ts
import { performance } from 'perf_hooks';
import { logger } from './logger';

// Track slow queries based on configurable threshold
const SLOW_QUERY_THRESHOLD_MS = 50; // Queries taking longer than 50ms are considered slow

// Create a performance monitoring decorator for database functions
export function monitorQueryPerformance<T extends Function>(
  queryFn: T, 
  queryName: string
): T {
  return (async function(...args: any[]) {
    const startTime = performance.now();
    try {
      // Execute the original query function
      const result = await queryFn(...args);
      const endTime = performance.now();
      const durationMs = endTime - startTime;
      
      // Log all query execution times in development
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`[DB Query] ${queryName} completed in ${durationMs.toFixed(2)}ms`);
      }
      
      // In all environments, log slow queries as warnings
      if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
        logger.warn(`[Slow Query] ${queryName} took ${durationMs.toFixed(2)}ms to execute`, {
          queryName,
          durationMs,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      logger.error(`[Query Error] ${queryName} failed after ${(endTime - startTime).toFixed(2)}ms`, {
        error,
        queryName
      });
      throw error;
    }
  }) as unknown as T;
}

// Usage example:
// searchCollaborationsPaginated = monitorQueryPerformance(
//   searchCollaborationsPaginated,
//   'searchCollaborationsPaginated'
// );
```

### Automated Performance Regression Testing

To ensure optimizations don't regress over time, implement a CI/CD pipeline step that runs performance tests and compares against baseline metrics:

```typescript
// performance-regression-test.ts
import { runPerformanceTest } from './performance-test-suite';
import fs from 'fs/promises';
import path from 'path';

const BASELINE_FILE = path.join(__dirname, '../performance-baseline.json');
const REGRESSION_THRESHOLD = 1.15; // 15% degradation threshold

async function checkPerformanceRegression() {
  // Read baseline metrics
  let baseline;
  try {
    const baselineData = await fs.readFile(BASELINE_FILE, 'utf-8');
    baseline = JSON.parse(baselineData);
  } catch (error) {
    console.warn('No baseline metrics found. Creating new baseline...');
    const results = await runPerformanceTest();
    await fs.writeFile(BASELINE_FILE, JSON.stringify(results, null, 2));
    console.log('Baseline metrics created. Skipping regression check.');
    return true;
  }
  
  // Run current performance test
  const currentResults = await runPerformanceTest();
  
  // Compare results
  let passed = true;
  const regressions = [];
  
  for (const [endpoint, baselineMetrics] of Object.entries(baseline)) {
    const currentMetrics = currentResults[endpoint];
    if (!currentMetrics) {
      console.warn(`Missing current metrics for ${endpoint}`);
      continue;
    }
    
    // Check if current performance is worse than baseline
    if (currentMetrics.medianTimeMs > baselineMetrics.medianTimeMs * REGRESSION_THRESHOLD) {
      passed = false;
      regressions.push({
        endpoint,
        baseline: baselineMetrics.medianTimeMs,
        current: currentMetrics.medianTimeMs,
        degradation: ((currentMetrics.medianTimeMs / baselineMetrics.medianTimeMs) - 1) * 100
      });
    }
  }
  
  // Report results
  if (passed) {
    console.log('✅ Performance regression test passed!');
  } else {
    console.error('❌ Performance regression detected!');
    console.table(regressions.map(r => ({
      Endpoint: r.endpoint,
      'Baseline (ms)': r.baseline.toFixed(2),
      'Current (ms)': r.current.toFixed(2),
      'Degradation (%)': r.degradation.toFixed(2)
    })));
  }
  
  return passed;
}

// Run the check when script is executed directly
if (require.main === module) {
  checkPerformanceRegression()
    .then(passed => process.exit(passed ? 0 : 1))
    .catch(err => {
      console.error('Error running performance regression test:', err);
      process.exit(1);
    });
}
```

## Success Metrics

To measure the success of these optimizations, track the following metrics:

1. **Page Load Performance**:
   - Time to First Contentful Paint (FCP): Target <1.8 seconds
   - Largest Contentful Paint (LCP): Target <2.5 seconds
   - Time to Interactive (TTI): Target <3.5 seconds

2. **API Performance**:
   - Discovery cards API response time: Current ~57ms, target <40ms
   - Matches API response time: Target <50ms
   - Network stats API response time: Target <30ms

3. **Bundle Performance**:
   - Initial JS bundle size: Target reduction of 30%
   - Time to load all critical resources: Target <2 seconds

4. **User Experience Metrics**:
   - Cumulative Layout Shift (CLS): Target <0.1
   - First Input Delay (FID): Target <100ms
   - Swipe animation frame rate: Target 60fps

## Conclusion

The Collab Room application has already established a solid performance foundation, with the three-phase progressive loading system and strategic database indexing demonstrating a strong commitment to optimization. These existing improvements have delivered measurable benefits, such as reducing database query times by 40% and providing an ultra-fast initial rendering experience.

However, our comprehensive analysis reveals significant opportunities to further elevate the application's performance profile:

1. **Building on Database Optimizations**: The existing database indexes provide a strong foundation, but implementing Common Table Expressions (CTEs) and further query restructuring can reduce query execution times from the current ~57ms to under 40ms.

2. **Completing the Code Splitting Strategy**: While some code splitting is implemented, expanding this approach to all routes and optimizing the Telegram WebApp integration will significantly reduce the initial bundle size and improve time-to-interactive metrics.

3. **Addressing Component Rendering Inefficiencies**: Implementing proper component memoization, granular state management, and event handler optimization will eliminate unnecessary re-renders and improve interactive performance.

4. **Implementing Robust Measurement Systems**: The proposed performance testing and monitoring tools will provide ongoing visibility into application performance and prevent regressions as the codebase evolves.

The optimization strategy outlined in this document takes a pragmatic, measured approach - starting with high-impact, low-effort improvements before progressing to more complex implementations. Each recommendation is designed to target specific performance bottlenecks while maintaining compatibility with the application's existing architecture.

By systematically implementing these optimizations, The Collab Room can achieve a truly exceptional performance profile that will translate directly into improved user engagement, satisfaction, and retention. Most importantly, these optimizations will maintain the application's responsive experience even as user numbers grow and feature complexity increases.

## Example Standard Success Response:
{
  "success": true,
  "data": { /* Actual payload */ },
  "message": "Operation successful" // Optional success message
}

## Example Standard Error Response:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR", // Or AUTH_ERROR, NOT_FOUND, SERVER_ERROR etc.
    "message": "Invalid input provided.",
    "details": { /* Optional field-specific errors */ }
  }
}

## Implement helper functions in the backend to create these responses consistently.