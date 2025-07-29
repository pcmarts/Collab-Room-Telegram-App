import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { SignupToCollaborateDialog } from "@/components/SignupToCollaborateDialog";
import { Building2, Eye, MessageSquare, Mic, Video, Mail, FileText, FileSearch, Coffee, Twitter, PenTool, ListChecks, ChevronRight } from "lucide-react";
import { useState } from "react";

interface CollaborationListItemProps {
  collaboration: {
    id: string;
    title?: string;
    type?: string;
    collab_type?: string;
    creator_company_name?: string;
    company_logo_url?: string;
    short_description?: string;
    description?: string;
    topics?: string[];
    creator_id?: string;
  };
  isAuthenticated: boolean;
  onViewDetails: () => void;
  onRequestCollaboration?: () => void;
  isPotentialMatch?: boolean;
  collaborationStatus?: 'requested' | 'matched';
  onNavigateToMatches?: () => void;
  currentUserId?: string;
  isApplicationPending?: boolean;
}

export function CollaborationListItem({
  collaboration,
  isAuthenticated,
  onViewDetails,
  onRequestCollaboration,
  isPotentialMatch = false,
  collaborationStatus,
  onNavigateToMatches,
  currentUserId,
  isApplicationPending = false
}: CollaborationListItemProps) {
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  // Get company initials for fallback avatar
  const getCompanyInitials = (name?: string) => {
    if (!name) return "CO";
    return name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Get collaboration type color
  const getTypeColor = (type?: string) => {
    if (!type) return "bg-gray-100 text-gray-800";
    const lowerType = type.toLowerCase();
    if (lowerType.includes("twitter") || lowerType.includes("social")) return "bg-blue-100 text-blue-800";
    if (lowerType.includes("podcast")) return "bg-purple-100 text-purple-800";
    if (lowerType.includes("blog") || lowerType.includes("content")) return "bg-emerald-100 text-emerald-800";
    if (lowerType.includes("research") || lowerType.includes("report")) return "bg-amber-100 text-amber-800";
    if (lowerType.includes("newsletter")) return "bg-indigo-100 text-indigo-800";
    if (lowerType.includes("livestream") || lowerType.includes("stream")) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  // Get collaboration type icon
  const getCollabTypeIcon = (collabType: string) => {
    const lowerType = collabType.toLowerCase();
    if (lowerType.includes('podcast')) {
      return <Mic className="h-4 w-4" />;
    }
    if (lowerType.includes('twitter') || lowerType.includes('social')) {
      return <Twitter className="h-4 w-4" />;
    }
    if (lowerType.includes('live stream') || lowerType.includes('livestream') || lowerType.includes('webinar')) {
      return <Video className="h-4 w-4" />;
    }
    if (lowerType.includes('newsletter')) {
      return <Mail className="h-4 w-4" />;
    }
    if (lowerType.includes('blog')) {
      return <PenTool className="h-4 w-4" />;
    }
    if (lowerType.includes('research') || lowerType.includes('report')) {
      return <FileSearch className="h-4 w-4" />;
    }
    if (lowerType.includes('coffee')) {
      return <Coffee className="h-4 w-4" />;
    }
    // Default collaboration icon
    return <MessageSquare className="h-4 w-4" />;
  };

  const collabType = collaboration.type || collaboration.collab_type || "Collaboration";
  const description = collaboration.short_description || collaboration.description;
  
  // Check if this is the user's own collaboration
  const isOwnCollaboration = isAuthenticated && currentUserId && collaboration.creator_id === currentUserId;

  return (
    <Card 
      className={`p-3 mb-3 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer ${
        isPotentialMatch ? "ring-2 ring-primary/20 bg-primary/5" : ""
      }`}
      onClick={onViewDetails}
    >
      <div className="flex items-start gap-3">
        {/* Company Logo */}
        <LogoAvatar 
          name={collaboration.creator_company_name || "Company"}
          logoUrl={collaboration.company_logo_url} 
          className="w-10 h-10"
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base truncate mb-2">
                {collaboration.creator_company_name || "Unknown Company"}
              </h3>
              
              {/* Looking For section */}
              <div className="space-y-2">
                <span className="text-sm text-gray-600">Looking for</span>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(collabType)}`}>
                    {getCollabTypeIcon(collabType)}
                    <span>{collabType}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {isPotentialMatch && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  Match
                </span>
              )}
            </div>
          </div>

          {/* Topics - Hidden on discover page, still available in details dialog */}

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-500 italic line-clamp-3 mb-2">
              {description}
            </p>
          )}
        </div>
        
        {/* Right Arrow Indicator */}
        <div className="flex items-center justify-center self-center flex-shrink-0">
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      
      {/* Signup Dialog for non-authenticated users */}
      <SignupToCollaborateDialog
        open={showSignupDialog}
        onOpenChange={setShowSignupDialog}
        companyName={collaboration.creator_company_name || "Unknown Company"}
        companyLogoUrl={collaboration.company_logo_url}
        collaborationType={collabType}
      />
    </Card>
  );
}