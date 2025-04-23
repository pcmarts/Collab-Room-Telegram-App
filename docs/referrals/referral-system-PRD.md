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
- Engagement with referral UI elements (tooltip views, page visits)
- Referral funnel completion rates (generated → shared → completed)

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
  - `user_id` (UUID, foreign key to users table, indexed)
  - `referral_code` (string, unique, indexed)
  - `total_available` (integer, default 3)
  - `total_used` (integer, default 0)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- **referral_events**: Tracks individual referral relationships
  - `id` (UUID, primary key)
  - `referrer_id` (UUID, foreign key to users table, indexed)
  - `referred_user_id` (UUID, foreign key to users table, indexed)
  - `status` (string, enum: pending, completed, expired)
  - `created_at` (timestamp)
  - `completed_at` (timestamp, nullable)

- **referral_notifications**: Tracks delivery status of referral-related notifications
  - `id` (UUID, primary key)
  - `referral_event_id` (UUID, foreign key to referral_events table, indexed)
  - `recipient_id` (UUID, foreign key to users table, indexed)
  - `notification_type` (string, enum: referral_received, referral_completed, referral_limit_reached)
  - `status` (string, enum: queued, sent, delivered, failed)
  - `telegram_message_id` (string, nullable)
  - `created_at` (timestamp)
  - `sent_at` (timestamp, nullable)
  - `delivered_at` (timestamp, nullable)
  - `read_at` (timestamp, nullable)
  - `error_message` (string, nullable)
  - `retry_count` (integer, default 0)

#### Referral Code Format
- Format: `${telegram_id}_${randomString(8)}`
- Example: `123456789_a1b2c3d4`
- Must use URL-safe characters only (alphanumeric, underscores, dashes)
- No special characters that would require URL encoding

### 3.2 API Requirements

#### Modular Route Structure
- All referral-related routes should be in a separate file: `server/routes/referrals.ts`
- Main routes file imports and registers referral routes to avoid bloat
- Example registration pattern:
  ```typescript
  // In server/routes.ts
  import { referralRoutes } from './routes/referrals';
  
  // Register routes
  app.use('/api/referrals', referralRoutes);
  ```

#### Endpoints
1. **Generate Referral Code**
   - `POST /api/referrals/generate`
   - Response includes referral code, shareable link, available/used counts
   - Rate limited to 5 requests per day per user
   - Idempotent - always returns the same unique code for each user
   - Each user gets only one permanent code for their entire account lifetime

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
1. **ReferralCard**: Main component showing permanent referral code and sharing options
   - Displays the user's referral code automatically (no "Generate" button needed)
   - Shows the same code every time the user visits the page
   - Includes counters for available/used referrals
2. **ReferralShareButtons**: Contains Telegram share and copy link buttons
3. **ReferredUsersList**: Shows which friends have been invited
4. **ReferralInfoPanel**: Explains the referral program and benefits

#### Empty States and Celebrations
1. **NoReferralsYet**: Empty state when user hasn't referred anyone yet
   - Three-step explanation of how referrals work (Share → Friends Join → Track)
   - Clear call-to-action button to share the pre-generated referral code
   - Consistent design with 65% opacity for background elements

2. **AllReferralsUsed**: Empty state when user has used all referral slots
   - Thank you message for helping grow the community
   - Clear explanation that all slots have been used
   - Visual indication that limit has been reached
   - Option to view referred friends and their status

3. **SuccessfulReferralCelebration**: Animation shown when a referred friend joins
   - Confetti animation with brand colors
   - Haptic feedback on mobile devices (via Telegram WebApp API)
   - Congratulatory message with friend's name
   - Sound effect (with mute option)

#### Contextual Help
1. **ReferralTooltips**: Context-sensitive help throughout the interface
   - Explanation of referral limits when hovering over counter
   - Instructions for sharing when hovering over share buttons
   - Clarification of status indicators in the referred friends list
   - Tips for writing effective invitation messages

### 3.4 Telegram Integration

#### Deep Link Requirements
- Format: `https://t.me/collab_room_bot?start=r_[encoded_referral_info]`
- Secure encoding to prevent manipulation
- Proper parsing in the Telegram bot

#### Sharing Features
- Native Telegram share dialog
- Pre-populated message: "Hey, I think you should check out Collab Room!"
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
2. User sees their permanent referral link (automatically generated on first visit)
3. User chooses to share via Telegram or copy link
4. User receives notification when referred friend joins
5. User sees referred friend in their dashboard list
6. User can return anytime to access the same referral link

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
- Feature flag implementation for controlled rollout
- Notification table setup and integration

#### Phase 2: UI Components & Basic Tracking
- Develop referral UI components with empty states
- Implement sharing functionality
- Basic referral tracking
- Testing UI components
- Implement contextual help tooltips
- Build celebration animations for successful referrals

