# Simplified Signup Flow Documentation

## Overview
The signup flow has been significantly simplified to enable faster user registration by removing non-essential fields that can be completed later in the dashboard.

## Changes Made (August 2025)

### Removed Fields from Signup Process
1. **Personal Info Page**:
   - Twitter follower count field
   - LinkedIn URL field (completely removed)

2. **Company Basics Page**:
   - Company Twitter follower count
   - Company funding stage
   - Company LinkedIn URL
   - Company sectors (entire page removed)
   - Token information (ticker, blockchain networks)

3. **Removed Pages**:
   - Company sector selection page
   - Collaboration preferences intermediate page (unwanted step)

### Current Simplified Flow
```
Welcome → Personal Info → Company Basics → Application Status
```

### Required Fields
**Personal Info Page**:
- First Name *
- Last Name *  
- My Company Email Address *
- My Personal Twitter URL (optional)
- Telegram Username (auto-filled, read-only)

**Company Basics Page**:
- Company Name *
- Your Job Title / Role *
- Company Website *
- Company Twitter *

### Technical Implementation

#### Twitter URL Processing
- **Frontend**: Extracts handle from full URLs before submission using regex pattern
- **Backend**: Processes both onboarding and company update endpoints to store only handles
- **Database**: Stores clean handles (e.g., "web3career") instead of full URLs
- **Supported Formats**: https://x.com/handle, https://twitter.com/handle, https://www.x.com/handle

#### Frontend Changes
- Updated form validation to only require essential fields
- Removed form fields and UI components for optional data
- Fixed navigation to skip removed intermediate steps
- Updated form submission to include default values for removed fields

#### Backend Changes  
- Updated API validation to not require removed fields
- Set sensible defaults for database constraints (e.g., funding_stage: 'Pre-seed')
- Maintained database schema compatibility
- Fixed database insertion issues with proper null handling
- Added Twitter URL parsing in both onboarding and company update endpoints
- Fixed database to store only handles, not full URLs

#### Database Defaults
- `funding_stage`: 'Pre-seed' (matches database constraint)
- `linkedin_url`: null
- `company_linkedin_url`: null  
- `twitter_followers`: null
- `company_twitter_followers`: null
- `has_token`: false
- `blockchain_networks`: []
- `tags`: []

### Dashboard Editing
All removed fields remain fully editable in the dashboard's company-info page, allowing users to complete their profiles after initial registration.

### Benefits
1. **Faster Registration**: Reduced form fields by ~60%
2. **Better User Experience**: Streamlined 3-step process
3. **Higher Conversion**: Less friction in signup process
4. **Flexible Completion**: Optional fields available in dashboard
5. **Database Integrity**: Maintained all existing functionality

## Testing
- Signup flow tested end-to-end
- Database submission working correctly
- Telegram notifications functioning
- Admin approval process unchanged
- Dashboard editing confirmed functional
- Pending application status card displays correctly for unapproved users

## Related Features
- **Pending Application Status Card**: Users see clear status feedback on discover page after signup
- **Twitter URL Processing**: Clean handle extraction from full URLs during form submission