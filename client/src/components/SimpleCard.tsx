import React, { useState } from "react";
import { openTelegramLink, createTwitterUrl, createTelegramLinkHandler, isIOSDevice } from "@/utils/TelegramHelper";
import DirectButton from "@/components/ui/direct-button";

// TypeScript definitions for Telegram WebApp API
interface TelegramWebApp {
  openLink: (url: string) => void;
  // Include other WebApp methods as needed
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    }
  }
}

import {
  Calendar,
  Check,
  Info,
  Link,
  Mail,
  Mic,
  Twitter,
  Users,
  Video,
  X,
  FileText,
  FileSearch,
  Building,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import AddNoteDialog from "./AddNoteDialog";

export interface SimpleCardProps {
  data: {
    id: string;
    creator_company_name?: string;
    creator_company_logo_url?: string;
    creator_id?: string;
    title?: string;
    collab_type?: string;
    description?: string;
    date?: string;
    specific_date?: string;
    isPotentialMatch?: boolean;
    isActive?: boolean;
    details?: Record<string, any>;
    // Add company_data for enriched company information
    company_data?: {
      id?: string;
      name?: string;
      logo_url?: string;
      description?: string;
      sector?: string;
      twitter_handle?: string;
    };
    potentialMatchData?: {
      user_id?: string;
      id?: string;
      first_name?: string;
      last_name?: string;
      company_name?: string;
      company_logo_url?: string;
      company_description?: string;
      company_website?: string;
      company_twitter?: string;
      company_linkedin?: string;
      job_title?: string;
      twitter_followers?: string;
      company_twitter_followers?: string;
      swipe_created_at?: string;
      collaboration_id?: string;
      note?: string;
      industry?: string;
    };
  };
  // Support both naming conventions for the swipe handler
  onSwipe?: (direction: "left" | "right", note?: string) => void;
  handleSwipe?: (direction: "left" | "right", note?: string) => void; 
  onInfoClick?: () => void;
  handleDetailsClick?: (id: string) => void;
}

export default function SimpleCard({
  data,
  onSwipe,
  handleSwipe: propHandleSwipe,  // Renamed to avoid conflict
  onInfoClick,
  handleDetailsClick,
}: SimpleCardProps) {
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  // Use either onSwipe or handleSwipe prop based on which is provided
  const handleSwipeAction = (direction: "left" | "right", note?: string) => {
    try {
      if (propHandleSwipe) {
        propHandleSwipe(direction, note);
      } else if (onSwipe) {
        onSwipe(direction, note);
      }
      // Silent if no handlers provided
    } catch (error) {
      // Silent error handling
    }
  };
  
  // For compatibility with existing code that might call handleSwipe
  const handleSwipe = handleSwipeAction;

  const handleButtonClick = (direction: "left" | "right") => {
    try {
      if (direction === "right") {
        setShowNoteDialog(true);
      } else {
        handleSwipeAction(direction);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const viewDetailsHandler = () => {
    if (handleDetailsClick && data.id) {
      try {
        handleDetailsClick(data.id);
      } catch (error) {
        // Silent error handling
      }
    }
    // Silent if handler or data.id is missing
  };

  return (
    <div className="w-full h-full absolute inset-0">
      <Card 
        className="h-full w-full overflow-hidden flex flex-col p-0 relative border-2 shadow-xl rounded-xl no-drag" 
      >
        {/* Card header with company info */}
        <div className={`px-4 py-3 border-b relative z-30 ${
          data.collab_type?.toLowerCase().includes('twitter') || data.collab_type?.toLowerCase().includes('co-marketing')
            ? 'bg-blue-500/5' 
            : data.collab_type === 'Podcast Guest Appearance'
              ? 'bg-purple-500/5'
              : data.collab_type === 'Blog Post Feature'
                ? 'bg-emerald-500/5'
                : data.collab_type === 'Report & Research Feature'
                  ? 'bg-amber-500/5'
                  : data.collab_type === 'Newsletter Feature'
                    ? 'bg-indigo-500/5'
                    : data.collab_type === 'Live Stream Guest Appearance'
                      ? 'bg-red-500/5'
                      : 'bg-primary/5'
        }`}>
          <div className="flex flex-col">
            {/* Top row with company info and info button */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {/* Display logo if available */}
                {(data.creator_company_logo_url || data.potentialMatchData?.company_logo_url) && (
                  <LogoAvatar 
                    src={data.isPotentialMatch ? data.potentialMatchData?.company_logo_url : data.creator_company_logo_url} 
                    alt={data.isPotentialMatch ? data.potentialMatchData?.company_name : data.creator_company_name}
                    className="h-10 w-10 rounded-full"
                  />
                )}
                
                {/* Company Name and Type */}
                <div>
                  <h3 className="font-bold text-lg line-clamp-1">
                    {data.isPotentialMatch ? data.potentialMatchData?.company_name : (data.creator_company_name || "Company")}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {/* Type Badge - With defensive handling */}
                    {(data.collab_type?.toLowerCase()?.includes('twitter') || 
                     data.collab_type?.toLowerCase()?.includes('co-marketing')) ? (
                      <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/20 text-[#1DA1F2]">
                        <Twitter className="w-3 h-3 mr-1" />
                        {data.collab_type}
                      </Badge>
                    ) : data.collab_type === 'Podcast Guest Appearance' ? (
                      <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/20 text-purple-700">
                        <Mic className="w-3 h-3 mr-1" />
                        {data.collab_type}
                      </Badge>
                    ) : data.collab_type === 'Blog Post Feature' ? (
                      <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-700">
                        <FileText className="w-3 h-3 mr-1" />
                        {data.collab_type}
                      </Badge>
                    ) : data.collab_type === 'Report & Research Feature' ? (
                      <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/20 text-amber-700">
                        <FileSearch className="w-3 h-3 mr-1" />
                        {data.collab_type}
                      </Badge>
                    ) : data.collab_type === 'Newsletter Feature' ? (
                      <Badge variant="outline" className="text-xs bg-indigo-500/10 border-indigo-500/20 text-indigo-700">
                        <Mail className="w-3 h-3 mr-1" />
                        {data.collab_type}
                      </Badge>
                    ) : data.collab_type === 'Live Stream Guest Appearance' ? (
                      <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/20 text-red-700">
                        <Video className="w-3 h-3 mr-1" />
                        {data.collab_type}
                      </Badge>
                    ) : data.collab_type ? (
                      <p className="text-sm text-muted-foreground line-clamp-1">{data.collab_type}</p>
                    ) : null}
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary relative z-50"
                onClick={onInfoClick}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Second row with collaboration title - removed "Collaboration" text */}
            <div className="mt-3">
              <h3 className="text-xl font-semibold">
                {data.title || (data.isPotentialMatch ? "Potential Match" : "")}
              </h3>
            </div>
          </div>
        </div>
        
        {/* Card content */}
        <div className="p-4 flex-grow overflow-auto no-drag" style={{ 
          pointerEvents: "auto", 
          touchAction: "auto", 
          position: "relative"
        }}>
          {/* Twitter Co-Marketing Details */}
          {(data.collab_type?.toLowerCase().includes('twitter') || 
            data.collab_type?.toLowerCase().includes('co-marketing')) && 
           data.details?.host_twitter_handle && (
            <div className="flex flex-col space-y-2 p-3 bg-blue-500/5 rounded-md border border-blue-500/10 mb-3">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-1.5">
                  <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                  <span className="text-sm font-medium">
                    @{data.details?.host_twitter_handle?.replace('@', '').replace('https://twitter.com/', '').replace('https://x.com/', '')}
                  </span>
                </div>
                
                {/* Using DirectButton for maximum mobile compatibility */}
                <DirectButton 
                  url={createTwitterUrl(data.details?.host_twitter_handle || '')}
                  label="View on Twitter"
                  type="twitter"
                />
              </div>
              
              {data.details?.host_follower_count && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">{data.details.host_follower_count}</span> followers
                </p>
              )}
              
              {data.details?.twittercomarketing_type && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(Array.isArray(data.details.twittercomarketing_type) 
                    ? data.details.twittercomarketing_type 
                    : [data.details.twittercomarketing_type]).map((type: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs bg-blue-500/10 border-blue-500/20 text-blue-700">
                      {type}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Twitter Spaces Guest */}
          {data.collab_type === 'Twitter Spaces Guest' && data.details?.twitter_handle && (
            <div className="flex flex-col space-y-2 p-3 bg-blue-500/5 rounded-md border border-blue-500/10 mb-3">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-1.5">
                  <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                  <span className="text-sm font-medium">
                    {data.details.twitter_handle.includes('@') ? data.details.twitter_handle : '@' + data.details.twitter_handle.replace('https://twitter.com/', '').replace('https://x.com/', '')}
                  </span>
                </div>
                
                {/* Using DirectButton for maximum mobile compatibility */}
                <DirectButton 
                  url={createTwitterUrl(data.details?.twitter_handle || '')}
                  label="View on Twitter"
                  type="twitter"
                />
              </div>
              
              {data.details?.host_follower_count && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">{data.details.host_follower_count}</span> followers
                </p>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Podcast Guest Appearance */}
          {data.collab_type === 'Podcast Guest Appearance' && data.details?.podcast_name && (
            <div className="flex flex-col space-y-2 p-3 bg-purple-500/5 rounded-md border border-purple-500/10 mb-3">
              <div className="flex items-center space-x-1.5">
                <Mic className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">
                  {data.details.podcast_name}
                </span>
              </div>
              
              {data.details?.estimated_reach && (
                <p className="text-xs text-muted-foreground">
                  <Users className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">{data.details.estimated_reach}</span> estimated listeners
                </p>
              )}
              
              {data.details?.podcast_link && (
                <div className="flex items-center mt-2">
                  <DirectButton 
                    url={data.details?.podcast_link || ''}
                    label="Open Podcast"
                    type="podcast"
                  />
                </div>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Blog Post Feature */}
          {data.collab_type === 'Blog Post Feature' && data.details?.blog_name && (
            <div className="flex flex-col space-y-2 p-3 bg-emerald-500/5 rounded-md border border-emerald-500/10 mb-3">
              <div className="flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {data.details.blog_name}
                </span>
              </div>
              
              {data.details?.est_readers && (
                <p className="text-xs text-muted-foreground">
                  <Users className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">{data.details.est_readers}</span> estimated readers
                </p>
              )}
              
              {data.details?.blog_topic && (
                <p className="text-xs">
                  <span className="font-medium">Topic:</span> {data.details.blog_topic}
                </p>
              )}
              
              {data.details?.blog_link && (
                <div className="flex items-center mt-2">
                  <DirectButton 
                    url={data.details?.blog_link || ''}
                    label="Read Blog Post"
                    type="blog"
                  />
                </div>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.estimated_release_date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.estimated_release_date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Report & Research Feature */}
          {data.collab_type === 'Report & Research Feature' && (
            <div className="flex flex-col space-y-2 p-3 bg-amber-500/5 rounded-md border border-amber-500/10 mb-3">
              {data.details?.research_topic && Array.isArray(data.details.research_topic) && data.details.research_topic.length > 0 && (
                <div className="flex items-center space-x-1.5">
                  <FileSearch className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">
                    Research Topics: {data.details.research_topic.join(', ')}
                  </span>
                </div>
              )}
              
              {data.details?.target_audience && (
                <p className="text-xs text-muted-foreground">
                  <Users className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">Target:</span> {data.details.target_audience}
                </p>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.estimated_release_date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.estimated_release_date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Newsletter Feature */}
          {data.collab_type === 'Newsletter Feature' && (
            <div className="flex flex-col space-y-2 p-3 bg-indigo-500/5 rounded-md border border-indigo-500/10 mb-3">
              {data.details?.newsletter_name && (
                <div className="flex items-center space-x-1.5">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-700">
                    {data.details.newsletter_name}
                  </span>
                </div>
              )}
              
              {data.details?.newsletter_subscribers && (
                <p className="text-xs text-muted-foreground">
                  <Users className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">{data.details.newsletter_subscribers}</span> subscribers
                </p>
              )}
              
              {data.details?.newsletter_topic && (
                <p className="text-xs">
                  <span className="font-medium">Topic:</span> {data.details.newsletter_topic}
                </p>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.newsletter_date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.newsletter_date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Live Stream Guest Appearance */}
          {data.collab_type === 'Live Stream Guest Appearance' && (
            <div className="flex flex-col space-y-2 p-3 bg-red-500/5 rounded-md border border-red-500/10 mb-3">
              {/* Title for this specific livestream */}
              <div className="flex items-center space-x-1.5 mb-1">
                <Video className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">
                  Bondex Talks
                </span>
              </div>
              
              {/* Audience size - specific for this collab */}
              <p className="text-xs text-muted-foreground">
                <Users className="w-3 h-3 inline mr-1" />
                <span className="font-medium">5,000-10,000</span> estimated viewers
              </p>
              
              {/* Action buttons for streams */}
              <div className="flex flex-col gap-2 mt-1">
                {data.details?.previous_stream_link && (
                  <DirectButton 
                    url={data.details.previous_stream_link}
                    label="View Previous Stream"
                    type="stream"
                  />
                )}
                
                {data.details?.livestream_link && (
                  <DirectButton 
                    url={data.details.livestream_link}
                    label="View Livestream"
                    type="stream"
                  />
                )}
              </div>
              
              {/* Date */}
              <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                <Calendar className="w-3 h-3" />
                <span>{data.date || data.specific_date || data.details?.livestream_date || "Date TBD"}</span>
              </div>
            </div>
          )}
          
          {/* Potential Match Information */}
          {data.isPotentialMatch && data.potentialMatchData && (
            <div className="flex flex-col space-y-2 p-3 bg-primary/5 rounded-md border border-primary/10 mb-3">
              {/* User info with name and role */}
              <div className="flex items-center gap-2">
                <LetterAvatar 
                  name={`${data.potentialMatchData.first_name || ''} ${data.potentialMatchData.last_name || ''}`}
                  className="h-8 w-8"
                />
                <div>
                  <div className="font-medium">{data.potentialMatchData.first_name} {data.potentialMatchData.last_name}</div>
                  {data.potentialMatchData.job_title && (
                    <div className="text-xs text-muted-foreground">{data.potentialMatchData.job_title}</div>
                  )}
                </div>
              </div>
              
              {/* Social stats */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {data.potentialMatchData.twitter_followers && (
                  <div className="flex items-center">
                    <Twitter className="h-3 w-3 mr-1 text-[#1DA1F2]" />
                    <span>{data.potentialMatchData.twitter_followers} followers</span>
                  </div>
                )}
                
                {data.potentialMatchData.company_twitter_followers && (
                  <div className="flex items-center">
                    <Building className="h-3 w-3 mr-1 text-blue-500" />
                    <span>{data.potentialMatchData.company_twitter_followers} company followers</span>
                  </div>
                )}
              </div>
              
              {/* When they swiped on your collab */}
              {data.potentialMatchData.swipe_created_at && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Requested on {new Date(data.potentialMatchData.swipe_created_at).toLocaleDateString()}</span>
                </div>
              )}
              
              {/* Note from user if available */}
              {data.potentialMatchData.note && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-sm italic">
                  "{data.potentialMatchData.note}"
                </div>
              )}
            </div>
          )}

          {/* Collaboration Description - with fallbacks and debugging */}
          <div className="mb-3">
            <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
              {data.description || 
               (data.details?.short_description) || 
               (data.isPotentialMatch && data.potentialMatchData?.company_description) || 
               "View details for more information."
              }
            </p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="p-3 border-t flex justify-between items-center gap-3 relative z-50">
          <Button 
            size="default"
            variant="outline"
            className="flex-1 bg-transparent border-red-500/20 text-red-500 hover:bg-red-500/5"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleButtonClick("left");
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Skip
          </Button>
          
          {/* Info button placed between Skip and Request */}
          <Button 
            size="default"
            variant="outline"
            className="flex-1 relative z-50 border-blue-500/20 text-blue-600 hover:bg-blue-500/5"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              viewDetailsHandler();
            }}
          >
            <Info className="h-4 w-4 mr-1" />
            Info
          </Button>
          
          <Button 
            size="default"
            variant={data.isPotentialMatch ? "secondary" : "default"}
            className={`flex-1 ${data.isPotentialMatch ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleButtonClick("right");
            }}
          >
            {data.isPotentialMatch ? (
              <Sparkles className="h-4 w-4 mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            {data.isPotentialMatch ? 'Match' : 'Request'}
          </Button>
        </div>
      </Card>
      
      {/* Add note dialog */}
      <AddNoteDialog
        isOpen={showNoteDialog}
        onClose={() => setShowNoteDialog(false)}
        onSendWithNote={(note) => {
          // Give the dialog time to fully close before executing the swipe
          setTimeout(() => {
            handleSwipeAction("right", note);
          }, 300);
        }}
      />
    </div>
  );
}