# User Flows

This document describes the key user journeys through The Collab Room platform. These flows illustrate how users interact with the application to accomplish specific goals.

## 1. New User Onboarding

### Flow Steps

1. **Initial Entry**
   - User opens Telegram bot
   - Bot presents a welcome message with a "Join Now" button
   - User clicks the button and opens the WebApp

2. **Personal Information**
   - User completes personal information form:
     - Name
     - Email
     - Job title
     - LinkedIn URL
     - Twitter URL
     - Twitter followers count
     - Referral code (optional)
   - User clicks "Next" to continue

3. **Company Information**
   - User completes company information form:
     - Company name
     - Website
     - Description
     - Twitter handle
     - LinkedIn URL
   - User clicks "Next" to continue

4. **Company Details**
   - User specifies company details:
     - Company category
     - Company size
     - Funding stage
     - Has token (Yes/No)
     - Token ticker (if applicable)
     - Blockchain networks (if applicable)
   - User clicks "Next" to continue

5. **Company Tags**
   - User selects relevant tags for their company
   - User clicks "Next" to continue

6. **Collaboration Preferences**
   - User selects their collaboration preferences:
     - Types of collaborations they want to discover
     - Types of collaborations they want to host
     - Twitter collaboration types
     - Marketing topics
   - User clicks "Next" to continue

7. **Admin Approval**
   - User submission is sent for admin approval
   - Admin receives notification about the new user
   - Admin approves or rejects the user
   - User receives notification about approval status

8. **Dashboard Access**
   - Upon approval, user gains access to the full dashboard
   - User can now create collaborations and discover opportunities

## 2. Creating a Collaboration

### Flow Steps

1. **Initiate Creation**
   - User navigates to "Create Collaboration" from the dashboard
   - User selects the type of collaboration to create (e.g., podcast, Twitter spaces, research report)

2. **Basic Information**
   - User completes basic information:
     - Title
     - Description
     - Goals
     - Expectations
   - User clicks "Next" to continue

3. **Collaboration Details**
   - User completes collaboration-specific details based on the selected type:
     - For podcasts: Podcast name, estimated reach, streaming link
     - For Twitter spaces: Topic, host handle, follower count
     - For research reports: Report name, topic, target release date, reach
     - For other types: Relevant specific fields
   - User clicks "Next" to continue

4. **Additional Requirements**
   - User specifies additional requirements:
     - Preferred topics
     - Availability
     - Target audience
   - User clicks "Submit" to finalize

5. **Confirmation**
   - User receives confirmation that the collaboration has been created
   - Collaboration is now visible in the user's "My Collaborations" section
   - Collaboration becomes available for discovery by other users

## 3. Discovering Collaborations

### Flow Steps

1. **Access Discovery**
   - User navigates to "Discover" from the dashboard
   - System loads and displays discovery cards

2. **Setting Filters** (Optional)
   - User can set discovery filters:
     - Collaboration types
     - Company tags
     - Minimum followers
     - Funding stages
     - Blockchain networks
     - Other criteria
   - System applies filters to discovery cards

3. **Viewing Cards**
   - User browses through swipeable cards
   - Each card shows basic collaboration information:
     - Collaboration type
     - Title
     - Company
     - Brief description

4. **Card Interaction**
   - User can:
     - Swipe right to express interest
     - Swipe left to dismiss
     - Tap to view more details

5. **Viewing Details**
   - When tapped, a dialog shows full collaboration details:
     - Complete description
     - Goals and expectations
     - Company information
     - Type-specific details
   - User can apply directly from this dialog

## 4. Applying to a Collaboration

### Flow Steps

1. **Initiate Application**
   - User finds a collaboration of interest
   - User clicks "Apply" button

2. **Complete Application Form**
   - User completes application-specific fields:
     - Reason for application
     - Relevant experience
     - Availability
     - Additional information based on collaboration type
   - User clicks "Submit"

3. **Application Confirmation**
   - User receives confirmation that the application has been submitted
   - Application appears in the user's "My Applications" section

4. **Creator Review**
   - Collaboration creator receives notification about the new application
   - Creator reviews the application details
   - Creator accepts or rejects the application

5. **Application Status Update**
   - User receives notification about the application status change
   - If accepted, communication details are shared for next steps
   - If rejected, user receives feedback (optional)

## 5. Managing Collaboration Applications

### Flow Steps

1. **Access Applications**
   - Collaboration creator navigates to "My Collaborations"
   - Creator selects a specific collaboration
   - Creator views the "Applications" tab

2. **Review Applications**
   - Creator reviews each application:
     - Applicant details
     - Application responses
     - Company information

3. **Decision Making**
   - Creator can:
     - Accept an application
     - Reject an application
     - Message the applicant for more information

4. **Application Management**
   - For accepted applications:
     - Creator can initiate communication
     - Creator can track progress
     - Creator can mark collaboration as completed
   - For rejected applications:
     - Creator can provide feedback
     - Creator can reconsider in the future

## 6. Admin User Management

### Flow Steps

1. **Access Admin Dashboard**
   - Admin user logs in
   - Admin navigates to the admin dashboard

2. **User Management**
   - Admin reviews list of users:
     - Pending approvals
     - Active users
     - Rejected users

3. **Approval Process**
   - Admin reviews user details:
     - Personal information
     - Company information
     - LinkedIn and Twitter profiles
   - Admin approves or rejects the user
   - System sends notification to the user

4. **User Monitoring**
   - Admin can:
     - View user activity
     - Temporarily suspend users
     - Permanently ban users
     - Impersonate users for support purposes

## 7. Conference Matchmaking

### Flow Steps

1. **Set Conference Preferences**
   - User navigates to "Conference Coffees" section
   - User selects a conference they're attending
   - User sets meeting preferences:
     - Available times
     - Meeting goals
     - Company sectors of interest
     - Funding stages of interest

2. **Finding Matches**
   - System identifies potential matches based on:
     - Both users attending the same conference
     - Complementary meeting goals
     - Compatible schedules
     - Mutual sector interests

3. **Scheduling Meetings**
   - User reviews potential matches
   - User expresses interest in specific matches
   - When matches are mutual, system facilitates scheduling
   - System sends confirmation to both parties