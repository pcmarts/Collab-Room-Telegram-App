# PRD: Discovery List View Conversion & Light Theme Implementation

## Project Overview

Convert the Discovery page from a card-based swiping interface to a modern list view format while maintaining all existing functionality. Additionally, switch the application from dark to light theme for improved readability and professional appearance.

## Current State Analysis

### Discovery System (Current)
- **Interface**: Card-based swiping (Tinder-style)
- **Authentication**: Telegram WebApp integration with session management
- **Components**: 
  - SwipeableCard components with specialized card types (Podcast, Twitter Spaces, LiveStream, etc.)
  - CardStack component managing single-card display
  - Complex swipe gesture handling with haptic feedback
- **Data Flow**: Cursor-based pagination with server-side swipe tracking
- **Filtering**: Advanced multi-parameter filtering (collab types, company tags, funding stages, etc.)
- **State Management**: React Query with complex authentication state handling

### Authentication & Access Control (Current)
- **Primary**: Telegram WebApp initData validation
- **Fallback**: Express session cookies with user ID headers
- **Current Behavior**: Complete authentication required for all Discovery access
- **Error Handling**: AuthenticationError component with retry mechanisms

### Theme System (Current)
- **Color Scheme**: Dark theme (`"appearance": "dark"`)
- **Primary Color**: `hsl(245, 58%, 51%)` (purple/blue)
- **Variant**: Professional
- **UI Components**: Shadcn/ui with dark theme optimization

## Requirements

### 1. Discovery List View Conversion

#### 1.1 Interface Transformation
- **REMOVE**: Card-based swiping interface, SwipeableCard components, gesture handling
- **ADD**: Scrollable list view with company logos and collaboration details
- **MAINTAIN**: All existing filter functionality, pagination logic, data fetching

#### 1.2 List Item Design
Each list item must display:
- **Company Logo**: Small icon/avatar (40x40px)
- **Collaboration Title**: Primary heading
- **Collaboration Type**: Badge/pill styling
- **Company Name**: Secondary text
- **Action Button**: "View Details" for all users, "Request Collaboration" for authenticated users

#### 1.3 Interaction Model
- **Browse Mode**: All users can scroll and view list items
- **Detail View**: "View Details" opens existing CollaborationDetailsDialog
- **Authentication Gating**: "Request Collaboration" requires authentication

### 2. Tiered Access System

#### 2.1 Unauthenticated Users
- **Access**: Full read-only access to Discovery list
- **Restrictions**: 
  - Cannot request collaborations
  - Navigation items grayed out: "My Collabs", "My Account", "My Matches"
  - Sign-up prompts on interaction attempts
- **Landing Experience**: Discovery list as default landing page

#### 2.2 Authenticated Users
- **Access**: Full platform functionality
- **Features**: All current capabilities maintained
- **Navigation**: All navigation items active and functional

#### 2.3 Visual Indicators
- **Disabled States**: Gray overlay/disabled styling for restricted features
- **Prompts**: Clear sign-up calls-to-action for unauthenticated interactions
- **Feedback**: Appropriate messaging for access levels

### 3. Light Theme Implementation

#### 3.1 Theme Configuration
- **Update**: `theme.json` appearance from "dark" to "light"
- **Maintain**: Current primary color and professional variant
- **Ensure**: All UI components adapt to light theme automatically

#### 3.2 Component Updates
- **Navigation**: Update bottom navigation styling for light theme
- **Cards/Lists**: Ensure proper contrast and readability
- **Dialogs**: Verify CollaborationDetailsDialog appearance
- **Buttons**: Maintain visual hierarchy in light theme

## Technical Implementation

### 4.1 Component Architecture Changes

#### Discovery Page Structure
```
DiscoverPage
├── Header (consistent across states)
├── Filter Controls (maintained)
├── List Container
│   ├── List Items (replace CardStack)
│   │   ├── Company Logo
│   │   ├── Collaboration Info
│   │   └── Action Buttons
│   ├── Loading States
│   ├── Empty States
│   └── Pagination Controls
└── Dialogs (maintained)
```

