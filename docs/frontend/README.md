# Frontend Documentation

The frontend of The Collab Room is built with React and modern web technologies. This document provides an overview of the frontend architecture, components, and design patterns.

## Table of Contents

- [Technology Stack](#technology-stack)
- [Application Structure](#application-structure)
- [Key Pages](#key-pages)
- [Components](#components)
- [Routing](#routing)
- [Data Fetching](#data-fetching)
- [Styling and Theming](#styling-and-theming)
- [State Management](#state-management)
- [Telegram Integration](#telegram-integration)
- [Mobile Responsiveness](#mobile-responsiveness)
- [Accessibility](#accessibility)
- [Utility Functions](#utility-functions)

## Additional Documentation

- [Notifications System](./notifications.md) - Documentation of the simplified notification system
- [UI Components](./ui-components.md) - Documentation of specialized UI components including TextLoop, GlowButton, and scrollable containers
- [Form Field Isolation](./form-field-isolation.md) - Guide to preventing data bleeding between form fields in multi-step forms
- [Navigation Updates](./navigation-updates.md) - Documentation of bottom navigation simplification and dashboard button improvements
- [Splash Screen Implementation](./splash-screen.md) - Guide to the ultra-light splash screen that renders in under 100ms
- [Code Splitting Implementation](./code-splitting.md) - Documentation of route-based code splitting for performance optimization
- [Collaboration Request System](./collaboration-request-system.md) - Comprehensive documentation of the note-adding workflow and collaboration request functionality

## Collaboration Request System

The collaboration request system has been enhanced with a comprehensive note-adding workflow that provides a LinkedIn-style "Add a note to your invitation" experience.

### Note-Adding Flow

The system uses a two-step dialog process:

1. **Initial Prompt**: When users click "Request Collaboration" on a regular collaboration, they are presented with a dialog asking if they want to add a personalized note
2. **Note Composition**: If they choose to add a note, a text area appears for composing the personalized message
3. **Request Sending**: The note is then saved to the database and included in notifications

### Implementation Details

- **AddNoteDialog Component**: Handles the two-step note composition flow with proper state management
- **Button State Management**: Buttons show "Requested" state immediately after sending to prevent duplicate requests
- **Consistent Interface**: Both list view (DiscoverPageList) and card view (SimpleCard) use the same note-adding workflow
- **Special Handling**: Potential matches bypass the note dialog and send requests directly

### Database Storage

Notes are properly saved to the `swipes.note` field in the database, ensuring they persist through the collaboration lifecycle and appear in match details and notifications.

## Pending Application Experience

The application provides a consistent limited view experience for users with pending applications, ensuring they can still browse content while waiting for approval.

### User States

The application handles three distinct user states:

1. **Unauthenticated Users**: See "Sign up" prompt with sign-up button
2. **Authenticated Users with Pending Applications**: See "Application pending" message without button
3. **Approved Users**: Full application access

### Limited View Features

Users with pending applications can:
- Browse all collaborations in the discovery feed
- View detailed information about collaborations
- Access the discover page

Users with pending applications cannot:
- Request collaborations (buttons are disabled and show "Application Pending")
- Access "My Collabs", "My Account", or "My Matches" navigation items
- Interact with navigation menu items (they are grayed out and unclickable)

### Implementation Details

- **AuthenticationPrompt Component**: Enhanced with `pending` prop to handle application pending state
- **CollaborationListItem Component**: Added `isApplicationPending` prop to disable request buttons
- **BottomNavigation Component**: Detects pending users and disables relevant menu items
- **Profile Structure**: Uses `userProfile.user.is_approved` to determine user approval status

## Technology Stack

- **React**: Core UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: Component library based on Radix UI
- **TanStack Query (React Query)**: Data fetching and caching
- **Zod**: Schema validation
- **Framer Motion**: Animation library
- **React Hook Form**: Form handling

## Application Structure

The frontend code is organized in the `client` directory with the following structure:

- `src/`: Main source code
  - `components/`: Reusable UI components
    - `ui/`: Shadcn UI components
    - `layout/`: Layout components
    - `icons/`: Custom icons
    - `admin/`: Admin-specific components
    - `cards/`: Collaboration card components
  - `pages/`: Page components (one per route)
  - `hooks/`: Custom React hooks
  - `lib/`: Utility functions and helpers
  - `types/`: TypeScript type definitions
  - `assets/`: Static assets

## Key Pages

The application includes the following key pages:

1. **Onboarding Flow**:
   - `onboarding.tsx`: Main onboarding page
   - `personal-info.tsx`: Personal information form
   - `company-info.tsx`: Company information form
   - `company-sector.tsx`: Company sector selection
   - `collab-preferences.tsx`: Collaboration preferences

2. **Discovery System**:
   - `DiscoverPage.tsx`: Main discovery page with swipeable cards
   - `discovery-filters-new-rebuild.tsx`: Updated discovery filters page
   - `filters/*.tsx`: Individual filter setting pages

3. **Collaboration Management**:
   - `create-collaboration-steps.tsx`: Multi-step collaboration creation
   - `my-collaborations.tsx`: List of user's collaborations
   - `application-form.tsx`: Form for applying to a collaboration

4. **Profile Management**:
   - `profile-overview.tsx`: User profile overview
   - `settings.tsx`: User settings page

5. **Admin Area**:
   - `admin/dashboard.tsx`: Admin dashboard
   - `admin/users.tsx`: User management
   - `admin/applications.tsx`: Application management

## Components

### SwipeableCard Component

The SwipeableCard component is a key part of the discovery system:

```tsx
export const SwipeableCard = ({ children, style, onVote, id, ...props }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();
  const [direction, setDirection] = useState(null);
  
  // Component implementation details
};
```

### Stack Component

The Stack component manages the stack of swipeable cards:

```tsx
export const Stack = ({ onVote, children, ...props }) => {
  // Component implementation details
};
```

### Card Components

The application uses a modular card system for displaying different types of collaborations:

#### BaseCollabCard Component

The BaseCollabCard serves as the foundation for all collaboration card types:

```tsx
interface BaseCardProps {
  data: {
    id?: string;
    companyName: string;
    topics?: string[];
    preferredTopics?: string[];
    [key: string]: any;
  };
  badgeIcon: React.ReactNode;
  badgeText: string;
  badgeClass?: string;
  title: string;
  children: React.ReactNode;
}

export const BaseCollabCard = ({ 
  data, 
  badgeIcon, 
  badgeText, 
  badgeClass, 
  title, 
  children 
}: BaseCardProps) => {
  // Component implementation
};
```

#### Specialized Card Components

Each collaboration type has its own specialized card component that extends BaseCollabCard:

- `PodcastCard`: For podcast collaboration opportunities
- `BlogPostCard`: For blog post collaborations
- `TwitterSpacesCard`: For Twitter Spaces events
- `LiveStreamCard`: For livestream collaborations
- `ResearchReportCard`: For research report partnerships
- `NewsletterCard`: For newsletter features
- `MarketingCard`: For general marketing collaborations

Each specialized card handles its specific data format and presents relevant information in a consistent UI.

#### PotentialMatchCard Component

The PotentialMatchCard is used to display users who have already swiped right on a host's collaborations:

```tsx
export interface PotentialMatchData {
  first_name: string;
  last_name?: string;
  company_name: string;
  job_title: string;
}

export interface PotentialMatchCardProps {
  collab_type: string;
  description?: string;
  topics?: string[];
  potentialMatchData: PotentialMatchData;
}

export function PotentialMatchCard({ 
  collab_type,
  description,
  topics, 
  potentialMatchData
}: PotentialMatchCardProps) {
  // Component implementation
}
```

The PotentialMatchCard has been designed with the following features:
- Subtle glowing effect using the GlowEffect component with reduced opacity (70%)
- Standard card sizing that matches other card components in the application
- Standard border styling using `border border-border/40` for visual consistency
- Clear visual hierarchy with prominent user and company information
- Consistent badge styling using the Shadcn Badge component for topics
- Theme-aware text styling that respects the application's color scheme

### Form Components

Forms use React Hook Form with Zod validation:

```tsx
// Example form implementation
const form = useForm<FilterFormValues>({
  resolver: zodResolver(filterFormSchema),
  defaultValues: formValues,
});

const onSubmit = async (values: FilterFormValues) => {
  // Form submission logic
};
```

## Routing

The application uses the Wouter library for routing, configured in `App.tsx`:

```tsx
function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/discover" component={DiscoverPage} />
      // Other routes
    </Switch>
  );
}
```

## Data Fetching

Data is fetched using TanStack Query:

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['api/resource'],
  queryFn: async () => {
    const response = await fetch('/api/resource');
    return response.json();
  }
});
```

For mutations:

```tsx
const mutation = useMutation({
  mutationFn: (data) => apiRequest('/api/resource', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['api/resource'] });
  },
});
```

## Styling and Theming

The application uses Tailwind CSS for styling with the following approach:

1. Global styles in `index.css`
2. Theme configuration in `theme.json`
3. Component-specific styles using class-variance-authority
4. Responsive design using Tailwind's responsive utilities

```tsx
// Example of component styling
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        // Other variants
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## State Management

The application primarily uses React Query for server state and local React state for UI state:

1. **Server State**: Managed through React Query
2. **Form State**: Managed through React Hook Form
3. **UI State**: Managed through useState and useContext hooks

## Telegram Integration

The application integrates with the Telegram WebApp:

```typescript
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id: string;
    user: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    // Other properties
  };
  // Methods and properties
}
```

## Mobile Responsiveness

The application is designed to be mobile-first, with responsive layouts using Tailwind's responsive utilities:

```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Responsive grid layout -->
</div>
```

## Accessibility

The application follows accessibility best practices:

1. Using semantic HTML elements
2. Providing appropriate ARIA attributes
3. Ensuring sufficient color contrast
4. Supporting keyboard navigation

## Utility Functions

### Collaboration Utilities

The application includes utility functions for collaboration-related operations:

```tsx
/**
 * Returns the appropriate icon component for a collaboration type
 */
export function getCollabTypeIcon(type: string | undefined): React.ReactNode {
  switch (type?.toLowerCase()) {
    case 'podcast':
      return <Mic className="w-3 h-3 mr-1" />;
    case 'blog post':
      return <FileText className="w-3 h-3 mr-1" />;
    case 'twitter spaces':
      return <Twitter className="w-3 h-3 mr-1" />;
    case 'live stream':
      return <Video className="w-3 h-3 mr-1" />;
    case 'research report':
      return <FileText className="w-3 h-3 mr-1" />;
    case 'newsletter':
      return <BookOpen className="w-3 h-3 mr-1" />;
    default:
      return <Megaphone className="w-3 h-3 mr-1" />;
  }
}
```
