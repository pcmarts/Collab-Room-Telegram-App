import { z } from "zod";
import { AUDIENCE_SIZE_RANGES } from "@shared/schema";
import { baseCollabFields } from "./baseSchema";

/**
 * Schema for Newsletter Feature collaborations
 */
export const newsletterSchema = z.object({
  ...baseCollabFields,
  collab_type: z.literal("Newsletter Feature"),
  newsletter_name: z.string()
    .min(2, "Newsletter name is required"),
  subscriber_count: z.enum(AUDIENCE_SIZE_RANGES),
  format: z.enum(["feature", "interview", "review", "guest post", "other"]),
  // Include details field for backward compatibility with existing data
  details: z.record(z.any()).optional()
});

/**
 * Default values for Newsletter Feature collaborations
 */
export const newsletterDefaults = {
  collab_type: "Newsletter Feature",
  newsletter_name: "",
  subscriber_count: AUDIENCE_SIZE_RANGES[0],
  format: "feature",
  details: {} // Empty details object for compatibility
};