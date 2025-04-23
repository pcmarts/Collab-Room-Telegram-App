# Referral System Product Requirements Document (PRD)

## Document Information
- **Document Title**: The Collab Room - Referral System PRD
- **Document Version**: 1.0
- **Last Updated**: April 23, 2025
- **Status**: Draft

## 1. Introduction

### 1.1 Purpose
This document outlines the requirements for implementing a friend referral system in The Collab Room platform. The system aims to drive organic growth by encouraging existing users to invite friends, while creating a sense of exclusivity and FOMO (Fear of Missing Out).

### 1.2 Scope
The referral system will be integrated into the existing Collab Room platform, affecting the application status page, dashboard, and user onboarding process. It will include Telegram integration for seamless sharing of referral links.

### 1.3 Objectives
- Increase user growth through organic referrals
- Create a sense of exclusivity and FOMO
- Provide incentives for users to refer friends
- Enhance the onboarding experience for new users
- Drive engagement through gamification of the referral process

### 1.4 Success Metrics
- Number of successful referrals
- Conversion rate of referral link clicks to signed up users
- Percentage of users who share referral links
- Reduction in time between application and approval for referred users

## 2. Product Overview

### 2.1 Problem Statement
Currently, the platform has a manual approval process for new users, creating a waiting period that can reduce conversion. Additionally, there's no built-in mechanism to encourage existing users to invite friends, limiting organic growth potential.

### 2.2 Solution
Implement a referral system that:
1. Allows users to generate unique referral links
2. Limits each user to 3 referrals to create scarcity
3. Provides instant platform access to users who are referred
4. Notifies users when their referrals join
5. Displays statistics on referrals in the user dashboard

### 2.3 Target Users
- Existing platform users who want to invite friends
- Waitlisted users seeking faster access
- New users who receive a referral link

### 2.4 User Stories

#### Existing Users
- As an existing user, I want to generate a referral link so I can invite friends to the platform
- As an existing user, I want to track which friends I've referred so I can see who has joined
- As an existing user, I want to receive notifications when friends I've referred join so I know my invitation was successful
- As an existing user, I want to see how many referrals I have left so I can prioritize who to invite

#### Waitlisted Users
- As a waitlisted user, I want to invite friends to get instant access to the platform
- As a waitlisted user, I want to understand the benefits of referring friends so I'm motivated to do so

#### New Users
- As a new user with a referral link, I want to bypass the waiting list and get instant access
- As a new user, I want to understand that I received privileged access through a referral

## 3. Features and Requirements

### 3.1 Data Structure

#### Required Database Tables
- **user_referrals**: Tracks referral codes and limits for each user
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to users table)
  - `referral_code` (string, unique)
  - `total_available` (integer, default 3)
  - `total_used` (integer, default 0)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- **referral_events**: Tracks individual referral relationships
  - `id` (UUID, primary key)
  - `referrer_id` (UUID, foreign key to users table)
  - `referred_user_id` (UUID, foreign key to users table)
  - `status` (string, enum: pending, completed, expired)
  - `created_at` (timestamp)
  - `completed_at` (timestamp, nullable)

#### Referral Code Format
- Format: `${telegram_id}_${randomString(8)}`
- Example: `123456789_a1b2c3d4`

### 3.2 API Requirements

#### Endpoints
1. **Generate Referral Code**
   - `POST /api/referrals/generate`
   - Response includes referral code, shareable link, available/used counts
   - Rate limited to 5 requests per day per user
   - Idempotent - returns existing code if user already has one

2. **Get User's Referral Information**
   - `GET /api/referrals`
   - Returns referral code, limits, and list of referred friends
   - Includes details on referred users' status

3. **Verify Referral Code**
   - `POST /api/referrals/verify`
   - Validates if a referral code is valid and not expired
   - Checks for edge cases: self-referral, exhausted limits

4. **Apply Referral**
   - `POST /api/referrals/apply`
   - Links a new user to their referrer
   - Updates referral counts and user approval status

#### Security Requirements
- Rate limiting on all referral endpoints
- Input validation using Zod schemas
- Prevention of self-referrals
- Secure generation of referral codes
- Transaction-based operations for data consistency

### 3.3 Frontend Components

#### Application Status Page Updates
- Add referral section that explains the benefits of referring friends
- Include share buttons for Telegram and clipboard copying
- Show progress indicator for referred friends
- Display clear call-to-action to bypass the waiting list through referrals

#### Dashboard Updates
- Add "Invite Friends" section
- Show referral code and sharing options
- Display counter for available/used referrals
- List of referred friends with their status

#### UI Components
1. **ReferralCard**: Main component showing referral code and sharing options
2. **ReferralShareButtons**: Contains Telegram share and copy link buttons
3. **ReferredUsersList**: Shows which friends have been invited
4. **ReferralInfoPanel**: Explains the referral program and benefits

### 3.4 Telegram Integration

#### Deep Link Requirements
- Format: `https://t.me/collab_room_bot?start=r_[encoded_referral_info]`
- Secure encoding to prevent manipulation
- Proper parsing in the Telegram bot

#### Sharing Features
- Native Telegram share dialog
- Pre-populated message: "Hey, join my Collab Room!"
- Fallback to clipboard copying when sharing API isn't available

#### Notification System
- Notify referrer when their referral code is used
- Notify the new user about their instant access
- Use templated messages for consistency

