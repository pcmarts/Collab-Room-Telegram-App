# UI Components

This document provides documentation for specialized UI components used across The Collab Room application.

## Empty States

The Collab Room implements thoughtfully designed empty states to guide users when content is not yet available. For detailed information on empty state implementation, see the [Empty State Design documentation](./empty-state-design.md).

### My Collaborations Empty State

The empty state on the My Collaborations page features a three-step explanation of how collaborations work, along with a privacy section and prominent CTA. This design uses consistent element sizing (w-14 width for numbers and icons), 65% opacity backgrounds to emphasize the CTA button, and a clean horizontal layout for easy scanning.

**Key Features:**
- "How Collaborations Work" title introducing the three-step process
- Numbered step cards with directional triangle indicators 
- Prominent "Create Your First Collab" button
- Privacy section with lock icon and privacy explanation

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

## Dialog Components

### AddNoteDialog (v1.9.8 Update)

The AddNoteDialog component provides a two-step flow for adding an optional note to collaboration requests. When a user requests a collaboration, they are presented with a choice to either "Just Send" the request or "Add a Note" for a more personalized approach.

**Implementation**

Located at `client/src/components/AddNoteDialog.tsx`, this component handles both the initial prompt and the note composer views.

```typescript
interface AddNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSendWithNote: (note: string) => void;
}
```

**Key Features**
- Two-step dialog flow with initial decision prompt and optional note composer
- Improved positioning with top-[30%] and top-[20%] placements to avoid keyboard overlap
- Optimized for mobile usage with proper spacing and keyboard handling
- Success toast notifications provide confirmation when requests are sent
- Clear navigation options with "Just Send" and "Add a Note" buttons

**Usage Example**

```jsx
<AddNoteDialog
  isOpen={showAddNoteDialog}
  onClose={() => setShowAddNoteDialog(false)}
  onSendWithNote={(note) => handleSendRequest(selectedCollaboration.id, note)}
/>
```

### Toast Notifications (v1.9.8 Update)

The toast notification system was enhanced in version 1.9.8 to provide better visual feedback to users when collaboration requests are sent. The improvements include:

- Added a dedicated "success" variant with green background and white text
- Improved spacing and padding in toast notifications for better readability
- Fixed overlapping text issues with enhanced styling and layout
- Enhanced toast visibility with appropriate contrast and spacing

**Implementation**

Located in the following files:
- `client/src/components/ui/toast.tsx`: Core toast component with variants
- `client/src/components/ui/toaster.tsx`: Toast display logic and styling

**Usage Example**

```jsx
import { useToast } from "@/hooks/use-toast";

// In your component:
const { toast } = useToast();

// Display a success toast:
toast({
  title: "Request Sent Successfully",
  description: "Your collaboration request has been sent.",
  variant: "success" as any,
});
```

### Collaboration Details Dialog (v1.9.6 Update)

The CollaborationDetailsDialog component displays detailed information about a collaboration when a user taps the "Info" button on a discovery card. In version 1.9.6, this component was enhanced with the following improvements:

- Added a highlighted "About Company" section showing the company's short description
- Enhanced company information visibility with card-like formatting
- Implemented consistent badge/pill styling for collaboration types matching card styles
- Fixed missing icon imports (FileSearch, FileText, Mic, Video, Mail)
- Removed redundant "Collaboration details" text for a cleaner header
- Improved information hierarchy with better spacing and organization

**Implementation**

Located at `client/src/components/CollaborationDetailsDialog.tsx`, this component presents collaboration details in a modal dialog format.

```typescript
interface CollaborationDetailsDialogProps {
  collaboration: Collaboration;
  isOpen: boolean;
  onClose: () => void;
}
```

**Usage Example**

```jsx
<CollaborationDetailsDialog
  collaboration={selectedCollaboration}
  isOpen={detailsDialogOpen}
  onClose={() => setDetailsDialogOpen(false)}
/>
```

**Key Features**
- Consistent badge styling with the specialized card components
- Dedicated "About [Company Name]" section with highlighted box
- Type-specific details presentation based on collaboration type
- External link handling with proper button formatting
- Company logo display when available

## Glow Button

Enhanced buttons with animated glow effects for important call-to-action elements. Used for primary actions throughout the application.

### Implementation (v1.7.5 Update)

In version 1.7.5, the button implementation was updated for Telegram mobile browser compatibility:

