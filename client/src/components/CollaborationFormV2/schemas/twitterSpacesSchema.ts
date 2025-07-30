import { z } from "zod";
import { AUDIENCE_SIZE_RANGES } from "@shared/schema";
import { baseCollabFields } from "./baseSchema";

/**
 * Schema for Twitter Spaces Guest collaborations
 */
export const twitterSpacesSchema = z.object({
  ...baseCollabFields,
  collab_type: z.literal("Twitter Spaces Guests"),
  spaces_theme: z.string()
    .min(2, "Spaces theme is required"),
  estimated_audience: z.enum(AUDIENCE_SIZE_RANGES),
  duration_minutes: z.string()
    .min(1, "Duration is required"),
  recording_permitted: z.boolean().default(true),
  // Include details field for backward compatibility with existing data
  details: z.record(z.any()).optional()
});

/**
 * Default values for Twitter Spaces collaborations
 */
export const twitterSpacesDefaults = {
  collab_type: "Twitter Spaces Guests",
  spaces_theme: "",
  estimated_audience: AUDIENCE_SIZE_RANGES[0],
  duration_minutes: "",
  recording_permitted: true,
  details: {} // Empty details object for compatibility
};