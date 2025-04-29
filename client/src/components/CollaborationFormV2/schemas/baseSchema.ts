import { z } from "zod";
import {
  COLLAB_TOPICS,
  TWITTER_COLLAB_TYPES,
} from "@shared/schema";

/**
 * Base collaboration fields that are common across all collaboration types
 */
export const baseCollabFields = {
  topics: z.array(z.string())
    .min(1, " ") // Empty space to prevent default zod message
    .max(3, "Maximum 3 topics allowed"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(280, "Description cannot exceed 280 characters"),
  date_type: z.enum(["any_future_date", "specific_date"]),
  specific_date: z.string().optional(),
  is_free_collab: z.boolean()
    .refine(val => val === true, {
      message: "You must confirm this is a free collaboration with no payments involved"
    })
};

// Default form values for new collaborations
export const baseCollabDefaults = {
  topics: [],
  description: "",
  date_type: "specific_date",
  specific_date: new Date().toISOString().split("T")[0],
  is_free_collab: true
};

// Configure optional filter fields for all collaboration types
export const collabFilterFields = {
  filter_company_sectors_enabled: z.boolean().default(false),
  filter_company_followers_enabled: z.boolean().default(false),
  filter_user_followers_enabled: z.boolean().default(false),
  filter_funding_stages_enabled: z.boolean().default(false),
  filter_token_status_enabled: z.boolean().default(false),
  filter_blockchain_networks_enabled: z.boolean().default(false),
  required_company_sectors: z.array(z.string()).default([]),
  required_funding_stages: z.array(z.string()).default([]),
  required_token_status: z.boolean().default(false),
  required_blockchain_networks: z.array(z.string()).default([]),
  min_company_followers: z.string().default("0-1K"),
  min_user_followers: z.string().default("0-1K")
};

// Default filter values
export const collabFilterDefaults = {
  filter_company_sectors_enabled: false,
  filter_company_followers_enabled: false,
  filter_user_followers_enabled: false,
  filter_funding_stages_enabled: false,
  filter_token_status_enabled: false,
  filter_blockchain_networks_enabled: false,
  required_company_sectors: [],
  required_funding_stages: [],
  required_token_status: false,
  required_blockchain_networks: [],
  min_company_followers: "0-1K",
  min_user_followers: "0-1K"
};