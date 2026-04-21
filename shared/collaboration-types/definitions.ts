import {
  Twitter,
  Mic,
  Video,
  FileText,
  Mail,
  BarChart,
  Coffee,
  Megaphone,
} from "lucide-react";
import { CollaborationType, CollaborationCategory } from "./types";

/**
 * Centralized collaboration type definitions
 * This is the single source of truth for all collaboration types
 */
export const COLLABORATION_TYPE_DEFINITIONS: CollaborationType[] = [
  {
    id: 'twitter_spaces_guest',
    name: 'Twitter Spaces Guest',
    shortName: 'Spaces Guest',
    icon: Twitter,
    color: 'brand',
    category: CollaborationCategory.SOCIAL_MEDIA,
    isActive: true,
    metadata: {
      description: 'Join as a guest speaker on Twitter Spaces',
      keywords: ['twitter', 'spaces', 'audio', 'live', 'social'],
      estimatedDuration: '30-60 minutes'
    }
  },
  {
    id: 'twitter_comarketing',
    name: 'Co-Marketing on Twitter',
    shortName: 'Co-Marketing',
    icon: Twitter,
    color: 'brand',
    category: CollaborationCategory.MARKETING,
    isActive: true,
    metadata: {
      description: 'Collaborative marketing campaigns on Twitter',
      keywords: ['twitter', 'marketing', 'campaign', 'promotion', 'social'],
      estimatedDuration: 'Varies'
    }
  },
  {
    id: 'podcast_guest',
    name: 'Podcast Guest Appearance',
    shortName: 'Podcast Guest',
    icon: Mic,
    color: 'brand-dark',
    category: CollaborationCategory.CONTENT,
    isActive: true,
    metadata: {
      description: 'Appear as a guest on podcasts',
      keywords: ['podcast', 'guest', 'audio', 'interview', 'content'],
      estimatedDuration: '30-90 minutes'
    }
  },
  {
    id: 'livestream_guest',
    name: 'Live Stream Guest Appearance',
    shortName: 'Live Stream',
    icon: Video,
    color: 'brand-dark',
    category: CollaborationCategory.CONTENT,
    isActive: true,
    metadata: {
      description: 'Join live streams as a guest',
      keywords: ['livestream', 'stream', 'video', 'live', 'guest'],
      estimatedDuration: '30-120 minutes'
    }
  },
  {
    id: 'research_feature',
    name: 'Report & Research Feature',
    shortName: 'Research',
    icon: BarChart,
    color: 'warm',
    category: CollaborationCategory.CONTENT,
    isActive: true,
    metadata: {
      description: 'Be featured in research reports and studies',
      keywords: ['research', 'report', 'data', 'analysis', 'feature'],
      estimatedDuration: '1-2 weeks'
    }
  },
  {
    id: 'newsletter_feature',
    name: 'Newsletter Feature',
    shortName: 'Newsletter',
    icon: Mail,
    color: 'brand',
    category: CollaborationCategory.CONTENT,
    isActive: true,
    metadata: {
      description: 'Be featured in newsletters',
      keywords: ['newsletter', 'feature', 'email', 'content', 'marketing'],
      estimatedDuration: '1-2 weeks'
    }
  },
  {
    id: 'blog_post_feature',
    name: 'Blog Post Feature',
    shortName: 'Blog Post',
    icon: FileText,
    color: 'success',
    category: CollaborationCategory.CONTENT,
    isActive: true,
    metadata: {
      description: 'Be featured in blog posts',
      keywords: ['blog', 'post', 'feature', 'content', 'writing'],
      estimatedDuration: '1-3 weeks'
    }
  },
  {
    id: 'conference_coffee',
    name: 'Conference Coffee',
    shortName: 'Coffee',
    icon: Coffee,
    color: 'muted',
    category: CollaborationCategory.EVENTS,
    isActive: true,
    metadata: {
      description: 'Meet for coffee at conferences and events',
      keywords: ['conference', 'coffee', 'meeting', 'networking', 'event'],
      estimatedDuration: '30-60 minutes'
    }
  },
];

/**
 * Legacy name mappings for backward compatibility
 * Maps old hardcoded names to stable type IDs
 */
export const LEGACY_NAME_MAPPINGS = [
  {
    typeId: 'twitter_spaces_guest',
    legacyNames: [
      'Twitter Spaces Guest',
      'Twitter Spaces Guests',
      'Twitter Space',
      'Spaces Guest'
    ]
  },
  {
    typeId: 'twitter_comarketing',
    legacyNames: [
      'Co-Marketing on Twitter',
      'Twitter Co-Marketing',
      'Twitter Co-marketing',
      'Twitter Comarketing',
      'Twitter Brand Collab',
      'Twitter Marketing'
    ]
  },
  {
    typeId: 'podcast_guest',
    legacyNames: [
      'Podcast Guest Appearance',
      'Podcast Guest',
      'Podcast Guests',
      'Podcast'
    ]
  },
  {
    typeId: 'livestream_guest',
    legacyNames: [
      'Live Stream Guest Appearance',
      'Live Stream',
      'Live Stream Guests',
      'Livestream',
      'Live stream',
      'Webinar'
    ]
  },
  {
    typeId: 'research_feature',
    legacyNames: [
      'Report & Research Feature',
      'Research Report',
      'Research Feature'
    ]
  },
  {
    typeId: 'newsletter_feature',
    legacyNames: [
      'Newsletter Feature',
      'Newsletter'
    ]
  },
  {
    typeId: 'blog_post_feature',
    legacyNames: [
      'Blog Post Feature',
      'Blog Post Collaboration',
      'Blog Post',
      'Blog'
    ]
  },
  {
    typeId: 'conference_coffee',
    legacyNames: [
      'Conference Coffee',
      'Coffee'
    ]
  },
];

/**
 * Color scheme mapping for Tailwind CSS classes.
 *
 * Aligned to the brand token system: every collab type renders in one of a
 * small, deliberate palette (brand blue, navy, peach, success, muted) instead
 * of a 6-way rainbow. Legacy color keys (blue/purple/red/etc.) are mapped to
 * brand-equivalent schemes so older callers degrade gracefully.
 */
const brandScheme = {
  bg: 'bg-brand-subtle',
  text: 'text-brand',
  border: 'border-brand/20',
  hover: 'hover:bg-brand-subtle'
};

const brandDarkScheme = {
  bg: 'bg-brand-dark-subtle',
  text: 'text-brand-dark',
  border: 'border-brand-dark/20',
  hover: 'hover:bg-brand-dark-subtle'
};

const warmScheme = {
  bg: 'bg-warm-surface',
  text: 'text-warm-accent',
  border: 'border-warm-accent/20',
  hover: 'hover:bg-warm-surface-strong'
};

const successScheme = {
  bg: 'bg-success/10',
  text: 'text-success',
  border: 'border-success/20',
  hover: 'hover:bg-success/15'
};

const mutedScheme = {
  bg: 'bg-surface',
  text: 'text-text-muted',
  border: 'border-hairline',
  hover: 'hover:bg-surface-raised'
};

export const COLOR_SCHEMES = {
  brand: brandScheme,
  'brand-dark': brandDarkScheme,
  warm: warmScheme,
  success: successScheme,
  muted: mutedScheme,
  // Legacy aliases — map old color names onto the brand palette
  blue: brandScheme,
  indigo: brandScheme,
  purple: brandDarkScheme,
  red: brandDarkScheme,
  amber: warmScheme,
  orange: warmScheme,
  emerald: successScheme,
  gray: mutedScheme,
};