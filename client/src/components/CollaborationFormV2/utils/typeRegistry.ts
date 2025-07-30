import { twitterCollabSchema, twitterCollabDefaults } from "../schemas/twitterSchema";
import { podcastCollabSchema, podcastCollabDefaults } from "../schemas/podcastSchema";
import { twitterSpacesSchema, twitterSpacesDefaults } from "../schemas/twitterSpacesSchema";
import { liveStreamSchema, liveStreamDefaults } from "../schemas/liveStreamSchema";
import { reportSchema, reportDefaults } from "../schemas/reportSchema";
import { newsletterSchema, newsletterDefaults } from "../schemas/newsletterSchema";
import { blogPostSchema, blogPostDefaults } from "../schemas/blogPostSchema";

import { CollaborationTypeDefinition } from "../contexts/CollaborationTypeContext";
import { twitterCollabSteps } from "../components/collaboration-types/TwitterCollabForm";
import { podcastCollabSteps } from "../components/collaboration-types/PodcastCollabForm";
import { twitterSpacesSteps } from "../components/collaboration-types/TwitterSpacesForm";
import { liveStreamSteps } from "../components/collaboration-types/LiveStreamForm";
import { reportSteps } from "../components/collaboration-types/ReportForm";
import { newsletterSteps } from "../components/collaboration-types/NewsletterForm";
import { blogPostSteps } from "../components/collaboration-types/BlogPostForm";
import { COLLAB_TYPE_IDS, getCollabTypeId, getCollabTypeDisplayName } from "@shared/collaboration-types";

/**
 * Registry of available collaboration types
 * Uses stable IDs internally while maintaining flexible display names
 * 
 * Add new collaboration types here to make them available in the form
 */
// Form-specific display names - hardcoded for creation form UI
export const formDisplayNames = {
  [COLLAB_TYPE_IDS.TWITTER_SPACES]: "Twitter Spaces Guest",
  [COLLAB_TYPE_IDS.TWITTER_COMARKETING]: "Twitter Co-Marketing Opportunity", 
  [COLLAB_TYPE_IDS.PODCAST]: "Podcast",
  [COLLAB_TYPE_IDS.LIVESTREAM]: "Live Stream Guest Appearance",
  [COLLAB_TYPE_IDS.RESEARCH]: "Report & Research Feature",
  [COLLAB_TYPE_IDS.NEWSLETTER]: "Newsletter Feature",
  [COLLAB_TYPE_IDS.BLOG_POST]: "Blog Post Feature",
};

export const collaborationTypes: CollaborationTypeDefinition[] = [
  {
    id: COLLAB_TYPE_IDS.TWITTER_SPACES,
    name: formDisplayNames[COLLAB_TYPE_IDS.TWITTER_SPACES],
    schema: twitterSpacesSchema,
    defaultValues: twitterSpacesDefaults,
    steps: twitterSpacesSteps
  },
  {
    id: COLLAB_TYPE_IDS.TWITTER_COMARKETING,
    name: formDisplayNames[COLLAB_TYPE_IDS.TWITTER_COMARKETING],
    schema: twitterCollabSchema,
    defaultValues: twitterCollabDefaults,
    steps: twitterCollabSteps
  },
  {
    id: COLLAB_TYPE_IDS.PODCAST,
    name: formDisplayNames[COLLAB_TYPE_IDS.PODCAST],
    schema: podcastCollabSchema,
    defaultValues: podcastCollabDefaults,
    steps: podcastCollabSteps
  },
  {
    id: COLLAB_TYPE_IDS.LIVESTREAM,
    name: formDisplayNames[COLLAB_TYPE_IDS.LIVESTREAM],
    schema: liveStreamSchema,
    defaultValues: liveStreamDefaults,
    steps: liveStreamSteps
  },
  {
    id: COLLAB_TYPE_IDS.RESEARCH,
    name: formDisplayNames[COLLAB_TYPE_IDS.RESEARCH],
    schema: reportSchema,
    defaultValues: reportDefaults,
    steps: reportSteps
  },
  /* Temporarily hidden while fixing validation issues
  {
    id: COLLAB_TYPE_IDS.NEWSLETTER,
    name: "Newsletter Feature",
    schema: newsletterSchema,
    defaultValues: newsletterDefaults,
    steps: newsletterSteps
  },
  {
    id: COLLAB_TYPE_IDS.BLOG_POST,
    name: "Blog Post Feature",
    schema: blogPostSchema,
    defaultValues: blogPostDefaults,
    steps: blogPostSteps
  }
  */
];

/**
 * Get a collaboration type definition by ID or display name
 * Supports both stable IDs and display names for flexibility
 */
export function getCollaborationType(identifier: string): CollaborationTypeDefinition | undefined {
  // First try to find by ID
  let type = collaborationTypes.find(type => type.id === identifier);
  
  // If not found by ID, try to find by display name
  if (!type) {
    type = collaborationTypes.find(type => type.name === identifier);
  }
  
  // If still not found, try to convert display name to ID
  if (!type) {
    const typeId = getCollabTypeId(identifier);
    if (typeId) {
      type = collaborationTypes.find(type => type.id === typeId);
    }
  }
  
  return type;
}

/**
 * Register a new collaboration type
 * This should be called from the application initialization code
 */
export function registerCollaborationType(type: CollaborationTypeDefinition): void {
  const existingIndex = collaborationTypes.findIndex(t => t.id === type.id);
  
  if (existingIndex >= 0) {
    // Replace existing type
    collaborationTypes[existingIndex] = type;
  } else {
    // Add new type
    collaborationTypes.push(type);
  }
}