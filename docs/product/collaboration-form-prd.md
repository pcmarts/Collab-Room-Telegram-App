# Collaboration Form Rebuild PRD

**Document Version:** 1.0  
**Last Updated:** April 29, 2025  
**Author:** Product Development Team  
**Status:** Draft

## 1. Executive Summary

This document outlines the requirements for rebuilding the Collaboration Form in The Collab Room application. The redesign will address current issues while improving extensibility, usability, and maintainability. The new form will support selection limits, easier addition of collaboration types, and more robust validation.

## 2. Background & Context

The Collab Room application allows Web3 professionals to create various types of collaborations (Twitter co-marketing, podcasts, blogs, etc.). The current form implementation suffers from several issues:

- Data bleeding between fields in multi-step progression
- Complex, hard-to-maintain validation logic
- Difficult extension for new collaboration types
- No easy way to limit selections (topics, Twitter collaboration types)
- Inconsistent handling of character limits and field validation

## 3. Problem Statement

### Current Pain Points:

1. **Data Integrity Issues:**
   - When changing steps in the multi-step form, field values can "bleed" into unrelated fields
   - Form requires complex workarounds and explicit field clearing to maintain data integrity

2. **Code Maintainability:**
   - The current implementation relies on a single large form component with complex conditional rendering
   - Adding new collaboration types requires extensive changes to the existing code
   - Validation logic is spread throughout the component rather than centralized

3. **User Experience Issues:**
   - No clear limits on selections leading to overly long lists
   - Inconsistent character limits for description fields
   - Validation errors can occur late in the process rather than in real-time

## 4. Goals & Non-Goals

### Goals:

1. Create a modular, type-safe form architecture that eliminates data bleeding issues
2. Support explicit limits: 3 topics max, 3 Twitter collab types max, 280 character descriptions
3. Make adding new collaboration types easier through a registry system
4. Improve user experience with immediate validation and clear limit indicators
5. Support all existing collaboration types with no loss of functionality

### Non-Goals:

1. Changing the underlying database schema for collaborations
2. Modifying the backend API endpoints for collaboration creation
3. Redesigning the overall user journey for collaboration creation
4. Adding new collaboration types as part of this rebuild

## 5. Solution Requirements

### 5.1 Functional Requirements

1. **Selection Limits**
   - FR-1.1: Limit topic selection to maximum 3 topics per collaboration
   - FR-1.2: Limit Twitter collaboration types to maximum 3 types
   - FR-1.3: Enforce 280 character limit on all description fields
   - FR-1.4: Provide visual indicators when approaching/reaching limits

2. **Collaboration Type Management**
   - FR-2.1: Support all existing collaboration types
   - FR-2.2: Provide a registry system for easy addition of new types
   - FR-2.3: Isolate form state between different collaboration types
   - FR-2.4: Support type-specific validation rules

3. **Form Navigation**
   - FR-3.1: Support multi-step form progression with proper state management
   - FR-3.2: Provide clear progress indication
   - FR-3.3: Allow back/forward navigation without data loss
   - FR-3.4: Validate each step before progression

4. **Data Validation**
   - FR-4.1: Perform real-time validation as users type/select
   - FR-4.2: Provide clear, contextual error messages
   - FR-4.3: Enforce URL format for website/social media links
   - FR-4.4: Ensure required fields are completed before submission

### 5.2 Technical Requirements

1. **Architecture**
   - TR-1.1: Implement a modular form architecture with isolated components
   - TR-1.2: Use React Context for shared state management
   - TR-1.3: Create reusable form components for common patterns
   - TR-1.4: Implement type-safe schemas with Zod

2. **Type Safety**
   - TR-2.1: Ensure full TypeScript type safety across all form components
   - TR-2.2: Create proper type definitions for all collaboration types
   - TR-2.3: Use discriminated unions for type-specific form fields
   - TR-2.4: Maintain type safety in form submission process

3. **State Management**
   - TR-3.1: Implement robust step management
   - TR-3.2: Create mechanism to persist form state between sessions
   - TR-3.3: Provide clean APIs for form reset and initialization
   - TR-3.4: Handle form submission with proper error handling

## 6. User Experience

### 6.1 Selection Limits

When a user reaches selection limits, the UI should:
- Disable unselected options
- Show count of selected items vs. maximum (e.g., "3/3 selected")
- Display a toast notification explaining the limit has been reached
- Require deselecting an item before selecting a new one

### 6.2 Character Limits

