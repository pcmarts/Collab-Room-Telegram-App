import { z } from "zod";
import { 
  TWITTER_COLLAB_TYPES, 
  TWITTER_FOLLOWER_COUNTS 
} from "@shared/schema";
import { baseCollabFields } from "./baseSchema";

/**
 * Schema for Twitter Co-marketing collaborations
 * Enforces:
 * - Max 3 Twitter collaboration types
 * - Valid Twitter handle format
 */
export const twitterCollabSchema = z.object({
  ...baseCollabFields,
  collab_type: z.literal("Co-Marketing on Twitter"),
  // Store the Twitter handle directly in the main schema
  twitter_handle: z.string()
    .min(1, "Twitter handle is required")
    .regex(/^https:\/\/x\.com\/[a-zA-Z0-9_]{1,15}$/, "Must be a valid Twitter/X URL (https://x.com/username)"),
  // Store the Twitter collaboration types directly in the main schema
  twitter_collab_types: z.array(z.enum(TWITTER_COLLAB_TYPES))
    .min(1, " ") // Empty space to prevent default zod message
    .max(3, "Maximum 3 Twitter collaboration types allowed"),
  follower_count: z.enum(TWITTER_FOLLOWER_COUNTS),
  // Include details field for backward compatibility with existing data
  details: z.record(z.any()).optional()
});

/**
 * Default values for Twitter collaborations
 */
export const twitterCollabDefaults = {
  collab_type: "Co-Marketing on Twitter",
  twitter_handle: "https://x.com/",
  twitter_collab_types: [],
  follower_count: TWITTER_FOLLOWER_COUNTS[0],
  details: {} // Empty details object for compatibility
};