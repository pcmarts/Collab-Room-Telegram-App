import { z } from "zod";
import { AUDIENCE_SIZE_RANGES } from "@shared/schema";
import { baseCollabFields } from "./baseSchema";

/**
 * Schema for Blog Post Feature collaborations
 */
export const blogPostSchema = z.object({
  ...baseCollabFields,
  collab_type: z.literal("Blog Post Feature"),
  blog_name: z.string()
    .min(2, "Blog name is required"),
  blog_url: z.string()
    .url("Please enter a valid blog URL"),
  monthly_visitors: z.enum(AUDIENCE_SIZE_RANGES),
  // Include details field for backward compatibility with existing data
  details: z.record(z.any()).optional()
});

/**
 * Default values for Blog Post Feature collaborations
 */
export const blogPostDefaults = {
  collab_type: "Blog Post Feature",
  blog_name: "",
  blog_url: "",
  monthly_visitors: AUDIENCE_SIZE_RANGES[0],
  details: {} // Empty details object for compatibility
};