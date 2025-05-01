import { z } from "zod";
import { AUDIENCE_SIZE_RANGES } from "@shared/schema";
import { baseCollabFields } from "./baseSchema";

/**
 * Schema for Live Stream Guest Appearance collaborations
 */
export const liveStreamSchema = z.object({
  ...baseCollabFields,
  collab_type: z.literal("Live Stream Guest Appearance"),
  platform_name: z.string()
    .min(2, "Platform name is required"),
  stream_link: z.string()
    .url("Please enter a valid URL for the stream link")
    .optional()
    .or(z.literal('')),
  audience_size: z.enum(AUDIENCE_SIZE_RANGES),
  // Include details field for backward compatibility with existing data
  details: z.record(z.any()).optional()
});

/**
 * Default values for Live Stream Guest Appearance collaborations
 */
export const liveStreamDefaults = {
  collab_type: "Live Stream Guest Appearance",
  platform_name: "",
  stream_link: "",
  audience_size: AUDIENCE_SIZE_RANGES[0],
  details: {} // Empty details object for compatibility
};