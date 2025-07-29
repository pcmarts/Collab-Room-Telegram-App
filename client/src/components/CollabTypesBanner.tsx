import { Card } from "@/components/ui/card";
import { TextLoop } from "@/components/ui/text-loop";
import { COLLAB_TYPES } from "@shared/schema";

export function CollabTypesBanner() {
  // Use only main collaboration types for the animation
  const allCollabTypes = COLLAB_TYPES;

  // Icons for main collaboration types
  const collaborationIcons = {
    'Podcast Guest Appearance': '🎙️',
    'Twitter Spaces Guest': '🐦',
    'Newsletter Feature': '📰',
    'Report & Research Feature': '📝',
    'Live Stream Guest Appearance': '📺',
    'Co-Marketing on Twitter': '🤝',
    'Blog Post Feature': '✍️',
    'Conference Coffee': '☕'
  };

  return (
    <Card className="p-4 mb-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="flex flex-col items-center justify-center space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Discover collaborations like...
        </h2>
        
        <div className="text-center w-full">
          <TextLoop
            interval={1}
            className="text-base font-medium text-foreground block min-h-[32px]"
          >
            {allCollabTypes.map((type) => (
              <span 
                key={type} 
                className="block text-center whitespace-normal px-4 flex items-center justify-center gap-2"
              >
                <span className="text-lg">
                  {collaborationIcons[type as keyof typeof collaborationIcons] || '🤝'}
                </span>
                <span className="truncate max-w-xs">
                  {type}
                </span>
              </span>
            ))}
          </TextLoop>
        </div>
      </div>
    </Card>
  );
}