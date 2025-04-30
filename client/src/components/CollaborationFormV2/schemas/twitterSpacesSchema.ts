import { z } from "zod";
import { TWITTER_FOLLOWER_COUNTS } from "@shared/schema";
import { baseCollabFields } from "./baseSchema";

/**
 * Schema for Twitter Spaces Guest collaborations
 */
export const twitterSpacesSchema = z.object({
  ...baseCollabFields,
  collab_type: z.literal("Twitter Spaces Guest"),
  twitter_handle: z.string()
    .min(1, "Twitter handle is required")
    .regex(/^https:\/\/x\.com\/[a-zA-Z0-9_]{1,15}$/, "Must be a valid Twitter/X URL (https://x.com/username)"),
  host_follower_count: z.enum(TWITTER_FOLLOWER_COUNTS),
  // Include details field for backward compatibility with existing data
  details: z.record(z.any()).optional()
});

/**
 * Default values for Twitter Spaces Guest collaborations
 */
export const twitterSpacesDefaults = {
  collab_type: "Twitter Spaces Guest",
  twitter_handle: "https://x.com/",
  host_follower_count: TWITTER_FOLLOWER_COUNTS[0],
  details: {} // Empty details object for compatibility
};