For text fields with character limits:
- Show current character count and limit (e.g., "120/280")
- Change count color to warning (orange) when approaching limit (>80%)
- Change to error color (red) when at limit
- Prevent typing beyond the limit
- Provide visual indicator when the field is too long

### 6.3 Form Navigation

The step-based form should include:
- Clear progress indicator showing current step and total steps
- Next button that validates current step before proceeding
- Back button that preserves entered data
- Clear indication of current step focus
- Contextual help for complex fields

## 7. Technical Architecture

### 7.1 Component Structure

```
CollaborationForm/
├── contexts/
│   ├── FormWizardContext.tsx             # Manages step progression
│   ├── CollaborationTypeContext.tsx      # Handles type selection
│   └── FormPersistenceContext.tsx        # Handles local storage of form state
├── hooks/
│   ├── useCollaborationForm.ts           # Custom hook for form operations
│   ├── useFormStep.ts                    # Step navigation logic
│   └── useFormValidation.ts              # Form validation utilities
├── components/
│   ├── FormWizard/
│   │   ├── StepIndicator.tsx             # Visual progress indicator
│   │   ├── StepNavigation.tsx            # Next/prev buttons
│   │   └── StepContainer.tsx             # Wraps each step
│   ├── fields/
│   │   ├── LimitedTopicSelector.tsx      # Topic selector with max limit
│   │   ├── LimitedTypeSelector.tsx       # Type selector with max limit
│   │   ├── CharLimitedTextarea.tsx       # Textarea with character limit
│   │   ├── DateSelector.tsx              # Date selection field
│   │   └── SocialMediaInput.tsx          # Twitter/social media input with validation
│   └── collaboration-types/
│       ├── TypeSelector.tsx              # Main type selection component
│       ├── TwitterCollabForm.tsx         # Twitter collaboration form
│       ├── PodcastCollabForm.tsx         # Podcast collaboration form
│       └── [Other collaboration types]
├── schemas/
│   ├── baseSchema.ts                     # Common fields for all types
│   ├── twitterSchema.ts                  # Twitter-specific schema
│   ├── podcastSchema.ts                  # Podcast-specific schema
│   └── [Other type schemas]
├── utils/
│   ├── formHelpers.ts                    # Utilities for form processing
│   ├── validationUtils.ts                # Common validation functions
│   └── typeRegistry.ts                   # Registry for collaboration types
└── index.tsx                             # Main entry point
```

### 7.2 Schema Definitions

All collaboration types will share a base schema:

```typescript
export const baseCollabFields = {
  topics: z.array(z.string())
    .min(1, "Select at least one topic")
    .max(3, "Maximum 3 topics allowed"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(280, "Description cannot exceed 280 characters"),
  date_type: z.enum(["any_future_date", "specific_date"]),
  specific_date: z.string().optional(),
  is_free_collab: z.boolean()
    .refine(val => val === true, {
      message: "You must confirm this is a free collaboration with no payments involved"
    })
};

export const twitterCollabSchema = z.object({
  ...baseCollabFields,
  collab_type: z.literal("Co-Marketing on Twitter"),
  twitter_handle: z.string()
    .min(1, "Twitter handle is required")
    .regex(/^https:\/\/x\.com\/[a-zA-Z0-9_]{1,15}$/, "Must be a valid Twitter/X handle"),
  twitter_collab_types: z.array(z.enum(TWITTER_COLLAB_TYPES))
    .min(1, "Select at least one collaboration type")
    .max(3, "Maximum 3 collaboration types allowed"),
  follower_count: z.enum(TWITTER_FOLLOWER_COUNTS)
});
```

### 7.3 Collaboration Type Registry

```typescript
export interface CollaborationTypeDefinition {
  id: string;
  name: string;
  schema: ZodSchema;
  defaultValues: Record<string, any>;
  steps: Step[];
  component: React.ComponentType<{ form: UseFormReturn<any> }>;
}

class CollaborationTypeRegistry {
  private types: Map<string, CollaborationTypeDefinition> = new Map();
  
  register(typeDefinition: CollaborationTypeDefinition): void {
    this.types.set(typeDefinition.id, typeDefinition);
  }
  
  getType(id: string): CollaborationTypeDefinition | undefined {
    return this.types.get(id);
  }
  
  getAllTypes(): CollaborationTypeDefinition[] {
    return Array.from(this.types.values());
  }
}
```

## 8. Implementation Guide

### 8.1 Adding a New Collaboration Type

To add a new collaboration type, developers will need to:

1. Create a schema file for the new type in `schemas/`
2. Define type-specific validation rules
3. Create a React component for the form in `components/collaboration-types/`
4. Register the new type in the registry:

```typescript
collaborationRegistry.register({
  id: "new_collab_type",
  name: "New Collaboration Type",
  schema: newCollabSchema,
  defaultValues: { /* Default values */ },
  steps: [ /* Step definitions */ ],
  component: NewCollabTypeForm
});
```

### 8.2 Form Component Example

Example implementation of the LimitedTopicSelector component:

```tsx
export const LimitedTopicSelector: React.FC<LimitedTopicSelectorProps> = ({
  options,
  name,
  label,
  maxSelections,
  form
}) => {
  const selections = form.watch(name) || [];
  const atMaxSelections = selections.length >= maxSelections;
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>{label}</FormLabel>
            <span className={`text-xs ${atMaxSelections ? 'text-destructive' : 'text-muted-foreground'}`}>
              {selections.length}/{maxSelections} selected
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {options.map(option => {
              const isSelected = field.value?.includes(option);
              return (
                <Button
                  key={option}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className={`h-auto py-2 text-xs justify-start text-left ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
                  onClick={() => {
                    if (isSelected) {
                      // Remove from selection
                      field.onChange(field.value.filter((val: string) => val !== option));
                    } else if (!atMaxSelections) {
                      // Add to selection if not at max
                      field.onChange([...(field.value || []), option]);
                    } else {
                      // Show toast that max selections reached
                      toast({
                        title: `Maximum ${maxSelections} selections allowed`,
                        description: `Please remove a selection before adding a new one.`,
                        variant: "warning"
                      });
                    }
                  }}
                  disabled={!isSelected && atMaxSelections}
                >
                  {isSelected && <CheckIcon className="mr-2 h-4 w-4" />}
                  {option}
                </Button>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
```

## 9. Implementation Timeline

1. **Phase 1: Core Architecture (Week 1-2)**
   - Implement form contexts and state management
   - Build reusable field components with selection limits
   - Create the type registry system

2. **Phase 2: Initial Collaboration Types (Week 3-4)**
   - Implement Twitter co-marketing form
   - Implement Podcast guest appearance form
   - Add common validation and field limit functionality

3. **Phase 3: Additional Types & Testing (Week 5-6)**
   - Implement remaining collaboration types
   - Comprehensive testing of form validation
   - User testing for feedback

4. **Phase 4: Final Polish & Documentation (Week 7-8)**
   - UI/UX refinements based on testing
   - Performance optimization
   - Documentation for adding new collaboration types

## 10. Success Criteria

The project will be considered successful if:

1. **Data Integrity**: No more field bleeding issues between steps
2. **Validation**: All enforced limits (3 topics, 3 Twitter types, 280 chars) work correctly
3. **Extensibility**: New collaboration types can be added without modifying existing code
4. **User Experience**: Improved form completion rates and reduced error rates
5. **Developer Experience**: Documentation enables adding new types in <1 day

## 11. Metrics & Monitoring

We will measure success using:

1. **Error Rate**: Track form validation errors before vs. after
2. **Completion Rate**: % of users who successfully submit forms
3. **Development Time**: Time required to add new collaboration types
4. **User Feedback**: Qualitative feedback from user testing

## 12. Appendix

### 12.1 Example Schemas

```typescript
// Twitter Co-marketing Schema
export const twitterCollabSchema = z.object({
  ...baseCollabFields,
  collab_type: z.literal("Co-Marketing on Twitter"),
  twitter_handle: z.string()
    .min(1, "Twitter handle is required")
    .regex(/^https:\/\/x\.com\/[a-zA-Z0-9_]{1,15}$/, "Must be a valid Twitter/X handle"),
  twitter_collab_types: z.array(z.enum(TWITTER_COLLAB_TYPES))
    .min(1, "Select at least one collaboration type")
    .max(3, "Maximum 3 collaboration types allowed"),
  follower_count: z.enum(TWITTER_FOLLOWER_COUNTS)
});

// Podcast Schema
export const podcastCollabSchema = z.object({
  ...baseCollabFields,
  collab_type: z.literal("Podcast Guest Appearance"),
  podcast_name: z.string()
    .min(2, "Podcast name is required"),
  podcast_link: z.string()
    .url("Please enter a valid podcast link"),
  estimated_reach: z.enum(AUDIENCE_SIZE_RANGES)
});
```

### 12.2 References

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://github.com/colinhacks/zod)
- [Shadcn/UI Form Components](https://ui.shadcn.com/docs/components/form)