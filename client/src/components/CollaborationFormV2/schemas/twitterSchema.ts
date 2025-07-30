import { z } from "zod";
import { TWITTER_COLLAB_TYPES, AUDIENCE_SIZE_RANGES } from "@shared/schema";
import { baseCollabFields } from "./baseSchema";
import { createFlexibleCollabTypeSchema } from './utils';
import { COLLAB_TYPE_IDS } from '@shared/collaboration-types';

/**
 * Schema for Twitter Co-marketing collaborations
 */
export const twitterCollabSchema = z.object({
  ...baseCollabFields,
  collab_type: createFlexibleCollabTypeSchema(
    COLLAB_TYPE_IDS.TWITTER_COMARKETING,
    ["Twitter Brand Collab"] // Legacy name support
  ),
  twitter_collab_types: z
    .array(z.enum(TWITTER_COLLAB_TYPES))
    .min(1, "Select at least one collaboration type"),
  estimated_reach: z.enum(AUDIENCE_SIZE_RANGES),
  campaign_duration: z.string()
    .min(1, "Campaign duration is required"),
  // Include details field for backward compatibility with existing data
  details: z.record(z.any()).optional()
});

/**
 * Default values for Twitter collaborations
 */
export const twitterCollabDefaults = {
  collab_type: "Co-Marketing on Twitter",
  twitter_collab_types: [],
  estimated_reach: AUDIENCE_SIZE_RANGES[0],
  campaign_duration: "",
  details: {} // Empty details object for compatibility
};