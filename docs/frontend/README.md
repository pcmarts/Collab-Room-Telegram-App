# Frontend Documentation

## Overview

The Collab Room frontend is built using React and TypeScript, with a focus on component reusability and maintainability. The application follows a mobile-first approach, with a responsive design that works well on all device sizes.

## Technology Stack

- **React**: Core library for building the user interface
- **TypeScript**: For type safety and improved developer experience
- **Vite**: Fast build tool and development server
- **Shadcn/ui**: Component library for consistent UI design
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Query**: For data fetching, caching, and state management
- **Wouter**: Lightweight routing library
- **Framer Motion**: For animations and transitions
- **Zod**: For schema validation

## Project Structure

```
client/src/
├── components/      # Reusable UI components
│   ├── ui/          # Shadcn UI components
│   ├── admin/       # Admin-specific components
│   ├── layout/      # Layout components
│   └── icons/       # Custom icon components
├── pages/           # Page components for different routes
│   ├── admin/       # Admin pages
│   └── filters/     # Filter-related pages
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and libraries
├── types/           # TypeScript type definitions
├── App.tsx          # Root component and routing setup
└── main.tsx         # Application entry point
```

## Routing

The application uses Wouter for client-side routing. Routes are defined in `App.tsx`:

```typescript
function Router() {
  return (
    <div>
      <Switch>
        {/* Main App Routes */}
        <Route path="/" component={Dashboard} />
        <Route path="/discover" component={DiscoverPage} />
        <Route path="/my-collaborations" component={MyCollaborations} />
        <Route path="/matches" component={MatchesPage} />
        
        {/* Admin Routes */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/applications" component={AdminApplications} />
        
        {/* Filter Routes */}
        <Route path="/filters" component={FiltersDashboard} />
        <Route path="/filters/collab-types" component={CollabTypesFilter} />
        {/* more routes... */}
      </Switch>
    </div>
  );
}
```

## Key Pages

### Authentication Flow

1. **Welcome Page** (`/welcome`): Initial landing page for new users
2. **Personal Info** (`/personal-info`): User information collection
3. **Company Basics** (`/company-basics`): Basic company information
4. **Company Sector** (`/company-sector`): Company sector and tags
5. **Company Details** (`/company-details`): Additional company details
6. **Application Status** (`/application-status`): Status of user's application

### Main Application

1. **Discovery Page** (`/discover`): Swipe-based interface for discovering collaborations
2. **My Collaborations** (`/my-collaborations`): User's created collaborations
3. **Matches Page** (`/matches`): User's matched collaborations
4. **Dashboard** (`/dashboard`): User dashboard and profile overview

### Admin Pages

1. **Admin Dashboard** (`/admin`): Admin overview
2. **Admin Users** (`/admin/users`): User management
3. **Admin Applications** (`/admin/applications`): Application management

## Components

### UI Components

The application uses Shadcn UI components for consistent styling and behavior. These components are located in `client/src/components/ui/`.

Examples include:
- `Button`: Styled button component
- `Card`: Card container component
- `Dialog`: Modal dialog component
- `Form`: Form components with validation

### Custom Components

Custom components are built to provide specific functionality for the application:

- `SwipeableCard`: Card component for the swipe-based discovery interface
- `CollaborationDialog`: Dialog for displaying collaboration details
- `NetworkStatus`: Component for displaying network statistics
- `MatchNotification`: Notification for matched collaborations

## Data Fetching

The application uses React Query for data fetching, caching, and state management:

```typescript
const { data: profile, isLoading } = useQuery<ProfileData>({
  queryKey: ['/api/profile'],
  refetchOnMount: 'always',
  refetchOnWindowFocus: true
});
```

For mutations (data updates), the application uses React Query mutations:

```typescript
const mutation = useMutation({
  mutationFn: (data) => apiRequest('/api/collaborations', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/collaborations/my'] });
    // Show success message and navigate
  }
});
```

## Form Handling

Forms are built using React Hook Form with Zod validation:

```typescript
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    title: '',
    description: '',
    // more fields...
  }
});

const onSubmit = (data: z.infer<typeof formSchema>) => {
  // Handle form submission
};

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Title" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* more form fields... */}
      <Button type="submit">Submit</Button>
    </form>
  </Form>
);
```

## Custom Hooks

The application uses custom hooks to encapsulate reusable logic:

- `useIsMobile`: Detects if the device is mobile
- `useToast`: Provides toast notification functionality

## Telegram Integration

The application integrates with Telegram WebApp for authentication and user information:

```typescript
export async function signInWithTelegram() {
  if (window.Telegram?.WebApp) {
    const initData = window.Telegram.WebApp.initData;
    // Use initData for authentication
  }
}
```

## Responsive Design

The application is designed to be mobile-first, with responsive layouts that adapt to different screen sizes. Tailwind CSS is used for responsive styling:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

## State Management

The application uses React Query for server state management and local state for UI state:

```typescript
const [isOpen, setIsOpen] = useState(false);
```

For more complex state, React Context is used:

```typescript
const SidebarContext = createContext<SidebarContext>({
  state: 'expanded',
  open: true,
  setOpen: () => {},
  openMobile: false,
  setOpenMobile: () => {},
  isMobile: false,
  toggleSidebar: () => {}
});
```

## Error Handling

The application includes comprehensive error handling:

```typescript
try {
  // API call or other operation
} catch (error) {
  console.error('Error:', error);
  toast({
    title: 'Error',
    description: 'An error occurred. Please try again.',
    variant: 'destructive'
  });
}
```

## Animation

Framer Motion is used for animations and transitions:

```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  {/* Content */}
</motion.div>
```

## Utility Functions

The application includes utility functions for common operations:

```typescript
// Class name utility for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API request utility
export async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
  
  if (!res.ok) {
    throw new Error('API request failed');
  }
  
  return res.json();
}
```

## TypeScript Integration

The application uses TypeScript for type safety and improved developer experience:

```typescript
interface ProfileData {
  user: User;
  company: Company;
  preferences: any;
  notificationPreferences: NotificationPreferences;
  marketingPreferences: MarketingPreferences;
  conferencePreferences: ConferencePreferences;
}
```

Type definitions are shared between the client and server for consistency.