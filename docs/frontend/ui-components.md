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

### Glow Buttons

- Reserve for primary call-to-action buttons
- Use the standard GlowButton component for consistent styling across the app
- For special emphasis (like final submission buttons), use the inline glow effect
- Ensure sufficient contrast between the button text and the glow effect

### Scrollable Containers

- Apply to all pages with variable content length
- Ensure the header and button areas remain fixed while content scrolls
- Use standard padding and spacing to maintain consistent appearance