1. Standard glow buttons in `client/src/components/GlowButton.tsx` (for most parts of the application)
2. Modified buttons with explicit styling in the application form (personal-info.tsx, company-details.tsx, company-sector.tsx)

The glow effects have been removed from form buttons and replaced with explicit styling to ensure visibility in Telegram mobile browser.

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

### Telegram Mobile Compatible Button (v1.7.5)

```jsx
<Button
  type="submit"
  className="w-full font-bold"
  variant="default"
  disabled={isSubmitting}
  // Important: these inline styles ensure visibility in Telegram mobile browser
  style={{ 
    color: "white", 
    backgroundColor: "#4034B9",
    boxShadow: "none",
    border: "1px solid rgba(255,255,255,0.1)"
  }}
>
  Submit Application
</Button>
```

## Onboarding Flow Components

### Scrollable Container Pattern

All onboarding pages use a consistent pattern for enabling scrolling while maintaining fixed positioning for headers and buttons.

#### Updated in v1.7.8

In version 1.7.8, all signup pages were updated with consistent scrollable containers to ensure full content accessibility on small devices. The updated pattern uses TelegramFixedButtonContainer for consistent button positioning:

```jsx
<div className="min-h-screen bg-gradient-to-b from-background to-background/90">
  <OnboardingHeader
    title="Page Title"
    subtitle=""
    step={0}
    totalSteps={0}
    backUrl="/previous-page"
  />

  {/* Scrollable container */}
  <div className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
    <div className="max-w-md mx-auto space-y-8 w-full">
      <div className="space-y-4 pb-32">
        {/* Form content */}
      </div>
    </div>
  </div>
  
  {/* Button container directly at the root level */}
  <TelegramFixedButtonContainer>
    <TelegramButton
      type="button"
      onClick={handleNext}
      isLoading={isSubmitting}
      loadingText="Saving..."
      text="Continue"
      disabled={isSubmitting}
    />
  </TelegramFixedButtonContainer>
</div>
```

#### Updated in v1.7.5

The form buttons in the onboarding flow have been updated with explicit styling for Telegram mobile browser compatibility:

```jsx
<div className="min-h-screen bg-background">
  <OnboardingHeader title="Page Title" />
  
  <div className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
    <form className="space-y-4 pb-32">
      {/* Form content */}
    </form>
  </div>
  
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-border shadow-lg">
    <Button 
      type="submit"
      className="w-full font-bold"
      variant="default"
      style={{ 
        color: "white", 
        backgroundColor: "#4034B9",
        boxShadow: "none",
        border: "1px solid rgba(255,255,255,0.1)"
      }}
    >
      Continue
    </Button>
  </div>
</div>
```

