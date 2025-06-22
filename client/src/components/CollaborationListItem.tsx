import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Eye, MessageSquare } from "lucide-react";

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
  };
  isAuthenticated: boolean;
  onViewDetails: () => void;
  onRequestCollaboration?: () => void;
  isPotentialMatch?: boolean;
  collaborationStatus?: 'requested' | 'matched';
  onNavigateToMatches?: () => void;
}

export function CollaborationListItem({
  collaboration,
  isAuthenticated,
  onViewDetails,
  onRequestCollaboration,
  isPotentialMatch = false,
  collaborationStatus,
  onNavigateToMatches
}: CollaborationListItemProps) {
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

  const collabType = collaboration.type || collaboration.collab_type || "Collaboration";
  const description = collaboration.short_description || collaboration.description;

  return (
    <Card className={`p-3 mb-3 hover:shadow-sm transition-shadow ${
      isPotentialMatch ? "ring-2 ring-primary/20 bg-primary/5" : ""
    }`}>
      <div className="flex items-start gap-3">
        {/* Company Logo */}
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage 
            src={collaboration.company_logo_url} 
            alt={collaboration.creator_company_name}
          />
          <AvatarFallback className="bg-blue-100 text-blue-800 text-sm font-medium">
            {getCompanyInitials(collaboration.creator_company_name)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base truncate">
                {collaboration.creator_company_name || "Unknown Company"}
              </h3>
            </div>
            
            {isPotentialMatch && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                Match
              </span>
            )}
          </div>

          {/* Collaboration Type as Pill */}
          <div className="mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(collabType)}`}>
              {collabType}
            </span>
          </div>

          {/* Topics */}
          {collaboration.topics && collaboration.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {collaboration.topics.slice(0, 3).map((topic) => (
                <span 
                  key={topic} 
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-md"
                >
                  {topic}
                </span>
              ))}
              {collaboration.topics.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{collaboration.topics.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="flex items-center gap-1 text-xs px-2 py-1 h-auto border-gray-300 text-gray-700 hover:bg-gray-50 min-w-0 flex-shrink-0"
            >
              <Eye className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Details</span>
            </Button>
            
            {isAuthenticated && collaborationStatus === 'matched' && onNavigateToMatches && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToMatches();
                }}
                className="flex items-center gap-1 text-xs px-2 py-1 h-auto bg-green-600 hover:bg-green-700 text-white min-w-0 flex-shrink-0"
              >
                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Matched</span>
              </Button>
            )}
            
            {isAuthenticated && collaborationStatus === 'requested' && (
              <Button
                size="sm"
                variant="secondary"
                disabled
                className="flex items-center gap-1 text-xs px-2 py-1 h-auto bg-orange-100 text-orange-700 min-w-0 flex-shrink-0"
              >
                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Requested</span>
              </Button>
            )}
            
            {isAuthenticated && !collaborationStatus && onRequestCollaboration && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestCollaboration();
                }}
                className="flex items-center gap-1 text-xs px-2 py-1 h-auto bg-blue-600 hover:bg-blue-700 text-white min-w-0 flex-shrink-0"
              >
                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Request Collaboration</span>
              </Button>
            )}
            
            {!isAuthenticated && (
              <Button
                size="sm"
                variant="secondary"
                disabled
                className="flex items-center gap-1 text-xs px-2 py-1 h-auto opacity-60 bg-gray-100 text-gray-500 min-w-0 flex-shrink-0"
              >
                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Sign up to Request</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}