#### Phase 3: Full Integration & Auto-Approval
- Telegram notification integration with delivery tracking
- Auto-approval logic
- Analytics tracking and dashboard implementation
- Notification delivery monitoring system
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
- Ensure proper indexing on all lookup fields (referral_code, user_id, etc.)
- Implement batching for bulk operations

#### Security
- Validate all inputs server-side
- Protect against referral system abuse
- Implement rate limiting
- Secure storage of referral relationships

#### Error Handling
- Provide clear error messages when referral limits are reached
- Implement proper error logging for failed referral operations
- Create specific error codes for common issues (invalid code, self-referral, etc.)
- Handle edge cases gracefully with user-friendly messages

### 5.3 Analytics & Monitoring

#### Analytics Events to Track
- **referral_code_generated**: When a user generates a referral code
- **referral_link_copied**: When a user copies their referral link
- **referral_link_shared**: When a user shares via Telegram dialog
- **referral_link_clicked**: When a referred user clicks a referral link
- **referral_signup_started**: When a referred user begins signup process
- **referral_signup_completed**: When a referred user completes signup
- **tooltip_viewed**: When a user interacts with contextual help tooltips
- **referral_limit_reached**: When a user has used all available referrals
- **celebration_displayed**: When the success animation is shown
- **empty_state_viewed**: When a user sees an empty state screen

#### Analytics Dashboard
- **Referral Funnel Visualization**: Shows conversion through each step
  - First Visit → Sharing → Clicks → Signups → Completions
- **User Engagement Metrics**: Which UI elements are most interacted with
- **Referral Source Analysis**: Which sharing methods are most effective
- **Time-to-Conversion Tracking**: How long it takes from share to signup
- **Referral Program Health Indicators**: Overall program effectiveness
- **Conversion Funnel Analysis**: Detailed view of user progression through the referral process with drop-off points highlighted
- **Cohort Analysis**: Performance of referrals based on user segments and time periods

#### Notification Delivery Monitoring
- Track delivery status of all referral-related notifications
- Monitor notification delivery success rates
- Track notification engagement (read rates, click-through rates)
- Alert on notification delivery failures above threshold
- Dashboard to visualize notification performance over time
- Daily/weekly delivery success rate reports
- Detailed error categorization for failed deliveries
- Notification template performance comparison

### 5.4 Documentation Requirements

#### Developer Documentation
- API documentation with request/response examples
- Component documentation with usage examples
- Database schema documentation
- Error handling guidelines

#### User Documentation
- Help content explaining the referral program
- FAQs about the referral process
- Clear explanations of referral limits
- Contextual tooltips for all referral UI elements

## 6. Testing Strategy

### 6.1 Unit Testing
- Test referral code generation
- Test referral verification logic
- Test auto-approval mechanism

### 6.2 Integration Testing
- Test Telegram sharing functionality
- Test referral application process
- Test notification delivery
- Test empty state displays
- Test celebration animations
- Test haptic feedback integration

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

## 12. Integration with Existing Systems

### 12.1 Application Form Updates
- Leverage the existing referral code field in the application form
- Enhance validation to ensure code format matches referral system requirements
- Update form submission logic to process referral codes through the new referral system
- Update success messaging to acknowledge referral usage

### 12.2 Profile Page Updates
- Add "Referrals" tab to user profile page
- Ensure profile edit operations preserve referral relationships
- Add referral statistics to admin user view
- Include referral information in user exports

### 12.3 Notification System Updates
- Add referral notification type to user notification preferences
- Create new Telegram message templates for:
  - "Your referral code was used"
  - "You have been referred by [user]"
  - "Your referred friend has joined"
- Update notification tracking to include referral-specific events

### 12.4 Admin Interface Updates
- Add "Referrals" section to admin dashboard with:
  - Total referrals generated
  - Conversion rate (referral links → signups)
  - Top referrers list
- Add referral source indication to user approval queue
- Create admin tools to adjust referral limits for specific users

### 12.5 Analytics Integration
- Update user acquisition source tracking to include "referral" as a source
- Tag all users acquired through referrals in analytics systems
- Extend conversion funnels to include referral-specific paths
- Create referral performance reports

### 12.6 Security Considerations
- Apply basic rate limiting rules to referral endpoints:
  - Maximum 5 referral code verification attempts per minute per user
- Implement simple referral validation rules:
  - Prevent self-referrals
  - Validate referral code format
  - Check referral limits

### 12.7 Database Migration Strategy
- Phase 1: Create new tables without foreign key constraints
- Phase 2: Populate default values for existing users
- Phase 3: Add foreign key constraints and indexes
- Include rollback plan for each migration step
- Schedule migrations during low-traffic periods
- Add database health monitoring during and after migrations

