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

/**
 * Registry of available collaboration types
 * 
 * Add new collaboration types here to make them available in the form
 */
export const collaborationTypes: CollaborationTypeDefinition[] = [
  {
    id: "Twitter Spaces Guest",
    name: "Twitter Spaces Guest",
    schema: twitterSpacesSchema,
    defaultValues: twitterSpacesDefaults,
    steps: twitterSpacesSteps
  },
  {
    id: "Co-Marketing on Twitter",
    name: "Twitter Co-marketing",
    schema: twitterCollabSchema,
    defaultValues: twitterCollabDefaults,
    steps: twitterCollabSteps
  },
  {
    id: "Podcast Guest Appearance",
    name: "Podcast Guest Appearance",
    schema: podcastCollabSchema,
    defaultValues: podcastCollabDefaults,
    steps: podcastCollabSteps
  },
  {
    id: "Live Stream Guest Appearance",
    name: "Live Stream Guest Appearance",
    schema: liveStreamSchema,
    defaultValues: liveStreamDefaults,
    steps: liveStreamSteps
  },
  {
    id: "Report & Research Feature",
    name: "Report & Research Feature",
    schema: reportSchema,
    defaultValues: reportDefaults,
    steps: reportSteps
  },
  {
    id: "Newsletter Feature",
    name: "Newsletter Feature",
    schema: newsletterSchema,
    defaultValues: newsletterDefaults,
    steps: newsletterSteps
  },
  {
    id: "Blog Post Feature",
    name: "Blog Post Feature",
    schema: blogPostSchema,
    defaultValues: blogPostDefaults,
    steps: blogPostSteps
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