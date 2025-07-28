import { z } from "zod";
import { AUDIENCE_SIZE_RANGES } from "@shared/schema";
import { baseCollabFields } from "./baseSchema";

/**
 * Schema for Report & Research Feature collaborations
 */
export const reportSchema = z.object({
  ...baseCollabFields,
  collab_type: z.literal("Report & Research Contributors"),
  report_name: z.string()
    .min(2, "Report name is required"),
  report_link: z.string()
    .url("Please enter a valid report link")
    .or(z.literal("")) // Make it optional by allowing empty string
    .optional(),
  audience_reach: z.enum(AUDIENCE_SIZE_RANGES),
  report_type: z.enum(["Market Report", "Technical Analysis", "Industry Research", "Company Insights", "Other"]),
  // Include details field for backward compatibility with existing data
  details: z.record(z.any()).optional()
});

/**
 * Default values for Report & Research Feature collaborations
 */
export const reportDefaults = {
  collab_type: "Report & Research Contributors",
  report_name: "",
  report_link: "",
  audience_reach: AUDIENCE_SIZE_RANGES[0],
  report_type: "Market Report",
  details: {} // Empty details object for compatibility
};