/**
 * Phone number utilities for Sri Lankan numbers.
 * Handles normalization to E.164 format (+94XXXXXXXXX).
 */

/**
 * Normalizes a Sri Lankan phone number to E.164 format (+94XXXXXXXXX).
 * Accepts:
 *   07XXXXXXXX   → +947XXXXXXXX
 *   947XXXXXXXX  → +947XXXXXXXX
 *   +947XXXXXXXX → +947XXXXXXXX
 * Returns null if the number cannot be normalized.
 */
export function normalizePhone(phone: string): string | null {
  // Strip whitespace, dashes, parentheses, dots
  const stripped = phone.replace(/[\s\-().+]/g, '');

  if (!stripped) return null;

  // Already has country code without leading +: 947XXXXXXXX (11 digits)
  if (/^947\d{8}$/.test(stripped)) {
    return `+${stripped}`;
  }

  // Local format: 07XXXXXXXX (10 digits)
  if (/^07\d{8}$/.test(stripped)) {
    return `+94${stripped.slice(1)}`;
  }

  // If user typed +94... we stripped the + above, so: 947XXXXXXXX or 94XXXXXXXXX
  if (/^94\d{9}$/.test(stripped)) {
    return `+${stripped}`;
  }

  return null;
}

/**
 * Returns true if the given raw phone string is a valid Sri Lankan mobile number.
 */
export function isValidSriLankanPhone(phone: string): boolean {
  return normalizePhone(phone) !== null;
}
