/**
 * Method implementation for getDiscoveryData to add to DatabaseStorage class
 * 
 * To use this:
 * 1. Add the method to the DatabaseStorage class in server/storage.ts
 * 2. Copy the code below (excluding comments) and paste before another method
 */

/**
 * Optimized method to get all discovery data in a single request
 * Combines user swipes, potential matches, and collaborations into one response
 */
async getDiscoveryData(userId: string, filters: CollaborationFilters): Promise<{
  userSwipes: Swipe[],
  potentialMatches: any[],
  collaborations: PaginatedCollaborations
}> {
  console.log(`============ DEBUG: Unified Discovery Data Request ============`);
  console.log(`Fetching unified discovery data for user: ${userId}`);
  const startTime = Date.now();
  
  // Execute all database queries in parallel for better performance
  const [userSwipes, potentialMatches, collaborations] = await Promise.all([
    // Get user swipes
    this.getUserSwipes(userId),
    
    // Get potential matches
    this.getPotentialMatchesForHost(userId),
    
    // Get collaborations with filtering
    this.searchCollaborationsPaginated(userId, filters)
  ]);
  
  const executionTime = Date.now() - startTime;
  console.log(`Unified discovery data fetched in ${executionTime}ms`);
  console.log(`- User swipes: ${userSwipes.length}`);
  console.log(`- Potential matches: ${potentialMatches.length}`);
  console.log(`- Collaborations: ${collaborations.items.length} (hasMore: ${collaborations.hasMore})`);
  
  return {
    userSwipes,
    potentialMatches,
    collaborations
  };
}