Key features:
- Fixed-height scrollable container with `calc(100vh - 120px)` to account for header
- Bottom-fixed button container with consistent styling and positioning
- Padding at the bottom of content (`pb-32`) to ensure nothing is hidden behind the button
- Explicit button styling to ensure visibility in Telegram mobile browser
- Consistent brand color (#4034B9) for all form buttons
- Specialized TelegramButton and TelegramFixedButtonContainer components for Telegram WebApp

## Consistent State Components

### State-Consistent Layout Pattern

A pattern implemented in v1.5.3 that ensures consistent UI across loading, empty, and active states in major pages like DiscoverPageNew. This pattern maintains header and layout structure regardless of content state:

```jsx
const DiscoverPageNew = () => {
  // State declarations...
  
  return (
    <div className="pb-24 pt-4 px-4 max-w-3xl mx-auto">
      {/* Header - Present in all states */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Discover</h1>
        <p className="text-muted-foreground">Find collaborations that match your interests</p>
      </div>
      
      {isLoading ? (
        // Loading state - Same structure as active state
        <div className="h-[60vh] flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-muted-foreground mt-4">Loading collaborations...</p>
        </div>
      ) : collaborations.length === 0 ? (
        // Empty state - Same structure as active state
        <div className="h-[60vh] flex flex-col items-center justify-center text-center">
          <div className="mb-4">
            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No collaborations found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            We couldn't find any collaborations matching your criteria. Try adjusting your filters.
          </p>
          <Button onClick={handleResetFilters}>Reset Filters</Button>
        </div>
      ) : (
        // Active state - Core content with same overall structure
        <div className="space-y-4">
          {/* Card display logic */}
        </div>
      )}
    </div>
  );
};
```

Key features:
- Common header maintained across all states
- Consistent spacing and layout regardless of content
- Container heights matched between states to prevent layout shifts
- Same semantic structure (headings, paragraphs) maintained across states

### Client-Side Navigation Pattern

Updated in v1.5.3 to use Wouter for seamless client-side navigation between related features:

```jsx
// Import from wouter instead of using window.location
import { useLocation } from "wouter";

const MatchesPage = () => {
  // Get navigate function from useLocation hook
  const [_, navigate] = useLocation();
  
  // Use navigate instead of window.location
  const handleStartDiscovering = () => {
    navigate("/discover");
  };
  
  return (
    <div>
      {/* Page content */}
      <Button onClick={handleStartDiscovering}>
        Start Discovering
      </Button>
    </div>
  );
};
```

Benefits:
- Prevents full page reloads when navigating between related sections
- Maintains application state during navigation
- Provides smoother user experience with instant transitions
- Follows React best practices for client-side routing

## Match Moment Component

The Match Moment component displays a celebratory dialog when users create a match through the swipe interface. It provides match details and navigation options.

### Implementation

Located at `client/src/components/MatchMoment.tsx`, this component provides a consistent and engaging match notification experience.

```typescript
interface MatchMomentProps {
  title: string;
  companyName: string;
  collaborationType: string;
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
  onMessage?: () => void;
}
```

### Usage Example

```jsx
<MatchMoment
  isOpen={showMatch}
  onClose={() => setShowMatch(false)}
  title="Podcast Guest Appearance"
  companyName="TechTalk Inc."
  collaborationType="Podcast Guest Appearance"
  userName="John"
/>
```

### Features

- Animated entrance with Framer Motion
- Displays collaboration type and company name
- Shows user's name when available ("You've matched with [Name] from [Company]")
- Consistent button design with appropriate icons:
  - MessageCircle icon for "View My Matches" button
  - LuCopy icon (discovery icon) for "Continue Discovering" button
- Optional direct message button for immediate communication
- Seamless navigation to the Matches page

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
- Use the standard GlowButton component for consistent styling across most of the app
- For form buttons in Telegram mobile browser, use the explicit styling approach with brand color (#4034B9)
- Ensure buttons are visible with sufficient contrast in both light and dark modes
- Avoid glow effects in Telegram mobile browser forms where they can cause visibility issues

### Scrollable Containers

- Apply to all pages with variable content length
- Ensure the header and button areas remain fixed while content scrolls
- Use standard padding and spacing to maintain consistent appearance
- For signup flow pages, implement the v1.7.8 pattern with `overflow-y-auto` and calculated height
- Maintain proper spacing with `pb-32` to prevent content from being obscured by fixed buttons
- Use TelegramFixedButtonContainer for consistent button positioning across all signup pages

### State-Consistent Layouts

- Maintain the same header and overall structure across loading, empty, and active states
- Use consistent height containers to prevent layout shifts between states
- Include appropriate visual indicators for each state (spinners, empty state illustrations)
- Keep semantic structure consistent to maintain accessibility across states

### Client-Side Navigation

- Always use Wouter's useLocation hook for navigation between pages instead of window.location
- Use the navigate function for programmatic navigation triggered by user actions
- Use Link component for navigation elements that are always visible (menus, navigation bars)
- Add descriptive onClick handlers that clearly indicate the navigation purpose

### Match Moment

- Use when displaying match notifications to provide a celebratory experience
- Pass the user's first name when available for personalized messaging
- Maintain consistent icon usage with main navigation elements:
  - Use MessageCircle for match-related actions
  - Use LuCopy (discovery icon) for discovery-related actions
- Ensure all animations work properly on both desktop and mobile screens
# Haptic Feedback System

## Overview

The Collab Room application enhances mobile interaction with a sophisticated haptic feedback system that provides tactile responses to user actions, creating a more engaging and responsive experience in the Telegram WebApp environment.

## Features Added in v1.7.2

- **Tactile Swipe Feedback**: Different vibration patterns for accepting vs. passing on collaborations
- **Button Press Vibrations**: Subtle haptic feedback when tapping action buttons
- **Multi-sensory Confirmation**: Combined toast notifications with haptic feedback for a richer experience
- **Environment-aware Implementation**: Graceful fallbacks when haptic feedback isn't available

## Implementation Details

Haptic feedback is implemented through a dedicated utility module that interfaces with the Telegram WebApp API:

```typescript
// client/src/lib/haptics.ts
export const triggerHapticFeedback = (type: 'impact' | 'notification' | 'selection' = 'impact') => {
  // Check if Telegram WebApp and HapticFeedback is available
  if (!window.Telegram?.WebApp?.HapticFeedback) {
    console.log('Haptic feedback not available in this environment');
    return;
  }

  const haptic = window.Telegram.WebApp.HapticFeedback;

  try {
    switch (type) {
      case 'impact':
        haptic.impactOccurred('medium');
        break;
      case 'notification':
        haptic.notificationOccurred('success');
        break;
      case 'selection':
        haptic.selectionChanged();
        break;
      default:
        haptic.impactOccurred('medium');
    }
  } catch (error) {
    console.error('Error triggering haptic feedback:', error);
  }
};
```

### SwipeableCard Integration

The SwipeableCard component integrates haptic feedback at key interaction points and provides proper event handling for button interactions:

```typescript
// Button click handler with haptic feedback
const handleButtonClick = async (direction: "left" | "right", note?: string) => {
  try {
    // Trigger haptic feedback for button press
    triggerHapticFeedback('impact');
    
    // ... other code ...
    
    // Directional haptic feedback for swipe action
    triggerSwipeHaptic(direction);
    
    // ... toast notifications ...
  } catch (error) {
    console.error("Error handling button click:", error);
  }
};

// Enhanced button click handling with proper event propagation
const onButtonClick = (e: React.MouseEvent, direction: "left" | "right") => {
  // Stop event propagation to prevent parent elements from capturing clicks
  e.stopPropagation();
  // Prevent default browser behavior
  e.preventDefault();
  // Log button interaction for debugging
  console.log(`[SwipeableCard] ${direction === "left" ? "Skip" : "Request"} button clicked`);
  // Call the main handler
  handleButtonClick(direction);
};
```

## User Experience Improvements

- **Enhanced Mobile Experience**: Tactile feedback creates a more physical and satisfying interaction
- **Improved Interaction Clarity**: Different feedback patterns help users intuitively understand different actions
- **Multi-sensory Feedback**: Combined visual, auditory, and tactile feedback creates a richer experience
- **Platform Integration**: Leverages native Telegram capabilities for a more integrated feel

## Usage Guidelines

### TelegramButton Positioning

- **Always Place at Root Level**: TelegramFixedButtonContainer should be placed at the root level of the component, not inside Card or other container components
- **Prevent Interaction Blocking**: Avoid nesting fixed containers inside other components to prevent invisible overlay issues
- **Add Bottom Padding**: Include adequate bottom padding (e.g., `pb-24`) on main content containers to prevent overlap with fixed buttons
- **Consistent Pattern**: Follow the established pattern used in onboarding pages like `company-details.tsx` and `personal-info.tsx`
- **Minimize Style Intervals**: Use minimal styling intervals to avoid interference with DOM event handling

### Haptic Feedback

- **Use Sparingly**: Reserve haptic feedback for meaningful interactions to prevent feedback fatigue
- **Consistent Patterns**: Use consistent haptic patterns for similar actions (accept/reject, submit/cancel)
- **Combine with Visual Feedback**: Always pair haptic feedback with visual cues for accessibility
- **Implement Fallbacks**: Always check for API availability before attempting to trigger haptic feedback

# Notification Confirmation Toasts

## Overview

Collab Room now provides clear visual feedback when collaboration requests are sent, enhancing user experience with confirmation toast notifications.

## Features Added in v1.7.0

- **Success Confirmation Toasts**: Toast notifications appear after successfully sending collaboration requests
- **Context-Aware Messages**: Different toast messages for requests with and without personalized notes
- **Consistent Visual Style**: Toasts match the application's design system
- **Timed Dismissal**: Toasts automatically dismiss after 3 seconds

## Implementation Details

Toast notifications are implemented using the shadcn/ui toast component with consistent styling:

```typescript
toast({
  title: "Collaboration Request Sent",
  description: "The host will be notified of your interest.",
  variant: "default",
  duration: 3000,
});
```

## User Experience Improvements

- **Immediate Feedback**: Users receive instant visual confirmation that their action was successful
- **Reduced Uncertainty**: Clear feedback eliminates confusion about whether a request was sent
- **Enhanced Satisfaction**: Polished notifications contribute to an overall professional experience
