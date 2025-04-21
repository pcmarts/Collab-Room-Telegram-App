# Collaboration Form Technical Documentation

This document provides a comprehensive technical overview of the collaboration creation form in "The Collab Room" application. It covers the form's architecture, field structure, validation logic, and submission process.

## Table of Contents

1. [Overview](#overview)
2. [Form Architecture](#form-architecture)
3. [Collaboration Types](#collaboration-types)
4. [Form Schemas and Validation](#form-schemas-and-validation)
5. [Field Structure and Organization](#field-structure-and-organization)
6. [Dynamic Form Fields](#dynamic-form-fields)
7. [Conditional Rendering](#conditional-rendering)
8. [Data Flow](#data-flow)
9. [Submission Process](#submission-process)
10. [Common Challenges and Solutions](#common-challenges-and-solutions)
11. [Form Variations](#form-variations)
12. [Telegram Integration](#telegram-integration)

## Overview

The collaboration creation form is a complex, multi-step form that allows users to create various types of collaborations. The form dynamically adjusts its fields based on the selected collaboration type, handles complex validation rules, and ensures data consistency when submitting to the backend.

## Form Architecture

The form is built using:
- **React Hook Form**: For form state management and validation
- **Zod**: For schema validation
- **Shadcn/UI**: For UI components
- **TypeScript**: For type safety

Key files involved in the form implementation:
- `client/src/pages/create-collaboration-steps.tsx`: Step-based form version
- `client/src/pages/create-collaboration-fixed.tsx`: Fixed layout version
- `client/src/pages/edit-collaboration-steps.tsx`: Edit version for existing collaborations
- `shared/schema.ts`: Schemas and validation rules
- `server/routes.ts`: Backend API endpoint handling

## Collaboration Types

The form supports multiple collaboration types defined in `shared/schema.ts`:

```typescript
export const COLLAB_TYPES = [
  "Co-Marketing on Twitter",
  "Podcast Guest Appearance",
  "Twitter Spaces Guest",
  "Live Stream Guest Appearance",
  "Report & Research Feature",
  "Newsletter Feature",
  "Blog Post Feature",
] as const;
```

Each collaboration type has its own set of specific fields and validation rules, which are dynamically rendered based on user selection.

## Form Schemas and Validation

The form uses Zod for schema validation. The main schema is `createCollaborationSchema` defined in `shared/schema.ts`, which combines common fields with type-specific fields:

```typescript
export const createCollaborationSchema = z.object({
  collab_type: z.enum(COLLAB_TYPES),
  description: z.string().max(200, "Description must be less than 200 characters"),
  date_type: z.enum(["any_future_date", "specific_date"]),
  specific_date: z.string().optional(),
  topics: z.array(z.enum(COLLAB_TOPICS)).min(1, "At least one topic is required"),
  is_free_collab: z.boolean().refine((val) => val === true, {
    message: "You must confirm this is a free collaboration with no payments involved",
  }),
  // And more fields...
```

Type-specific schemas include:

1. **Podcast Guest Appearance**:
```typescript
export const podcastDetailsSchema = z.object({
  podcast_name: z.string().min(2, "Podcast name is required"),
  short_description: z.string().max(200, "Short description must be less than 200 characters").optional(),
  podcast_link: z.string().url("Please enter a valid podcast link"),
  estimated_reach: z.enum(AUDIENCE_SIZE_RANGES).optional(),
});
```

2. **Twitter Co-Marketing**:
```typescript
export const twitterCoMarketingDetailsSchema = z.object({
  twittercomarketing_type: z.array(z.enum(TWITTER_COLLAB_TYPES)).min(1, "At least one Twitter collaboration type is required"),
  host_twitter_handle: z.string().min(1, "Host Twitter handle is required"),
  host_follower_count: z.enum(TWITTER_FOLLOWER_COUNTS),
  short_description: z.string().min(1, "Short description is required").max(180, "Short description must be 180 characters or less").optional(),
});
```

And similar schemas for other collaboration types.

## Field Structure and Organization

The form fields are organized into logical sections:

1. **Basic Information**:
   - Collaboration Type (dropdown)
   - Description/Short description
   - Date preference (any future date or specific date)
   - Topics (multi-select)

2. **Type-Specific Details**:
   - Dynamically rendered based on selected collaboration type
   - Each type has its own set of required fields

3. **Filtering Criteria** (optional):
   - Company sectors
   - Funding stages
   - Token status
   - Follower counts
   - Blockchain networks

4. **Confirmation**:
   - Free collaboration confirmation checkbox

## Dynamic Form Fields

The form dynamically changes based on the selected collaboration type. This is handled through the `handleCollabTypeChange` function:

```typescript
const handleCollabTypeChange = useCallback((value: typeof COLLAB_TYPES[number]) => {
  setSelectedCollabType(value);
  form.setValue("collab_type", value);
  
  // Clear the details object completely first to prevent field value bleed
  form.setValue('details', {} as any);
  
  // Reset details object when collaboration type changes
  switch (value) {
    case "Podcast Guest Appearance":
      form.setValue('details', {
        podcast_name: "",
        short_description: "",
        podcast_link: ""
      });
      break;
    case "Twitter Spaces Guest":
      form.setValue('details', {
        twitter_handle: "https://x.com/",
        space_topic: [],
        host_follower_count: TWITTER_FOLLOWER_COUNTS[0]
      });
      break;
    // Other cases...
  }
});
```

This approach ensures that:
1. Only relevant fields are shown for each collaboration type
2. Field values don't "bleed" between different collaboration types
3. Default values are set appropriately

## Conditional Rendering

The form uses conditional rendering to show/hide sections based on user selections:

```typescript
{selectedCollabType === "Podcast Guest Appearance" && (
  <>
    <FormField
      control={form.control}
      name="details.podcast_name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Podcast Name</FormLabel>
          <FormControl>
            <Input placeholder="Enter podcast name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    {/* More fields... */}
  </>
)}
```

This pattern is used throughout the form to create a fluid and responsive user experience.

## Data Flow

The data flow in the form follows this pattern:

1. User selects a collaboration type
2. Form fields update dynamically
3. User fills in required information
4. Form validation runs on field blur and form submission
5. On submission, data is formatted for API compatibility
6. Formatted data is sent to the backend API
7. Success/failure feedback is shown to the user

## Submission Process

When the form is submitted, the `onSubmit` function is called:

```typescript
const onSubmit = async (data: CreateCollaboration) => {
  setIsSubmitting(true);
  try {
    // Format data for API compatibility
    const formattedData = {
      ...data,
      // Ensure specific optional fields are in proper format
      required_company_sectors: data.required_company_sectors || [],
      required_funding_stages: data.required_funding_stages || [],
      // Set filter flags based on array contents
      filter_company_sectors_enabled: Array.isArray(data.required_company_sectors) && data.required_company_sectors.length > 0,
      filter_funding_stages_enabled: Array.isArray(data.required_funding_stages) && data.required_funding_stages.length > 0,
      filter_token_status_enabled: data.required_token_status === true,
      filter_company_followers_enabled: !!data.min_company_followers,
      filter_user_followers_enabled: !!data.min_user_followers,
      filter_blockchain_networks_enabled: Array.isArray(data.required_blockchain_networks) && data.required_blockchain_networks.length > 0
    };
    
    // Remove specific_date if not needed
    if (data.date_type !== 'specific_date') {
      delete formattedData.specific_date;
    }
    
    // Get Telegram init data if available
    const telegramInitData = window.Telegram?.WebApp?.initData || '';
    
    // Submit the form data to the backend
    const response = await fetch('/api/collaborations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init-data': telegramInitData
      },
      body: JSON.stringify(formattedData),
    });
    
    // Handle response
    if (response.ok) {
      // Invalidate queries to refresh collaboration lists
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/my'] });
      
      toast({
        title: "Success!",
        description: "Your collaboration has been created successfully."
      });
      // Redirect to the "My Collaborations" tab
      setLocation('/marketing-collabs-new?tab=my');
    } else {
      const errorText = await response.text();
      throw new Error(`Failed to create: ${errorText}`);
    }
  } catch (error) {
    console.error("Submission error:", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive"
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

Key aspects of the submission process:
1. Data formatting to ensure compatibility with backend expectations
2. Setting filter flags based on array contents
3. Conditional field removal
4. Telegram integration data
5. Error handling and user feedback
6. Redirect after successful submission

## Common Challenges and Solutions

### 1. Field Value Bleeding

**Problem**: When switching between collaboration types, values from previous selections can bleed into new forms.

**Solution**: Completely reset the `details` object when changing collaboration types:

```typescript
// Clear the details object completely first to prevent field value bleed
form.setValue('details', {} as any);

// Then set type-specific default values
form.setValue('details', {
  podcast_name: "",
  short_description: "",
  // More fields...
});
```

### 2. Description Field Extraction

**Problem**: Each collaboration type has its own description field, but the API expects a common description field.

**Solution**: Extract the appropriate description from type-specific fields during submission:

```typescript
// Extract description from type-specific fields
if (!data.description && data.details?.short_description) {
  formattedData.description = data.details.short_description;
}
```

### 3. Array Field Handling

**Problem**: Array fields need special handling to ensure proper formatting.

**Solution**: Always convert to arrays and handle empty cases:

```typescript
const preparedData = {
  ...collabData,
  // Make sure each array field is properly formatted as an array of strings
  topics: Array.isArray(collabData.topics) 
    ? collabData.topics.map((topic: any) => String(topic))
    : (collabData.topics ? [String(collabData.topics)] : []),
  // More array fields...
};
```

### 4. Validation for Different Collaboration Types

**Problem**: Different collaboration types have different validation rules.

**Solution**: Use Zod's schema composition and conditional validation:

```typescript
// Base schema with common fields
const baseSchema = z.object({
  // Common fields...
});

// Combine with type-specific schemas conditionally
export const createCollaborationSchema = baseSchema.and(
  z.discriminatedUnion('collab_type', [
    z.object({
      collab_type: z.literal('Podcast Guest Appearance'),
      details: podcastDetailsSchema,
    }),
    z.object({
      collab_type: z.literal('Twitter Spaces Guest'),
      details: twitterSpacesDetailsSchema,
    }),
    // Other collaboration types...
  ])
);
```

## Form Variations

The application has multiple variations of the collaboration form:

1. **Step-Based Form** (`create-collaboration-steps.tsx`):
   - Multi-step form with progress indicator
   - One section per step
   - Better for mobile and first-time users

2. **Fixed Layout Form** (`create-collaboration-fixed.tsx`):
   - All sections visible at once
   - Better for desktop and experienced users

3. **Edit Form** (`edit-collaboration-steps.tsx`):
   - Prefilled with existing collaboration data
   - Similar structure to creation form but with update semantics

Each variation follows the same core principles but with different UI approaches.

## Telegram Integration

The form integrates with Telegram Web App when used in that context:

1. Telegram init data is captured and sent with form submission:
```typescript
const telegramInitData = window.Telegram?.WebApp?.initData || '';

const response = await fetch('/api/collaborations', {
  headers: {
    'Content-Type': 'application/json',
    'x-telegram-init-data': telegramInitData
  },
  // Rest of fetch options...
});
```

2. Telegram-specific UI adaptations are made:
```typescript
// Example of Telegram-specific UI adaptation
if (window.Telegram?.WebApp) {
  // Set the Telegram Web App expanded state
  window.Telegram.WebApp.expand();
  
  // Use Telegram-styled buttons if available
  const MainButton = window.Telegram.WebApp.MainButton;
  if (MainButton) {
    MainButton.setText("Create Collaboration");
    MainButton.onClick(() => form.handleSubmit(onSubmit)());
    MainButton.show();
  }
}
```

This ensures a seamless experience when the form is used within the Telegram mini-app context.