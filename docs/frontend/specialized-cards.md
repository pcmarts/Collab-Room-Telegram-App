# Specialized Card Components

This document provides comprehensive documentation for the specialized card components used in The Collab Room's discovery system.

## Overview

The Collab Room has moved from a generic BaseCollabCard to specialized standalone card components for each collaboration type. This approach provides better customization for each content type while maintaining visual consistency across the discovery feed.

## Card Component Directory

All specialized card components are located in `client/src/components/cards/`:

- `PodcastCard.tsx`: Card specialized for podcast collaborations
- `TwitterSpacesCard.tsx`: Card specialized for Twitter Spaces collaborations
- `LiveStreamCard.tsx`: Card specialized for live streaming collaborations
- `BlogPostCollabCard.tsx`: Card specialized for blog post collaborations
- `ResearchReportCard.tsx`: Card specialized for research report collaborations
- `NewsletterCard.tsx`: Card specialized for newsletter collaborations
- `MarketingCard.tsx`: Card specialized for marketing collaborations

## Common Interface

All card components implement a consistent interface:

```typescript
interface CardProps {
  collaboration: Collaboration;
  onSwipe?: (direction: 'left' | 'right', collaboration: Collaboration) => void;
  isPotentialMatch?: boolean;
  potentialMatchData?: PotentialMatch;
  onViewDetails?: (collaboration: Collaboration) => void;
  disabled?: boolean;
}
```

The `collaboration` object is extended to include company information:

```typescript
interface Collaboration {
  id: string;
  type: string;
  title: string;
  creator_id: string;
  creator_company_name: string; // Company name from the joined tables
  details: {
    // Common details
    short_description: string;
    topics: string[];
    goals: string[];
    
    // Type-specific details
    // (varies by collaboration type)
  }
  // ...other fields
}
```

## Type Safety and Interface Design

Each card component implements strict TypeScript typing with proper interfaces for collaboration details:

```typescript
// Example for PodcastCard
interface PodcastDetails {
  podcast_name?: string;
  podcast_episodes?: number;
  podcast_duration?: string;
  expected_audience_size?: string;
  podcast_topic?: string;
  podcast_url?: string;
  podcast_host?: string;
  podcast_image?: string;
}

interface PodcastCardProps {
  collaboration: Collaboration & {
    details: Record<string, any> & Partial<PodcastDetails>;
  };
  onSwipe?: (direction: 'left' | 'right', collaboration: Collaboration) => void;
  isPotentialMatch?: boolean;
  potentialMatchData?: PotentialMatch;
  onViewDetails?: (collaboration: Collaboration) => void;
  disabled?: boolean;
}
```

Inside each component, we use proper type assertions to ensure type safety:

```typescript
const PodcastCard: React.FC<PodcastCardProps> = ({ collaboration, onSwipe, onViewDetails, disabled, isPotentialMatch, potentialMatchData }) => {
  // Safely cast details to the expected type with proper fallbacks
  const details = collaboration.details as Record<string, any> & Partial<PodcastDetails>;
  
  // Type-safe access with default values
  const podcastName = details.podcast_name || "Unnamed Podcast";
  const episodes = details.podcast_episodes || "TBD";
  const duration = details.podcast_duration || "20-40";
  
  // ...rest of component
}
```

## Component Structure

Each specialized card component follows this general structure:

