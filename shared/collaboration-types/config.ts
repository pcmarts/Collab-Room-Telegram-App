/**
 * Collaboration Types Configuration
 * 
 * This file allows easy editing of collaboration type display names
 * without breaking the form or any existing functionality.
 * 
 * To change a display name:
 * 1. Find the collaboration type by its ID in the DISPLAY_NAMES object
 * 2. Change the value to your desired display name
 * 3. The form and UI will automatically use the new name
 * 
 * Example:
 * DISPLAY_NAMES: {
 *   twitter_spaces_guest: "X Spaces Host", // Changed from "Twitter Spaces Guest"
 * }
 */

// Define type locally to avoid circular dependency
type CollabTypeId = 
  | 'twitter_spaces_guest'
  | 'twitter_comarketing'
  | 'podcast_guest'
  | 'livestream_guest'
  | 'research_feature'
  | 'newsletter_feature'
  | 'blog_post_feature';

/**
 * Editable display names for each collaboration type
 * Change these values to update how collaboration types appear in the UI
 */
export const DISPLAY_NAMES: Record<CollabTypeId, string> = {
  twitter_spaces_guest: "Twitter Spaces Guests",
  twitter_comarketing: "Twitter Brand Collab",
  podcast_guest: "Podcast Guests",
  livestream_guest: "Live Stream Guests",
  research_feature: "Report & Research Feature",
  newsletter_feature: "Newsletter Feature",
  blog_post_feature: "Blog Post Feature",
};

/**
 * Short names for use in pills, badges, and compact UI elements
 * These can also be edited as needed
 */
export const SHORT_NAMES: Partial<Record<CollabTypeId, string>> = {
  twitter_spaces_guest: "Spaces",
  twitter_comarketing: "Twitter Brand",
  podcast_guest: "Podcast",
  livestream_guest: "Live Stream",
  research_feature: "Research",
  newsletter_feature: "Newsletter",
  blog_post_feature: "Blog Post",
};

/**
 * Legacy name mappings for backward compatibility
 * Add any old names here to ensure existing data continues to work
 */
export const LEGACY_NAMES: Record<string, CollabTypeId> = {
  // Old names that map to current IDs
  "Twitter Spaces Guests": "twitter_spaces_guest",
  "Twitter Brand Collab": "twitter_comarketing",
  "Podcast Guests": "podcast_guest",
  "Live Stream Guests": "livestream_guest",
  
  // Add any other legacy names here as needed
};

/**
 * Get the current display name for a collaboration type ID
 */
export function getConfiguredDisplayName(id: CollabTypeId): string {
  return DISPLAY_NAMES[id] || id;
}

/**
 * Get the short name for a collaboration type ID
 */
export function getConfiguredShortName(id: CollabTypeId): string {
  return SHORT_NAMES[id] || DISPLAY_NAMES[id] || id;
}