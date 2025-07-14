# Special Referral Codes Auto-Approval System

## Overview

The special codes auto-approval system allows users to bypass the manual approval process when they apply with predefined special referral codes. This feature is useful for VIP users, partners, beta testers, or other special groups who should receive immediate access to the platform.

## How It Works

1. **Special Codes**: A predefined list of special referral codes that trigger automatic approval
2. **Auto-Detection**: When a user applies with a special code, the system automatically detects it
3. **Immediate Approval**: The user is instantly approved and can access the platform
4. **Notifications**: Both the user and admins are notified about the auto-approval

## Special Codes List

The following special codes are currently configured to trigger auto-approval:

- `ADMIN_INSTANT` - Admin instant access
- `VIP_ACCESS` - VIP user access
- `PARTNER_INVITE` - Partner invitation
- `BETA_TESTER` - Beta tester access
- `EARLY_ACCESS` - Early access program
- `STAFF_INVITE` - Staff invitation
- `LAUNCH_CREW` - Launch crew access
- `FOUNDER_FRIEND` - Founder friend access
- `INVESTOR_GUEST` - Investor guest access
- `MEDIA_PASS` - Media pass access

## Implementation Details

### Code Location
- Special codes are defined in: `server/config/special-codes.ts`
- Auto-approval logic is in: `server/routes.ts` (onboarding endpoint)
- Management API routes: `server/routes/special-codes.ts`

### Key Features
- **Case Insensitive**: Codes work regardless of case (`VIP_ACCESS`, `vip_access`, `Vip_Access`)
- **Whitespace Tolerant**: Leading/trailing spaces are automatically trimmed
- **Flexible Management**: Codes can be added/removed at runtime via API
- **Comprehensive Logging**: All auto-approval actions are logged for audit

### API Endpoints

#### Check if Code is Special
```bash
POST /api/special-codes/check
Content-Type: application/json

{
  "code": "VIP_ACCESS"
}
```

#### List All Special Codes (Admin)
```bash
GET /api/special-codes/list
```

#### Add New Special Code (Admin)
```bash
POST /api/special-codes/add
Content-Type: application/json

{
  "code": "NEW_SPECIAL_CODE"
}
```

#### Remove Special Code (Admin)
```bash
POST /api/special-codes/remove
Content-Type: application/json

{
  "code": "OLD_SPECIAL_CODE"
}
```

## Usage Flow

### For Users with Special Codes
1. User receives special referral code from admin/partner
2. User visits application form and enters the special code
3. User completes application normally
4. System automatically approves the user upon submission
5. **Enhanced Frontend Experience**: User sees special toast notification: "🎉 Auto-Approved! You've been automatically approved using referral code: [CODE]"
6. **Direct Navigation**: User redirected directly to /discover page (bypasses application status page)
7. **Enhanced Telegram Notification**: User receives personalized approval message: "🎉 Congratulations! You've been automatically approved! ✨ You used the special referral code: [CODE]"
8. User gains instant access to platform

### For Regular Users
1. User enters regular referral code (or none)
2. User completes application normally
3. System processes regular referral logic
4. User status remains pending
5. User redirected to application status page
6. Admin receives notification for manual approval

### For Admins
1. Admin can view all special codes via API
2. Admin can add new special codes as needed
3. **Enhanced Admin Notifications**: Admin receives differentiated notifications for auto-approved users showing referral code used
4. Admin can audit auto-approval activity via logs

## Testing

### Test Script
Run the test script to verify functionality:
```bash
npx tsx scripts/test-special-codes.ts
```

### Manual Testing
1. Use any special code (e.g., `VIP_ACCESS`) in the application form
2. Submit the application
3. Check logs for auto-approval messages
4. Verify user is immediately approved in database
5. Confirm notifications are sent

## Security Considerations

- Special codes should be kept confidential
- Codes should be periodically rotated for security
- Admin access to manage codes should be restricted
- All auto-approval actions are logged for audit trail
- Consider implementing expiration dates for codes if needed

## Logging

The system logs the following auto-approval events:
- Detection of special codes during application
- User auto-approval actions
- Admin notifications about auto-approved users
- Special code management operations (add/remove)

## Error Handling

- Invalid codes are treated as regular referral codes
- Auto-approval failures don't prevent application submission
- Notification failures don't block the approval process
- All errors are logged with detailed context

## Future Enhancements

Potential improvements for the system:
- Expiration dates for special codes
- Usage limits per code
- Code-specific metadata (purpose, creator, etc.)
- Analytics dashboard for auto-approval statistics
- Integration with external authentication systems