/**
 * Email validation utilities for Centrika OnePortal
 */

export const EMAIL_VALIDATION = {
  // Centrika domain
  CENTRIKA_DOMAIN: "@centrika.rw",
  
  // Email regex patterns
  BASIC_EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CENTRIKA_EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@centrika\.rw$/,
  
  // Email format rules
  MIN_LENGTH: 5,
  MAX_LENGTH: 254, // RFC 5321
};

/**
 * Validates basic email format
 * @param email - Email to validate
 * @returns true if valid basic email format
 */
export const isValidEmailFormat = (email: string): boolean => {
  if (!email || typeof email !== "string") return false;
  return EMAIL_VALIDATION.BASIC_EMAIL_REGEX.test(email.trim());
};

/**
 * Validates Centrika company email
 * @param email - Email to validate
 * @returns true if valid Centrika email (@centrika.rw)
 */
export const isValidCentrikaEmail = (email: string): boolean => {
  if (!email || typeof email !== "string") return false;
  return EMAIL_VALIDATION.CENTRIKA_EMAIL_REGEX.test(email.trim().toLowerCase());
};

/**
 * Comprehensive email validation
 * @param email - Email to validate
 * @returns { valid: boolean, error?: string }
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const trimmedEmail = email?.trim() || "";

  // Check if empty
  if (!trimmedEmail) {
    return { valid: false, error: "Email is required" };
  }

  // Check length
  if (trimmedEmail.length < EMAIL_VALIDATION.MIN_LENGTH) {
    return { valid: false, error: "Email is too short" };
  }

  if (trimmedEmail.length > EMAIL_VALIDATION.MAX_LENGTH) {
    return { valid: false, error: "Email is too long" };
  }

  // Check basic format
  if (!isValidEmailFormat(trimmedEmail)) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  // Check Centrika domain
  if (!isValidCentrikaEmail(trimmedEmail)) {
    return { 
      valid: false, 
      error: `Please use your company email (username@centrika.rw)` 
    };
  }

  return { valid: true };
};

/**
 * Get normalized email (lowercase and trimmed)
 * @param email - Email to normalize
 * @returns Normalized email string
 */
export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};