```jsx
<div className="relative flex flex-col h-full rounded-xl overflow-hidden border border-border/40 bg-card transition-all duration-300 hover:border-primary/40 shadow-md">
  {/* Card Header */}
  <div className="p-4 bg-gradient-to-b from-card-foreground/10 to-transparent">
    <div className="flex items-center justify-between">
      <Badge variant="outline" className="bg-card-foreground/5 text-xs">
        {collaborationType}
      </Badge>
      <CompanyBadge name={collaboration.creator_company_name} />
    </div>
  </div>
  
  {/* Card Content - Varies by type */}
  <div className="flex-grow p-4 space-y-2">
    <h3 className="text-xl font-semibold text-card-foreground/90">{collaboration.title}</h3>
    <p className="text-sm text-card-foreground/70 line-clamp-2">
      {collaboration.details.short_description}
    </p>
    
    {/* Type-specific content with proper type assertions */}
    {details.podcast_name && (
      <div className="mt-2 flex items-center gap-2">
        <Headphones className="h-4 w-4 text-primary" />
        <a 
          href={formatExternalUrl(details.podcast_url)} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline flex items-center"
        >
          {details.podcast_name}
          <FiExternalLink className="ml-1 h-3 w-3" />
        </a>
      </div>
    )}
  </div>
  
  {/* Card Footer */}
  <div className="p-4 bg-gradient-to-t from-card-foreground/10 to-transparent mt-auto">
    <div className="flex flex-wrap gap-1">
      {collaboration.details.topics.map((topic, i) => (
        <Badge key={i} variant="secondary" className="text-xs">
          {topic}
        </Badge>
      ))}
    </div>
  </div>
</div>
```

## Type-Specific Implementations

### Podcast Card

The Podcast Card includes specialized UI elements for podcast collaborations:

```jsx
// Content specific to podcasts
<div className="mt-2">
  <div className="flex items-center gap-2 text-xs text-card-foreground/60">
    <Mic className="h-3 w-3" />
    <span>Episodes: {details.podcast_episodes || "TBD"}</span>
    <Clock className="h-3 w-3 ml-2" />
    <span>{details.podcast_duration || "20-40"} min</span>
  </div>
  <div className="mt-2 flex items-center gap-2 text-xs text-card-foreground/60">
    <Users className="h-3 w-3" />
    <span>Expected audience: {details.expected_audience_size || "1K+"}</span>
  </div>
  {details.podcast_topic && (
    <div className="mt-1 text-xs text-card-foreground/60">
      <span className="font-medium">Topic focus:</span> {details.podcast_topic}
    </div>
  )}
</div>
```

### Twitter Spaces Card

The Twitter Spaces Card includes Twitter-specific UI elements:

```jsx
// Content specific to Twitter Spaces
<div className="mt-2">
  <div className="flex items-center gap-2 text-xs text-card-foreground/60">
    <Calendar className="h-3 w-3" />
    <span>Date: {details.space_date || "TBD"}</span>
  </div>
  <div className="mt-1 flex items-center gap-2 text-xs text-card-foreground/60">
    <Users className="h-3 w-3" />
    <span>Expected audience: {details.expected_audience_size || "500+"}</span>
  </div>
  {details.twitter_followers && (
    <div className="mt-1 text-xs text-card-foreground/60">
      <span className="font-medium">Host followers:</span> {formatNumber(details.twitter_followers)}
    </div>
  )}
</div>
```

### Live Stream Card

The Live Stream Card includes features specific to streaming:

```jsx
// Content specific to Live Streams
<div className="mt-2">
  <div className="flex items-center gap-2 text-xs text-card-foreground/60">
    <Monitor className="h-3 w-3" />
    <span>Platform: {details.streaming_platform || "YouTube"}</span>
  </div>
  <div className="mt-1 flex items-center gap-2 text-xs text-card-foreground/60">
    <Clock className="h-3 w-3" />
    <span>Duration: {details.stream_duration || "60"} min</span>
  </div>
  {details.expected_audience_size && (
    <div className="mt-1 text-xs text-card-foreground/60">
      <span className="font-medium">Expected viewers:</span> {details.expected_audience_size}
    </div>
  )}
</div>
```

### Blog Post Card

The Blog Post Card emphasizes article features:

```jsx
// Content specific to Blog Posts
<div className="mt-2">
  <div className="flex items-center gap-2 text-xs text-card-foreground/60">
    <FileText className="h-3 w-3" />
    <span>Article type: {details.article_type || "Guest post"}</span>
  </div>
  <div className="mt-1 flex items-center gap-2 text-xs text-card-foreground/60">
    <Clock className="h-3 w-3" />
    <span>Reading time: {details.reading_time || "5-10"} min</span>
  </div>
  {details.blog_audience && (
    <div className="mt-1 text-xs text-card-foreground/60">
      <span className="font-medium">Audience:</span> {details.blog_audience}
    </div>
  )}
</div>
```

