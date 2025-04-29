import { twitterCollabSchema, twitterCollabDefaults } from "../schemas/twitterSchema";
import { podcastCollabSchema, podcastCollabDefaults } from "../schemas/podcastSchema";
import { CollaborationTypeDefinition } from "../contexts/CollaborationTypeContext";
import { twitterCollabSteps } from "../components/collaboration-types/TwitterCollabForm";

/**
 * Registry of available collaboration types
 * 
 * Add new collaboration types here to make them available in the form
 */
export const collaborationTypes: CollaborationTypeDefinition[] = [
  {
    id: "Co-Marketing on Twitter",
    name: "Co-Marketing on Twitter",
    schema: twitterCollabSchema,
    defaultValues: twitterCollabDefaults,
    steps: twitterCollabSteps
  },
  {
    id: "Podcast Guest Appearance",
    name: "Podcast Guest Appearance",
    schema: podcastCollabSchema,
    defaultValues: podcastCollabDefaults,
    steps: [
      {
        id: "podcast_topics",
        title: "Topics",
        description: "What topics will this podcast cover?",
      },
      {
        id: "podcast_details",
        title: "Podcast Details",
        description: "Tell us about your podcast",
      },
      {
        id: "podcast_audience",
        title: "Audience Size",
        description: "How many listeners does the podcast have?",
      },
      {
        id: "podcast_description",
        title: "Description",
        description: "Add a short description (max 280 characters)",
      }
    ]
  }
];

/**
 * Get a collaboration type definition by ID
 */
export function getCollaborationType(id: string): CollaborationTypeDefinition | undefined {
  return collaborationTypes.find(type => type.id === id);
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