/**
 * Configuration for special referral codes that trigger automatic approval
 * 
 * These codes bypass the normal manual approval process and immediately
 * approve users when they apply with one of these codes.
 */

// Special codes that trigger auto-approval
export const SPECIAL_AUTO_APPROVE_CODES = [
  'ADMIN_INSTANT',
  'VIP_ACCESS',
  'PARTNER_INVITE',
  'BETA_TESTER',
  'EARLY_ACCESS',
  'STAFF_INVITE',
  'LAUNCH_CREW',
  'FOUNDER_FRIEND',
  'INVESTOR_GUEST',
  'MEDIA_PASS'
];

/**
 * Check if a referral code is a special auto-approval code
 * @param code The referral code to check
 * @returns boolean indicating if the code triggers auto-approval
 */
export function isAutoApprovalCode(code: string): boolean {
  if (!code) return false;
  
  // Normalize the code (uppercase, trim whitespace)
  const normalizedCode = code.trim().toUpperCase();
  
  return SPECIAL_AUTO_APPROVE_CODES.includes(normalizedCode);
}

/**
 * Get a formatted list of special codes for admin reference
 * @returns Array of special codes
 */
export function getSpecialCodes(): string[] {
  return [...SPECIAL_AUTO_APPROVE_CODES];
}

/**
 * Add a new special code (for runtime additions)
 * @param code The new code to add
 */
export function addSpecialCode(code: string): void {
  const normalizedCode = code.trim().toUpperCase();
  if (!SPECIAL_AUTO_APPROVE_CODES.includes(normalizedCode)) {
    SPECIAL_AUTO_APPROVE_CODES.push(normalizedCode);
  }
}

/**
 * Remove a special code (for runtime removals)
 * @param code The code to remove
 */
export function removeSpecialCode(code: string): void {
  const normalizedCode = code.trim().toUpperCase();
  const index = SPECIAL_AUTO_APPROVE_CODES.indexOf(normalizedCode);
  if (index > -1) {
    SPECIAL_AUTO_APPROVE_CODES.splice(index, 1);
  }
}