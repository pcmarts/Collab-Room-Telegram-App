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
    
    {/* Type-specific content here */}
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

The Discovery page in `client/src/pages/DiscoverPage.tsx` renders the appropriate card component based on the collaboration type:

```jsx
function renderCard(collaboration: Collaboration) {
  const { type } = collaboration;
  
  const commonProps = {
    collaboration,
    onSwipe: handleSwipe,
    onViewDetails: handleViewDetails,
    disabled: isLoading,
  };
  
  switch (type.toLowerCase()) {
    case 'podcast':
      return <PodcastCard {...commonProps} />;
    case 'twitter spaces':
      return <TwitterSpacesCard {...commonProps} />;
    case 'live stream':
      return <LiveStreamCard {...commonProps} />;
    case 'blog post':
      return <BlogPostCollabCard {...commonProps} />;
    case 'research report':
      return <ResearchReportCard {...commonProps} />;
    case 'newsletter':
      return <NewsletterCard {...commonProps} />;
    case 'marketing':
      return <MarketingCard {...commonProps} />;
    default:
      // Fallback for any new types that don't have specialized components yet
      return <GenericCollabCard {...commonProps} />;
  }
}
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

## Future Enhancements

Planned improvements for the card system include:

1. **Card Presets**: Standardized presets for common collaboration scenarios to improve consistency
2. **Enhanced Animation**: More sophisticated transition effects between cards
3. **Card Templates**: Allow users to choose from multiple layout templates for each collaboration type
4. **Accessibility Improvements**: Enhanced keyboard navigation and screen reader support for all card interactions