### 12.8 Mobile-Specific Considerations
- Ensure referral code copy works with mobile clipboard
- Use native share sheet on mobile devices when available
- Optimize referral card display for smaller screens
- Test referral flows on various mobile device sizes
- Implement mobile-specific haptic feedback patterns

## 10. Implementation Patterns

### 10.1 Telegram Integration Patterns
- Follow existing Haptic Feedback system pattern from `docs/telegram/haptic-feedback.md`:
  ```typescript
  // Example implementation for Telegram haptic feedback
  const triggerReferralHaptic = (type: 'generated' | 'shared' | 'completed') => {
    // Check if Telegram WebApp and HapticFeedback is available
    if (!window.Telegram?.WebApp?.HapticFeedback) {
      console.log('Haptic feedback not available in this environment');
      return;
    }
    
    const haptic = window.Telegram.WebApp.HapticFeedback;
    
    try {
      switch (type) {
        case 'generated':
          // Medium impact followed by light tap for code generation
          haptic.impactOccurred('medium');
          break;
        case 'shared':
          // Light impact for sharing action
          haptic.impactOccurred('light');
          break;
        case 'completed':
          // Success notification pattern for completed referral
          haptic.notificationOccurred('success');
          setTimeout(() => haptic.impactOccurred('light'), 100);
          break;
      }
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  };
  ```

### 10.2 Security Implementation Patterns
- Use established rate limiter middleware pattern:
  ```typescript
  // Example implementation of rate limiter for referral endpoints
  export const referralLimiter = createRateLimiter({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: 5, // 5 requests per day
    message: "Too many referral requests, please try again tomorrow",
    skipIfDevelopment: true
  });
  
  // Apply to routes
  app.post('/api/referrals/generate', referralLimiter, handleReferralGeneration);
  ```

- Apply consistent security headers in new API endpoints:
  ```typescript
  // Example security headers setup
  app.use((req, res, next) => {
    // Add standard security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
  });
  ```

- Use established logger utility with automatic sensitive data redaction:
  ```typescript
  // Example logging pattern
  logger.info('Referral code generated', {
    userId: user.id,
    // Logger will automatically redact sensitive information
    referralCode: referralCode
  });
  ```

### 10.3 React Query Integration Patterns
- Configure referral-related queries with the same settings used throughout the app:
  ```typescript
  const { data: referralInfo } = useQuery({
    queryKey: ['/api/referrals'],
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: false,
  });
  ```

### 10.4 Database Access Patterns
- Use proper SQL import pattern:
  ```typescript
  // Correct pattern
  import { sql } from 'drizzle-orm';
  
  // Instead of
  // import { sql } from '@neondatabase/serverless';
  ```

- Implement consistent transaction management:
  ```typescript
  // Example transaction pattern for first-time referral code generation
  await db.transaction(async (tx) => {
    // Check if user already has a referral code
    const [existingReferral] = await tx.select()
      .from(referrals)
      .where(eq(referrals.userId, user.id));
      
    // If user already has a referral code, return it
    if (existingReferral) {
      return {
        referralCode: existingReferral.referralCode,
        totalAvailable: existingReferral.totalAvailable,
        totalUsed: existingReferral.totalUsed
      };
    }
    
    // Otherwise, create a new permanent referral code
    const generatedCode = generateUniqueReferralCode(user.telegramId);
    
    // Create referral record
    const [newReferral] = await tx.insert(referrals).values({
      userId: user.id,
      referralCode: generatedCode,
      totalAvailable: 3,
      totalUsed: 0
    }).returning();
    
    // Update user record
    await tx.update(users)
      .set({ hasReferralCode: true })
      .where(eq(users.id, user.id));
      
    return {
      referralCode: newReferral.referralCode,
      totalAvailable: newReferral.totalAvailable,
      totalUsed: newReferral.totalUsed
    };
  });
  ```

### 10.5 Mobile UI Patterns
- Use scrollable containers with fixed button pattern:
  ```tsx
  // Example UI pattern
  <div className="overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
    <div className="pb-32">
      {/* Referral content */}
      <ReferralCard />
      <ReferredUsersList users={referredUsers} />
    </div>
  </div>
  <TelegramFixedButtonContainer>
    <ReferralShareButtons />
  </TelegramFixedButtonContainer>
  ```

- Apply existing scroll behavior patterns for consistent mobile experience

### 10.6 Feature Flag Implementation
- Use environment variable based feature flag:
  ```typescript
  // In server/config.ts
  ENABLE_REFERRAL_SYSTEM: z.boolean().default(false),
  
  // In client-side code
  const isReferralEnabled = useMemo(() => {
    return !!window.ENV?.ENABLE_REFERRAL_SYSTEM;
  }, []);
  
  // Conditionally render components based on flag
  {isReferralEnabled && <ReferralCard />}
  ```

## 11. Approvals
- [ ] Product Manager
- [ ] Technical Lead
- [ ] Design Lead
- [ ] QA Lead