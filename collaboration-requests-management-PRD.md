# PRD: Collaboration Requests Management

## Overview
Enhance the "My Collabs" section with an integrated requests management system that provides hosts with immediate visibility into inbound collaboration requests through a summary preview and dedicated requests management interface.

## Problem Statement
Hosts currently have limited visibility into collaboration requests, relying primarily on Telegram notifications and small badge indicators. They need a centralized, web-based interface to efficiently review and manage inbound requests.

## Solution
Add a requests summary section to the top of "My Collabs" page showing the latest 4 requests, with a "View All Requests" button leading to a dedicated requests management tab within the My Collabs section.

## User Experience Flow

### 1. My Collabs Page Enhancement
- **Top Section**: Recent Requests Summary Card
  - Shows latest 4 requests with requester avatar, name, company, collaboration type, and timestamp
  - Displays total pending request count
  - "View All Requests" button for full management interface

### 2. Requests Management Tab
- **Tab Structure**: Add "Requests" tab alongside existing "My Collabs" content
- **List View**: All pending requests grouped by collaboration
- **Request Details**: Requester profile, company info, request message, timestamp
- **Actions**: Accept, Decline, View Profile buttons for each request

## Technical Requirements

### Frontend Components
- **RequestsSummaryCard**: Top-level component showing recent 4 requests
- **RequestsTab**: Full requests management interface
- **RequestItem**: Individual request display component
- **RequestActions**: Accept/Decline/View Profile action buttons

### API Endpoints
- `GET /api/collaboration-requests/summary` - Latest 4 requests
- `GET /api/collaboration-requests` - All requests with pagination
- `POST /api/collaboration-requests/:id/accept` - Accept request
- `POST /api/collaboration-requests/:id/decline` - Decline request

### Database Schema
- Join with `users`, `companies`, and `collaborations` tables for complete request data

## UI Specifications

### Requests Summary Card
- **Height**: ~200px compact card
- **Layout**: Horizontal list of 4 request items
- **Content**: Avatar (40px), Name + Company (1 line), Collab type + timestamp (1 line)
- **Action**: Single "View All Requests (X)" button at bottom

### Requests Tab
- **Header**: Filter options (All, Pending, This Week)
- **Grouping**: Requests grouped by collaboration title
- **Item Layout**: Avatar (50px), Name/Company, Request message preview (2 lines), Action buttons
- **Actions**: 3 buttons - Accept (primary), Decline (secondary), View Profile (ghost)

## Success Metrics
- Increased request response rate (target: 80% vs current baseline)
- Reduced time to first response (target: <24 hours)
- Higher host engagement with requests management

## Implementation Priority
1. **Phase 1**: Requests summary card on My Collabs page
2. **Phase 2**: Requests tab with basic list view and actions
3. **Phase 3**: Filtering and enhanced request display

## Dependencies
- Existing swipes/collaboration system
- User authentication system
- Current My Collabs page structure

## Out of Scope
- Advanced filtering and sorting
- Batch operations
- Request analytics
- Automated request handling
- Integration with external systems

## Acceptance Criteria

### Phase 1: Requests Summary Card
- [ ] Summary card displays at top of My Collabs page
- [ ] Shows latest 4 requests with avatar, name, company, collab type, timestamp
- [ ] Displays total pending request count
- [ ] "View All Requests" button navigates to requests tab
- [ ] Card is responsive on mobile devices

### Phase 2: Requests Management Tab
- [ ] Requests tab added to My Collabs section
- [ ] All pending requests displayed in list format
- [ ] Requests grouped by collaboration
- [ ] Accept/Decline actions functional
- [ ] View Profile action opens user profile
- [ ] Real-time updates when actions are taken

### Phase 3: Enhanced Display
- [ ] Filter options implemented (All, Pending, This Week)
- [ ] Request message preview displayed
- [ ] Proper loading and error states
- [ ] Pagination for large request lists

## Technical Notes

### Data Flow
1. User navigates to My Collabs page
2. RequestsSummaryCard fetches latest 4 requests via API
3. User clicks "View All Requests" to access full requests tab
4. RequestsTab fetches all requests with pagination
5. User actions (Accept/Decline) trigger API calls and UI updates

### State Management
- Use React Query for request data fetching and caching
- Optimistic updates for accept/decline actions
- Cache invalidation on successful actions

### Error Handling
- Display error messages for failed API calls
- Graceful degradation when no requests available
- Retry mechanisms for network failures