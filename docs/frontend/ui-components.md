# UI Components

This document provides documentation for specialized UI components used across The Collab Room application.

## Text Loop Component

The TextLoop component provides an animated text rotation effect that smoothly transitions between different text items. It's primarily used on the welcome page to showcase different collaboration types.

### Implementation

Located at `client/src/components/ui/text-loop.tsx`, this component handles text transitions with customizable animation properties.

```typescript
interface TextLoopProps {
  texts: string[];
  className?: string;
  highlightClassName?: string;
  intervalDuration?: number;
  animationDuration?: number;
}
```

### Usage Example

```jsx
<TextLoop 
  texts={["Podcasts", "Twitter Spaces", "Research Reports", "Blog Posts"]} 
  className="text-primary font-medium" 
  intervalDuration={2000}
/>
```

### Properties

- `texts`: Array of strings to cycle through
- `className`: Optional styling for the container
- `highlightClassName`: Optional styling for the highlighted text
- `intervalDuration`: Time in ms between text changes (default: 2000ms)
- `animationDuration`: Duration of the transition animation (default: 500ms)

## Specialized Card Components

The application uses specialized card components for each collaboration type in the Discovery feed. Each card type is a standalone component with styling and layout optimized for its specific content.

### Implementation

All specialized card components are located in `client/src/components/cards/` directory:

- `PodcastCard.tsx`: For podcast collaborations
- `TwitterSpacesCard.tsx`: For Twitter Spaces collaborations
- `LiveStreamCard.tsx`: For live streaming collaborations
- `BlogPostCollabCard.tsx`: For blog post collaborations
- `ResearchReportCard.tsx`: For research report collaborations
- `NewsletterCard.tsx`: For newsletter collaborations
- `MarketingCard.tsx`: For marketing collaborations

### Common Card Interface

All card components follow a consistent interface pattern:

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

### Base Card Structure

Each specialized card component follows this general structure:

```jsx
<div className="relative flex flex-col h-full rounded-xl overflow-hidden border border-border/40 bg-card transition-all duration-300 hover:border-primary/40 shadow-md">
  {/* Card Header */}
  <div className="p-4 bg-gradient-to-b from-card-foreground/10 to-transparent">
    <div className="flex items-center justify-between">
      <Badge variant="outline" className="bg-card-foreground/5 text-xs">
        {collaborationType}
      </Badge>
      {/* Company Badge */}
      <CompanyBadge name={company_name} />
    </div>
  </div>
  
  {/* Card Content - Varies by type */}
  <div className="flex-grow p-4 space-y-2">
    <h3 className="text-xl font-semibold text-card-foreground/90">{title}</h3>
    <p className="text-sm text-card-foreground/70 line-clamp-2">{description}</p>
    
    {/* Type-specific content here */}
  </div>
  
  {/* Card Footer */}
  <div className="p-4 bg-gradient-to-t from-card-foreground/10 to-transparent mt-auto">
    <div className="flex flex-wrap gap-1">
      {topics.map((topic, i) => (
        <Badge key={i} variant="secondary" className="text-xs">
          {topic}
        </Badge>
      ))}
    </div>
  </div>
</div>
```

### Type-Specific Customizations

Each card type implements specialized UI elements based on its content type:

1. **Podcast Card**: 
   - Audio wave visualization icon
   - Episode count and duration
   - Microphone icon with listener count

2. **Twitter Spaces Card**:
   - Twitter bird icon
   - Expected audience size
   - Previous Space engagement metrics

3. **Live Stream Card**:
   - Video player-like preview
   - Stream time and duration
   - Platform indicators

4. **Blog Post Card**:
   - Article preview layout
   - Reading time estimation
   - Topic tags prominently displayed

### Usage Example

```jsx
<PodcastCard
  collaboration={podcastData}
  onSwipe={(direction, collab) => handleSwipe(direction, collab)}
  onViewDetails={(collab) => setSelectedCollaboration(collab)}
/>
```

## Glow Button

Enhanced buttons with animated glow effects for important call-to-action elements. Used for primary actions throughout the application.

### Implementation

Two implementations exist:
1. Standard glow buttons in `client/src/components/GlowButton.tsx`
2. Inline glow effects in specific pages like `company-details.tsx` for the Submit Application button

### Standard Glow Button

```typescript
interface GlowButtonProps {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactElement;
  variant?: "default" | "outline";
}
```

### Inline Glow Effect Example

```jsx
<Button className="relative overflow-hidden glow-button">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-30 blur-md animate-pulse"></div>
  <span className="relative z-10">Submit Application</span>
</Button>
```

## Onboarding Flow Components

### Scrollable Container Pattern

All onboarding pages use a consistent pattern for enabling scrolling while maintaining fixed positioning for headers and buttons:

```jsx
<div className="min-h-screen bg-background">
  <OnboardingHeader title="Page Title" />
  
  <div className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
    <form className="space-y-4 pb-32">
      {/* Form content */}
    </form>
  </div>
  
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-black">
    <Button className="w-full">Continue</Button>
  </div>
</div>
```

Key features:
- Fixed-height scrollable container with `calc(100vh - 120px)` to account for header
- Bottom-fixed button container with consistent styling and positioning
- Padding at the bottom of content (`pb-32`) to ensure nothing is hidden behind the button

## Usage Guidelines

### Text Loop

- Use for showcasing multiple options or features in a space-efficient way
- Keep text items similar in length to avoid layout shifts
- Use on welcome/landing pages, not within forms or data-entry screens

### Specialized Cards

- Use the appropriate card component based on collaboration type
- Maintain consistent card dimensions across all types for uniform display in the Discovery feed
- Ensure company name and card type are always prominently displayed
- Include relevant topic tags at the bottom of each card
- For new collaboration types, create a dedicated card component following the established pattern

### Glow Buttons

- Reserve for primary call-to-action buttons
- Use the standard GlowButton component for consistent styling across the app
- For special emphasis (like final submission buttons), use the inline glow effect
- Ensure sufficient contrast between the button text and the glow effect

### Scrollable Containers

- Apply to all pages with variable content length
- Ensure the header and button areas remain fixed while content scrolls
- Use standard padding and spacing to maintain consistent appearance