## Company Information Display

Each card prominently displays the company name associated with the collaboration's creator. This information comes from a multi-table join in the backend:

1. The collaboration record contains a `creator_id` field that references a user
2. The user record contains a `company_id` field that references a company
3. The company record contains the `name` field we want to display

The backend query in `server/storage.ts` performs this join:

```typescript
// In searchCollaborations function
const query = db
  .select({
    id: collaborations.id,
    title: collaborations.title,
    type: collaborations.type,
    creator_id: collaborations.creator_id,
    status: collaborations.status,
    details: collaborations.details,
    created_at: collaborations.created_at,
    updated_at: collaborations.updated_at,
    // Join with users and companies to get company name
    creator_company_name: sql`COALESCE(${companies.name}, 'Unknown Company')`.as('creator_company_name'),
  })
  .from(collaborations)
  .leftJoin(users, eq(collaborations.creator_id, users.id))
  .leftJoin(companies, eq(users.company_id, companies.id))
  .where(eq(collaborations.status, 'active'));
```

## Usage in the Discovery Page

The Discovery page in `client/src/pages/DiscoverPage.tsx` uses a sophisticated mapping and fuzzy matching system to render the appropriate card component based on the collaboration type:

```jsx
// Define a mapping between database collaboration types and card components
const CARD_TYPE_MAPPING: Record<string, React.FC<{ data: CardData }>> = {
  // Podcast variations
  "podcast": PodcastCard,
  "podcast guest appearance": PodcastCard,
  "podcast interview": PodcastCard,
  "podcast feature": PodcastCard,
  
  // Twitter Spaces variations
  "twitter-spaces": TwitterSpacesCard,
  "twitter spaces": TwitterSpacesCard, 
  "twitter spaces guest": TwitterSpacesCard,
  "twitter space": TwitterSpacesCard,
  
  // Livestream variations
  "livestream": LiveStreamCard,
  "live stream": LiveStreamCard,
  "video livestream": LiveStreamCard,
  
  // Research report variations
  "research-report": ResearchReportCard,
  "research report": ResearchReportCard,
  "market report": ResearchReportCard,
  
  // Newsletter variations
  "newsletter": NewsletterCard,
  "email newsletter": NewsletterCard,
  "newsletter feature": NewsletterCard,
  
  // Blog post variations
  "blog-post": BlogPostCollabCard,
  "blog post": BlogPostCollabCard,
  "blog post feature": BlogPostCollabCard,
  "guest blog": BlogPostCollabCard,
};

// Function to find the best card component using fuzzy matching
const findBestCardComponent = (type: string): React.FC<{ data: CardData }> => {
  // 1. Direct match (fastest path)
  if (CARD_TYPE_MAPPING[type]) {
    return CARD_TYPE_MAPPING[type];
  }
  
  // 2. Try to find a partial match
  const typeWords = type.split(/[\s-]+/).filter(word => word.length > 2);
  
  // Check for keyword matches in the collaboration type
  if (typeWords.some(word => word === 'podcast')) {
    return PodcastCard;
  }
  
  if (typeWords.some(word => word === 'twitter' || word === 'spaces')) {
    return TwitterSpacesCard;
  }
  
  if (typeWords.some(word => word === 'livestream' || word === 'stream' || word === 'live')) {
    return LiveStreamCard;
  }
  
  if (typeWords.some(word => word === 'blog' || word === 'post')) {
    return BlogPostCollabCard;
  }
  
  if (typeWords.some(word => word === 'research' || word === 'report')) {
    return ResearchReportCard;
  }
  
  if (typeWords.some(word => word === 'newsletter' || word === 'email')) {
    return NewsletterCard;
  }
  
  // 3. If no matches are found, use the default card
  return MarketingCard;
};

// In the renderCard function
const CardComponent = findBestCardComponent(cardType);
return <CardComponent data={cardData} />;
```