#### New Components Required
- `CollaborationListItem`: Individual list row component
- `CompanyLogo`: Reusable company avatar component
- `AuthenticationPrompt`: Sign-up prompt for unauthenticated users

### 4.2 Data Flow Modifications

#### Maintained Systems
- **API Endpoints**: All existing collaboration search and filter endpoints
- **Authentication**: Current Telegram WebApp + session system
- **Pagination**: Cursor-based pagination logic
- **Filtering**: Complete filter system preservation

#### Modified Systems
- **State Management**: Remove swipe-related state, add list interaction state
- **Event Handling**: Replace swipe events with click/tap events
- **Navigation**: Update routing logic for tiered access

### 4.3 Authentication Integration

#### Route Protection Strategy
```typescript
// Unauthenticated users: Read-only Discovery access
// Authenticated users: Full platform access
// Landing route: /discover (public)
// Protected routes: /my-collaborations, /dashboard, /matches
```

#### Access Control Implementation
- **Component Level**: Conditional rendering based on auth state
- **API Level**: Maintain existing authentication requirements
- **Navigation Level**: Visual state management for restricted items

### 4.4 Performance Considerations

#### Optimizations Maintained
- **React Query**: Existing caching and optimization strategies
- **Code Splitting**: Current lazy loading implementation
- **Database**: Optimized collaboration search queries

#### New Optimizations
- **Virtual Scrolling**: Consider for large lists (if needed)
- **Image Loading**: Lazy loading for company logos
- **List Rendering**: Efficient re-rendering strategies

## Success Criteria

### 5.1 Functional Requirements
- [ ] Discovery list displays all collaborations with proper formatting
- [ ] All existing filters work correctly with list view
- [ ] Unauthenticated users can browse but not interact
- [ ] Authenticated users retain all current functionality
- [ ] CollaborationDetailsDialog opens correctly from list items
- [ ] Pagination works seamlessly with list scrolling

### 5.2 User Experience
- [ ] Light theme provides better readability
- [ ] Navigation clearly indicates access levels
- [ ] Smooth transitions between authentication states
- [ ] Consistent visual hierarchy throughout application
- [ ] Mobile-responsive design maintained

### 5.3 Technical Requirements
- [ ] No breaking changes to existing API endpoints
- [ ] Authentication system remains unchanged
- [ ] Performance equal or better than current implementation
- [ ] All existing tests pass (where applicable)
- [ ] Code maintains existing patterns and standards

## Risk Mitigation

### 5.1 Authentication Complexity
- **Risk**: Complex authentication system may require significant changes
- **Mitigation**: Leverage existing authentication middleware, minimal API changes

### 5.2 Filter System Integration
- **Risk**: Advanced filtering may not work properly with list view
- **Mitigation**: Maintain existing filter API integration, test thoroughly

### 5.3 Performance Impact
- **Risk**: List view may perform worse than card view
- **Mitigation**: Implement efficient rendering, consider virtualization if needed

### 5.4 User Experience Disruption
- **Risk**: Major interface change may confuse existing users
- **Mitigation**: Maintain familiar interaction patterns where possible

## Implementation Priority

### Phase 1: Core List View (High Priority)
1. Create CollaborationListItem component
2. Replace CardStack with list container
3. Implement basic list rendering
4. Update theme to light mode

### Phase 2: Authentication Integration (High Priority)
1. Implement tiered access system
2. Update navigation state handling
3. Add authentication prompts
4. Test access control flows

### Phase 3: Polish & Optimization (Medium Priority)
1. Refine visual design
2. Add loading states and animations
3. Optimize performance
4. Comprehensive testing

## Acceptance Criteria

The implementation will be considered complete when:
1. Discovery page shows a scrollable list of collaborations
2. Unauthenticated users can browse but cannot request collaborations
3. All existing filters work with the new list view
4. Light theme is applied consistently across the application
5. Navigation properly reflects user authentication state
6. Performance is maintained or improved from current implementation
7. All existing functionality remains accessible through the new interface

---

**Document Version**: 1.0  
**Date**: June 22, 2025  
**Status**: Ready for Implementation