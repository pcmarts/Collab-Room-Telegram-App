# Frontend Documentation

The frontend of The Collab Room is built with React and modern web technologies. This document provides an overview of the frontend architecture, components, and design patterns.

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