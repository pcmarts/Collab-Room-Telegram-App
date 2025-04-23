# Referral System Testing Plan

This document outlines the structured testing approach for the referral system implementation, with a focus on testing through the Telegram authentication environment. Each phase includes specific testing points with expected logs for verification.

## Important Testing Notes

- **Telegram Authentication**: Testing must be done through Telegram as authentication is Telegram-specific
- **Admin Account Required**: Initial testing should be performed with an admin account
- **Enhanced Logging**: Each test scenario has specific logging enabled to verify functionality
- **Step-by-Step Testing**: Each phase must be thoroughly tested before proceeding to the next

## Phase 1: Database Schema and Basic Services Testing

### Implementation Verification Tests

| Test ID | Test Description | Expected Result | Logs to Check |
|---------|-----------------|-----------------|---------------|
| P1-T1 | Verify database tables creation | Tables created successfully | Migration success logs with user counts |
| P1-T2 | Verify indexes on lookup fields | Indexes created successfully | Database index creation logs |
| P1-T3 | Verify service functions | Basic functions operate without errors | Service initialization logs |

### Admin User Testing Steps

```
As an admin user, please perform the following tests:

1. Log in to the application through Telegram with your admin account
2. Visit your profile page to confirm existing data loads correctly
3. Edit your profile information and save to verify no disruption
4. Submit a test application form with any referral code to verify the form still works

Testing Notes:
- We need to verify existing functionality hasn't been disrupted
- The referral features won't be visible yet, but infrastructure should be in place
- Enter "TEST_CODE_123" in the referral field to generate specific test logs

Please share any errors or unexpected behavior you encounter
```

### Expected Logs

```
[2025-XX-XX] [INFO] User authenticated via Telegram: {userId: "XXXX", telegramId: "XXXXX"}
[2025-XX-XX] [INFO] Profile data loaded for user {userId: "XXXX"}
[2025-XX-XX] [INFO] Profile updated for user {userId: "XXXX"}
[2025-XX-XX] [INFO] Application form submitted with referral code: TEST_CODE_123
[2025-XX-XX] [DEBUG] Referral code format validation: invalid format (test code)
```

## Phase 2: API Endpoints and Integration Testing

### Implementation Verification Tests

| Test ID | Test Description | Expected Result | Logs to Check |
|---------|-----------------|-----------------|---------------|
| P2-T1 | Verify `/api/referrals` endpoint | Returns correct user data | API request logs |
| P2-T2 | Verify `/api/referrals/generate` endpoint | Creates valid referral code | Referral generation logs |
| P2-T3 | Verify `/api/referrals/verify` endpoint | Validates codes correctly | Validation process logs |
| P2-T4 | Verify `/api/referrals/apply` endpoint | Processes applications correctly | Application processing logs |

### Admin User Testing Steps

```
As an admin user, please perform the following tests:

1. Log in to the application through Telegram with your admin account
2. Use the application with a valid referral code format (any code for testing)
3. Visit the dashboard to see if any referral features appear
4. Try generating a referral code using the provided endpoint: 
   curl -X POST https://[your-app-url]/api/referrals/generate 
   (with proper authentication)
5. Submit an application with the generated referral code

Testing Notes:
- We need to verify the API endpoints work correctly with Telegram authentication
- Focus on the API response format and error messages
- Try invalid scenarios (your own code, expired code) to test validation

Please share the API responses you receive
```

### Expected Logs

```
[2025-XX-XX] [INFO] Referral code generation requested for user {userId: "XXXX"}
[2025-XX-XX] [INFO] Generated new referral code: {telegramId}_[randomHex]
[2025-XX-XX] [INFO] Referral code verification requested for code: {code}
[2025-XX-XX] [INFO] Referral code verified successfully
[2025-XX-XX] [INFO] Referral application processed for user {userId: "XXXX"} with code: {code}
```

## Phase 3: UI Components and Final Integration Testing

### Implementation Verification Tests

| Test ID | Test Description | Expected Result | Logs to Check |
|---------|-----------------|-----------------|---------------|
| P3-T1 | Verify referral card UI component | Displays correctly | UI component rendering logs |
| P3-T2 | Verify Telegram share functionality | Opens Telegram share | Share action logs |
| P3-T3 | Verify haptic feedback | Provides appropriate feedback | Haptic trigger logs |
| P3-T4 | Verify referral list display | Shows referred users | Referral list retrieval logs |

### Admin User Testing Steps

```
As an admin user, please perform the complete referral system testing:

1. Log in to the application through Telegram with your admin account
2. Navigate to your dashboard/profile page
3. Locate and use the referral code generation feature
4. Test the "Copy Link" and "Share Link" buttons
5. Try sharing a referral with another test user
6. Use a second account to apply the referral code
7. Verify the referral status updates correctly
8. Check that referred users appear in your referral list

Testing Notes:
- This tests the complete user flow from generation to usage
- Verify that haptic feedback works on mobile devices
- Check that all UI elements are properly responsive
- Verify analytics events are being tracked

Please share screenshots of the referral UI and any issues encountered
```

### Expected Logs

```
[2025-XX-XX] [INFO] Referral UI component rendered for user {userId: "XXXX"}
[2025-XX-XX] [INFO] Referral code shared via Telegram
[2025-XX-XX] [INFO] Haptic feedback triggered for action: {action}
[2025-XX-XX] [INFO] Referral status updated: {status}
[2025-XX-XX] [INFO] Analytics event tracked: referral_link_shared
[2025-XX-XX] [INFO] Analytics event tracked: referral_link_clicked
[2025-XX-XX] [INFO] Analytics event tracked: referral_completed
```

## Testing Log Review Process

After each testing phase, follow this process for log review:

1. Collect all logs related to the referral system operations
2. Verify all expected log entries are present
3. Check for unexpected errors or warnings
4. Ensure user IDs and actions are properly tracked
5. Look for performance issues in database operations
6. Document any issues found with screenshots and log excerpts

## Edge Case Testing

In the final phase, test these specific edge cases:

1. **Self-referral attempt**: User tries to use their own referral code
2. **All referrals used**: User has reached their referral limit
3. **Invalid code format**: User enters incorrectly formatted code
4. **Multiple code usage**: User tries to apply multiple codes
5. **Code expiration**: Testing with expired or revoked codes

Each edge case should produce appropriate error messages and logs for verification.

## Completion Criteria

The referral system testing is considered complete when:

1. All three phases have been successfully tested
2. All expected logs are present and contain correct information
3. All edge cases have been tested and handle gracefully
4. The UI components display correctly on mobile and desktop
5. Analytics events are being tracked properly
6. No unhandled errors occur during normal operation