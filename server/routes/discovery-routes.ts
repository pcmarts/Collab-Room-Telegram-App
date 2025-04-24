/**
 * Discovery Routes
 * 
 * This file contains all routes related to the discovery feature,
 * including the new unified discovery endpoint.
 */

import type { Router } from "express";
import { unifiedDiscoveryEndpoint } from "./unified-discovery-endpoint";

/**
 * Register all discovery-related routes on the Express app
 * @param router The Express router to register routes on
 */
export function registerDiscoveryRoutes(router: Router) {
  // Register the unified discovery endpoint
  router.post("/api/discovery/unified", unifiedDiscoveryEndpoint);
}

/**
 * Get unified discovery data - combines user swipes, potential matches, and collaborations
 * This is a convenience function to get all discovery data in a single call
 */
export async function getUnifiedDiscoveryData(req, res) {
  return unifiedDiscoveryEndpoint(req, res);
}