## Best Practices

1. **Consistency First**: While each card type has specialized content, maintain consistent styling, spacing, and interaction patterns across all cards.

2. **Component Isolation**: Each card component should be fully independent and not rely on a base component or shared utilities that could create coupling.

3. **Performance Optimization**: Keep card components lightweight, especially for the discovery feed where many cards may be rendered.

4. **Adding New Card Types**:
   - Create a new component in the `cards` directory following the same interface
   - Follow the established pattern for layout and styling
   - Add specialized UI elements relevant to the collaboration type
   - Update the renderCard function in DiscoverPage.tsx to handle the new type

5. **Maintaining Cards**:
   - When making changes, ensure they're applied consistently across all card types
   - Test changes thoroughly in both the discovery feed and detail views
   - Document significant changes in CHANGELOG.md

## Debugging Type Issues

The card components include a debugging system that can help identify type mismatches and rendering issues. This is particularly useful during development:

```jsx
// Debugging section in DiscoverPage.tsx
{process.env.NODE_ENV === 'development' && (
  <div className="mt-8 p-4 border border-yellow-500 bg-yellow-50 rounded-md">
    <h3 className="text-lg font-medium text-yellow-700">Debug Information</h3>
    <div className="mt-2 text-sm text-yellow-600">
      <p>Selected card type: <span className="font-mono">{cardType}</span></p>
      <p>Detected component: <span className="font-mono">{CardComponent?.name || 'Unknown'}</span></p>
      <p>Raw type from database: <span className="font-mono">{collaboration.type}</span></p>
      
      <div className="mt-2">
        <p className="font-medium">Details object:</p>
        <pre className="mt-1 p-2 bg-yellow-100 rounded overflow-x-auto">
          {JSON.stringify(collaboration.details, null, 2)}
        </pre>
      </div>
      
      {/* Type-specific debugging */}
      {CardComponent === PodcastCard && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
          <p className="font-medium text-green-700">Podcast-specific fields:</p>
          <ul className="list-disc pl-5 mt-1 text-green-600">
            <li>podcast_name: {(collaboration.details as any).podcast_name || 'missing'}</li>
            <li>podcast_episodes: {(collaboration.details as any).podcast_episodes || 'missing'}</li>
            <li>podcast_duration: {(collaboration.details as any).podcast_duration || 'missing'}</li>
          </ul>
        </div>
      )}
      
      {/* Similar sections for other card types */}
    </div>
  </div>
)}
```

## Type Assertions vs Type Guards

The card components use type assertions rather than type guards for performance reasons. This approach works well with our implementation but has some important considerations:

### Type Assertions

```typescript
// Using a type assertion (cast)
const details = collaboration.details as Record<string, any> & Partial<PodcastDetails>;
```

- **Pros**: Simple, minimal runtime overhead
- **Cons**: No runtime validation, can lead to errors if the structure doesn't match

### Type Guards (Alternative Approach)

```typescript
// Using a type guard function
function isPodcastDetails(details: Record<string, any>): details is PodcastDetails {
  return 'podcast_name' in details || 'podcast_episodes' in details;
}

// Usage
const details = collaboration.details;
if (isPodcastDetails(details)) {
  // Use podcast-specific fields safely
}
```

- **Pros**: Runtime validation, safer code
- **Cons**: More complex, additional runtime overhead

We chose type assertions for our implementation because our card mapping system already ensures that the correct card component is used for each collaboration type.

## Future Enhancements

Planned improvements for the card system include:

1. **Card Presets**: Standardized presets for common collaboration scenarios to improve consistency
2. **Enhanced Animation**: More sophisticated transition effects between cards
3. **Card Templates**: Allow users to choose from multiple layout templates for each collaboration type
4. **Accessibility Improvements**: Enhanced keyboard navigation and screen reader support for all card interactions
5. **Type Validation**: Add runtime type validation with graceful fallbacks for unexpected data structures