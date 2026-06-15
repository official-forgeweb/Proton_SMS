/**
 * Formats a phone number string to E.164 format.
 * Defaults to prepending "+91" (India) for 10-digit numbers.
 *
 * @param phone Raw phone number string
 * @returns Formatted phone number starting with "+"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all spaces, dashes, brackets, and non-numeric characters except '+'
  let cleaned = phone.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Handle leading "00" as "+"
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.substring(2);
  }

  // If it's a standard 10-digit local mobile number, default to +91
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }

  // If it's a 12-digit number starting with 91, prepend '+'
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return '+' + cleaned;
  }

  // If it's 11 or more digits, assume it already contains some country code
  if (cleaned.length >= 11) {
    return '+' + cleaned;
  }

  return '+' + cleaned;
}
