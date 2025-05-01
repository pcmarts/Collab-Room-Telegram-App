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
  newsletter_url: z.string()
    .url("Please enter a valid URL")
    .or(z.literal(""))
    .optional(),
  subscriber_count: z.enum(AUDIENCE_SIZE_RANGES),
  // Include details field for backward compatibility with existing data
  details: z.record(z.any()).optional()
});

/**
 * Default values for Newsletter Feature collaborations
 */
export const newsletterDefaults = {
  collab_type: "Newsletter Feature",
  newsletter_name: "",
  newsletter_url: "",
  subscriber_count: AUDIENCE_SIZE_RANGES[0],
  details: {} // Empty details object for compatibility
};