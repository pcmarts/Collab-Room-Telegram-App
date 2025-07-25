# Collaboration Request System Documentation

## Overview

The collaboration request system provides a comprehensive workflow for users to request collaborations with personalized notes. The system is designed to mirror LinkedIn's "Add a note to your invitation" experience, offering both immediate sending and personalized note composition options.

## Recent Enhancements (Version 1.10.35)

### Enhanced AddNoteDialog with Company Information
- **Host Company Display**: Dialog now shows host company logo and name in header
- **Contextual Copy**: Updated copy to include company name ("to [Company Name]")
- **Improved Button Layout**: Buttons now stack vertically with proper gap spacing (gap-3)
- **Primary/Secondary Actions**: "Add a Note" is primary button, "Just Send" is secondary
- **Visual Hierarchy**: Company information prominently displayed at top of dialog

### Restructured Request Cards
- **Full-Width Content**: Card content now spans full width below header section
- **Header Section**: Logo, company name, and timestamp positioned at top
- **Better Layout**: Improved spacing and visual hierarchy in request management interface
- **Enhanced Readability**: Clearer separation between company info and collaboration details

### CollabTypesBanner Optimization
- **Main Types Only**: Removed Twitter-specific subtypes, showing only core collaboration types
- **Simplified Animation**: Streamlined type cycling to focus on primary opportunities
- **Consistent Icons**: Maintained appropriate emoji icons for each collaboration type

## Previous Enhancements (Version 1.10.18)

### Simplified Details Modal
- **Streamlined Design**: Details modal now matches Messages tab style with focused content
- **Essential Information**: Shows only collaboration type, company info, request date, and message
- **Removed Sections**: Eliminated extensive Twitter Analytics, complex company data, and redundant information
- **Improved UX**: Cleaner interface reduces information overload and improves decision-making

### Enhanced Tab Filtering
- **All Tab**: Shows only non-hidden collaboration requests
- **Hidden Tab**: Shows only previously hidden requests 
- **Proper Separation**: Fixed backend filtering to prevent hidden requests from appearing in "All" tab
- **Tab Visibility**: Always shows both "All" and "Hidden" options to prevent navigation issues

### Accept Workflow Improvements
- **Automatic Redirect**: Accept button now redirects users to messages tab (/my-matches) after accepting
- **Better UX Flow**: Seamless transition from request acceptance to communication channel
- **Consistent Navigation**: Enhanced workflow prevents users from getting lost after accepting requests

## Core Components

### AddNoteDialog Component

The `AddNoteDialog` component handles the two-step note composition flow with enhanced company information display:

```typescript
interface AddNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSendWithNote: (note: string) => void;
  collaboration?: CardData; // Enhanced to include collaboration data
}
```

#### Company Information Header
- **Company Logo**: Displays host company logo at top of dialog
- **Company Name**: Shows company name in dialog copy and header
- **Collaboration Type**: Displays the specific collaboration type being requested

#### Two-Step Flow

1. **Initial Prompt**: Dialog asks if user wants to add a personalized note
   - "Just Send" button: Sends request without note
   - "Add a Note" button: Proceeds to composition step

2. **Note Composition**: Text area for writing personalized message
   - Placeholder text provides examples
   - Cancel button returns to initial state
   - Send button submits with note

### Button State Management

Both discovery interfaces implement consistent button state management:

- **Default State**: "Request Collaboration" button is enabled
- **Requested State**: Button shows "Requested" and is disabled
- **Visual Feedback**: Immediate state change prevents duplicate requests

### Discovery Interface Integration

#### List View (DiscoverPageList)

```typescript
const handleRequestCollaboration = async (collaboration: CardData, isPotentialMatch: boolean = false) => {
  if (isPotentialMatch) {
    await sendCollaborationRequest(collaboration, "Accepting your collaboration request!", isPotentialMatch);
  } else {
    setSelectedCollaboration(collaboration);
    setShowNoteDialog(true);
  }
};
```

#### Card View (SimpleCard)

```typescript
const handleButtonClick = (direction: "left" | "right") => {
  if (direction === "right") {
    if (data.isPotentialMatch) {
      handleSwipeAction(direction);
    } else {
      setShowNoteDialog(true);
    }
  }
};
```

## Database Integration

### Note Storage

Notes are saved to the `swipes.note` field in the database:

```typescript
const swipeData: InsertSwipe = {
  user_id: applicantId,
  collaboration_id: collaborationId,
  direction: "right",
  note: message, // Saved to swipes.note field
};
```

### Backward Compatibility

The system maintains compatibility with legacy code by also populating the `details` field:

```typescript
return {
  id: swipe.id,
  collaboration_id: swipe.collaboration_id,
  applicant_id: swipe.user_id,
  status: "pending",
  details: { message }, // Legacy compatibility
  created_at: swipe.created_at,
};
```

## Special Handling

### Potential Matches

Potential matches bypass the note dialog and send requests directly:

- No note composition step
- Immediate match creation
- Predefined acceptance message

### Error Handling

The system includes comprehensive error handling:

- Network request failures
- Database constraint violations
- User authentication issues
- State management errors

## User Experience Features

### Visual Feedback

- Toast notifications for successful requests
- Button state changes for visual confirmation
- Loading states during request processing

### Accessibility

- Proper ARIA labels for dialog components
- Keyboard navigation support
- Screen reader compatibility

## Implementation History

- **Version 1.10.15**: Fixed note saving to correct database field (`swipes.note` instead of `swipes.details`)
- **Version 1.10.15**: Restored proper note-adding dialog flow in list discovery interface
- **Version 1.10.15**: Enhanced button state management with immediate visual feedback
- **Version 1.10.15**: Ensured consistent collaboration request handling across both interfaces

## Related Documentation

- [Frontend Architecture](./README.md) - Overall frontend structure and patterns
- [UI Components](./ui-components.md) - Specialized UI components documentation
- [Discovery System](../discovery/README.md) - Discovery system integration details