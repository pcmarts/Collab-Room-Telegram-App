import {
  Mic,
  Video,
  FileText,
  Mail,
  Twitter,
  Megaphone
} from "lucide-react";
import React from "react";

/**
 * Returns the appropriate icon component for a collaboration type
 */
export function getCollabTypeIcon(type: string | undefined): React.ReactNode {
  if (!type) return <Megaphone className="h-4 w-4" />;
  
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('podcast')) {
    return <Mic className="h-4 w-4" />;
  } else if (lowerType.includes('twitter') || lowerType.includes('spaces')) {
    return <Twitter className="h-4 w-4" />;
  } else if (lowerType.includes('livestream') || lowerType.includes('live stream')) {
    return <Video className="h-4 w-4" />;
  } else if (lowerType.includes('research') || lowerType.includes('report')) {
    return <FileText className="h-4 w-4" />;
  } else if (lowerType.includes('newsletter')) {
    return <Mail className="h-4 w-4" />;
  } else if (lowerType.includes('blog') || lowerType.includes('post')) {
    return <FileText className="h-4 w-4" />;
  } else {
    return <Megaphone className="h-4 w-4" />;
  }
}