### 3.5 Business Logic

#### Referral Limits
- Each user gets 3 referral slots by default
- Counting mechanism tracks used vs. available slots
- Clear visual indication when approaching the limit

#### Auto-Approval Logic
- Users who sign up with a valid referral code bypass the waiting list
- System automatically marks them as approved
- Update user records to indicate they were referred

#### Edge Cases Handling
1. **Self-Referral Attempt**: System detects and prevents
2. **Already Registered User**: System detects if email/Telegram ID already exists
3. **Multiple Codes Usage**: System only honors the first valid code used
4. **Referrer Account Deletion**: Referred users maintain their status

## 4. User Experience

### 4.1 Referral Flow

#### For Existing Users:
1. User views referral section on dashboard
2. User clicks "Generate Referral Link" if they don't have one
3. User chooses to share via Telegram or copy link
4. User receives notification when referred friend joins
5. User sees referred friend in their dashboard list

#### For New Users with Referral:
1. User clicks referral link shared by a friend
2. Link opens Telegram bot with pre-filled referral code
3. User completes signup process
4. User receives confirmation of instant access
5. User bypasses waiting list and gains immediate platform access

### 4.2 Design Requirements

#### Mobile-First Design
- All components must be fully responsive
- UI optimized for Telegram mobile interface
- Touch-friendly buttons and interactions

#### Visual Hierarchy
- Clear indication of referral benefits
- Prominent display of sharing options
- Visual progress indicator for referral slots
- Distinctive styling for referral-related elements

#### Accessibility Requirements
- Proper color contrast for all text
- Semantic HTML for screen reader compatibility
- Keyboard navigation support
- Focus management for interactive elements

## 5. Implementation Strategy

### 5.1 Phased Rollout

#### Phase 1: Referral Infrastructure
- Database schema changes
- Backend API implementation
- Security measures & rate limiting
- Migration script for existing users

#### Phase 2: UI Components & Basic Tracking
- Develop referral UI components
- Implement sharing functionality
- Basic referral tracking
- Testing UI components

#### Phase 3: Full Integration & Auto-Approval
- Telegram notification integration
- Auto-approval logic
- Analytics tracking
- Comprehensive edge case testing

### 5.2 Technical Considerations

#### Data Consistency
- Use database transactions for operations affecting multiple tables
- Implement idempotency for critical operations
- Ensure proper error handling and rollbacks

#### Performance
- Add caching for frequently accessed referral data
- Monitor database query performance
- Optimize for mobile network conditions

#### Security
- Validate all inputs server-side
- Protect against referral system abuse
- Implement rate limiting
- Secure storage of referral relationships

### 5.3 Documentation Requirements

#### Developer Documentation
- API documentation with request/response examples
- Component documentation with usage examples
- Database schema documentation
- Error handling guidelines

#### User Documentation
- Help content explaining the referral program
- FAQs about the referral process
- Clear explanations of referral limits

## 6. Testing Strategy

### 6.1 Unit Testing
- Test referral code generation
- Test referral verification logic
- Test auto-approval mechanism

### 6.2 Integration Testing
- Test Telegram sharing functionality
- Test referral application process
- Test notification delivery

### 6.3 Edge Case Testing
- Self-referral attempts
- Already registered users
- Multiple referral code usage
- Account deletion scenarios
- Rate limit enforcement

### 6.4 User Acceptance Testing
- Verify the entire referral flow
- Test with actual Telegram users
- Validate notification delivery
- Confirm proper tracking of referrals

## 7. Timeline and Resources

### 7.1 Development Timeline
- **Phase 1**: 3 days
- **Phase 2**: 4 days
- **Phase 3**: 3 days
- **Total**: 10 days (assuming 6-8 hours per day)

### 7.2 Required Resources
- Frontend developer with React/TypeScript experience
- Backend developer familiar with Express and PostgreSQL
- Designer for referral UI components
- QA resource for testing

## 8. Risks and Mitigations

### 8.1 Technical Risks
- **Risk**: Referral code generation could create non-unique codes
- **Mitigation**: Use combination of user ID and secure random string with uniqueness check

- **Risk**: Database consistency issues between referrals and user tables
- **Mitigation**: Use transactions for all operations affecting multiple tables

- **Risk**: Performance degradation from inefficient referral queries
- **Mitigation**: Implement proper indexing and caching strategies

### 8.2 User Experience Risks
- **Risk**: Users not understanding the referral program benefits
- **Mitigation**: Clear, concise explanations and visual indicators

- **Risk**: Frustration from users who exhaust their referral slots
- **Mitigation**: Clear communication about the limited nature of referrals

- **Risk**: Confusion when referral links don't work as expected
- **Mitigation**: Robust error handling with user-friendly messages

### 8.3 Business Risks
- **Risk**: Referral system abuse through fake accounts
- **Mitigation**: Implement verification steps and monitoring

- **Risk**: Low adoption of the referral feature
- **Mitigation**: Clear promotion of benefits and easy sharing process

## 9. Future Enhancements
- Adjustable referral limits based on user status
- Expanded rewards for successful referrers
- Analytics dashboard for referral performance
- A/B testing of different referral messaging
- Advanced referral program with tiered rewards

## 10. Approvals
- [ ] Product Manager
- [ ] Technical Lead
- [ ] Design Lead
- [ ] QA Lead