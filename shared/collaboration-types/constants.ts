/**
 * Stable collaboration type IDs that never change
 * These are used internally in the database and for schema validation
 */
export const COLLAB_TYPE_IDS = {
  TWITTER_SPACES: 'twitter_spaces_guest',
  TWITTER_COMARKETING: 'twitter_comarketing',
  PODCAST: 'podcast_guest',
  LIVESTREAM: 'livestream_guest',
  RESEARCH: 'research_feature',
  NEWSLETTER: 'newsletter_feature',
  BLOG_POST: 'blog_post_feature',
} as const;

export type CollabTypeId = typeof COLLAB_TYPE_IDS[keyof typeof COLLAB_TYPE_IDS];

/**
 * Maps display names to stable IDs
 * This allows changing display names without breaking existing data
 */
export const DISPLAY_NAME_TO_ID_MAP: Record<string, CollabTypeId> = {
  // Current display names
  "Twitter Spaces Guest": COLLAB_TYPE_IDS.TWITTER_SPACES,
  "Co-Marketing on Twitter": COLLAB_TYPE_IDS.TWITTER_COMARKETING,
  "Podcast Guest Appearance": COLLAB_TYPE_IDS.PODCAST,
  "Live Stream Guest Appearance": COLLAB_TYPE_IDS.LIVESTREAM,
  "Report & Research Feature": COLLAB_TYPE_IDS.RESEARCH,
  "Newsletter Feature": COLLAB_TYPE_IDS.NEWSLETTER,
  "Blog Post Feature": COLLAB_TYPE_IDS.BLOG_POST,
  
  // Legacy names for backward compatibility
  "Twitter Spaces Guests": COLLAB_TYPE_IDS.TWITTER_SPACES,
  "Twitter Brand Collab": COLLAB_TYPE_IDS.TWITTER_COMARKETING,
  "Podcast Guests": COLLAB_TYPE_IDS.PODCAST,
  "Live Stream Guests": COLLAB_TYPE_IDS.LIVESTREAM,
};

/**
 * Reverse mapping from IDs to current display names
 */
export const ID_TO_DISPLAY_NAME_MAP: Record<CollabTypeId, string> = {
  [COLLAB_TYPE_IDS.TWITTER_SPACES]: "Twitter Spaces Guest",
  [COLLAB_TYPE_IDS.TWITTER_COMARKETING]: "Co-Marketing on Twitter",
  [COLLAB_TYPE_IDS.PODCAST]: "Podcast Guest Appearance",
  [COLLAB_TYPE_IDS.LIVESTREAM]: "Live Stream Guest Appearance",
  [COLLAB_TYPE_IDS.RESEARCH]: "Report & Research Feature",
  [COLLAB_TYPE_IDS.NEWSLETTER]: "Newsletter Feature",
  [COLLAB_TYPE_IDS.BLOG_POST]: "Blog Post Feature",
};

/**
 * Helper function to get stable ID from display name
 */
export function getCollabTypeId(displayName: string): CollabTypeId | null {
  return DISPLAY_NAME_TO_ID_MAP[displayName] || null;
}

/**
 * Helper function to get display name from ID
 */
export function getCollabTypeDisplayName(id: CollabTypeId): string {
  return ID_TO_DISPLAY_NAME_MAP[id] || id;
}

/**
 * Helper function to normalize collaboration type
 * Converts any known variation to the stable ID
 */
export function normalizeCollabType(type: string): CollabTypeId | string {
  const id = getCollabTypeId(type);
  return id || type; // Return original if not found
}