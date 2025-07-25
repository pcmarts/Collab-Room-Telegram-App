import { useEffect, useRef } from 'react';

// Navigation routes that should be preloaded
const NAVIGATION_ROUTES = [
  {
    path: '/discover',
    loader: () => import('@/pages/DiscoverPageList'),
    component: 'DiscoverPageList'
  },
  {
    path: '/my-collaborations',
    loader: () => import('@/pages/my-collaborations'),
    component: 'MyCollaborations'
  },
  {
    path: '/dashboard',
    loader: () => import('@/pages/dashboard'),
    component: 'Dashboard'
  },
  {
    path: '/matches',
    loader: () => import('@/pages/MatchesPage'),
    component: 'MatchesPage'
  },
  {
    path: '/requests',
    loader: () => import('@/pages/requests'),
    component: 'RequestsPage'
  }
];

export function useNavigationPreloader() {
  const preloadedRoutes = useRef<Set<string>>(new Set());
  const preloadingRoutes = useRef<Set<string>>(new Set());

  const preloadRoute = async (routePath: string) => {
    // Skip if already preloaded or currently preloading
    if (preloadedRoutes.current.has(routePath) || preloadingRoutes.current.has(routePath)) {
      return;
    }

    const route = NAVIGATION_ROUTES.find(r => r.path === routePath);
    if (!route) return;

    preloadingRoutes.current.add(routePath);

    try {
      await route.loader();
      preloadedRoutes.current.add(routePath);
      console.log(`[Navigation Preloader] Successfully preloaded ${route.component}`);
    } catch (error) {
      console.error(`[Navigation Preloader] Failed to preload ${route.component}:`, error);
    } finally {
      preloadingRoutes.current.delete(routePath);
    }
  };

  const preloadAllNavigation = async () => {
    console.log('[Navigation Preloader] Starting preload of all navigation components');
    
    // Preload all navigation routes in parallel
    const preloadPromises = NAVIGATION_ROUTES.map(route => preloadRoute(route.path));
    
    try {
      await Promise.all(preloadPromises);
      console.log('[Navigation Preloader] All navigation components preloaded successfully');
    } catch (error) {
      console.error('[Navigation Preloader] Error preloading navigation components:', error);
    }
  };

  const isPreloaded = (routePath: string) => {
    return preloadedRoutes.current.has(routePath);
  };

  const isPreloading = (routePath: string) => {
    return preloadingRoutes.current.has(routePath);
  };

  return {
    preloadRoute,
    preloadAllNavigation,
    isPreloaded,
    isPreloading
  };
} 