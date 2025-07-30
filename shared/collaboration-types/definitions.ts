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
    color: 'blue',
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
    color: 'blue',
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
    color: 'purple',
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
    color: 'red',
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
    color: 'amber',
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
    color: 'indigo',
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
    color: 'emerald',
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
    color: 'orange',
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
      'Podcast'
    ]
  },
  {
    typeId: 'livestream_guest',
    legacyNames: [
      'Live Stream Guest Appearance',
      'Live Stream',
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
 * Color scheme mapping for Tailwind CSS classes
 */
export const COLOR_SCHEMES = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-200'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-200'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    hover: 'hover:bg-red-200'
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    hover: 'hover:bg-amber-200'
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    hover: 'hover:bg-indigo-200'
  },
  emerald: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    hover: 'hover:bg-emerald-200'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-200'
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-200'
  }
};