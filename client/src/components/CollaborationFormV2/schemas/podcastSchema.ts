import { z } from "zod";
import { AUDIENCE_SIZE_RANGES } from "@shared/schema";
import { baseCollabFields } from "./baseSchema";

/**
 * Schema for Podcast Guest Appearance collaborations
 */
export const podcastCollabSchema = z.object({
  ...baseCollabFields,
  collab_type: z.literal("Podcast Guests"),
  podcast_name: z.string()
    .min(2, "Podcast name is required"),
  podcast_link: z.string()
    .url("Please enter a valid podcast link"),
  estimated_reach: z.enum(AUDIENCE_SIZE_RANGES),
  // Include details field for backward compatibility with existing data
  details: z.record(z.any()).optional()
});

/**
 * Default values for Podcast collaborations
 */
export const podcastCollabDefaults = {
  collab_type: "Podcast Guests",
  podcast_name: "",
  podcast_link: "",
  estimated_reach: AUDIENCE_SIZE_RANGES[0],
  details: {} // Empty details object for compatibility
};