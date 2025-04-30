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
    .refine((val) => {
      // Accept things like https://x.com/handle and https://twitter.com/handle
      // Be more lenient to avoid frustrating users
      return val.includes('x.com/') || val.includes('twitter.com/');
    }, "Must include a Twitter/X URL (https://x.com/username)"),
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