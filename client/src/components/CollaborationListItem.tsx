import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Eye, MessageSquare } from "lucide-react";

interface CollaborationListItemProps {
  collaboration: {
    id: string;
    title: string;
    type: string;
    creator_company_name?: string;
    company_logo_url?: string;
    short_description?: string;
    topics?: string[];
  };
  isAuthenticated: boolean;
  onViewDetails: () => void;
  onRequestCollaboration?: () => void;
  isPotentialMatch?: boolean;
}

export function CollaborationListItem({
  collaboration,
  isAuthenticated,
  onViewDetails,
  onRequestCollaboration,
  isPotentialMatch = false
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

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
      isPotentialMatch ? "ring-2 ring-primary/20 bg-primary/5" : ""
    }`}>
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarImage 
            src={collaboration.company_logo_url} 
            alt={collaboration.creator_company_name}
          />
          <AvatarFallback className="bg-primary/10 text-primary">
            {collaboration.company_logo_url ? (
              <Building2 className="w-6 h-6" />
            ) : (
              getCompanyInitials(collaboration.creator_company_name)
            )}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {collaboration.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {collaboration.creator_company_name || "Unknown Company"}
              </p>
            </div>
            
            {isPotentialMatch && (
              <Badge variant="secondary" className="flex-shrink-0">
                <MessageSquare className="w-3 h-3 mr-1" />
                Match
              </Badge>
            )}
          </div>

          {/* Collaboration Type Badge */}
          <Badge 
            className={`mb-2 ${getTypeColor(collaboration.type)}`}
            variant="secondary"
          >
            {collaboration.type || "Collaboration"}
          </Badge>

          {/* Topics */}
          {collaboration.topics && collaboration.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {collaboration.topics.slice(0, 3).map((topic) => (
                <Badge 
                  key={topic} 
                  variant="outline" 
                  className="text-xs"
                >
                  {topic}
                </Badge>
              ))}
              {collaboration.topics.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{collaboration.topics.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Description */}
          {collaboration.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {collaboration.short_description}
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
              className="flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View Details
            </Button>
            
            {isAuthenticated && onRequestCollaboration && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestCollaboration();
                }}
                className="flex items-center gap-1"
              >
                <MessageSquare className="w-4 h-4" />
                {isPotentialMatch ? "Accept Match" : "Request Collaboration"}
              </Button>
            )}
            
            {!isAuthenticated && (
              <Button
                size="sm"
                variant="secondary"
                disabled
                className="flex items-center gap-1 opacity-60"
              >
                <MessageSquare className="w-4 h-4" />
                Sign in to Request
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}