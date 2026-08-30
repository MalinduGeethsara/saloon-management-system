// Single source of truth for phone number handling across the app.
// Canonical DB storage form: bare 9-digit local number, no leading 0, no country code (e.g. "771234567").

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizePhone(value: string): string {
  let digits = digitsOnly(value);
  if (digits.startsWith('94') && digits.length > 9) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

// Sri Lankan mobile prefixes are 070-078
export function isValidSriLankanMobile(value: string): boolean {
  return /^7[0-8]\d{7}$/.test(normalizePhone(value));
}

// Format notify.lk (and most SL SMS gateways) require: country code, no +, no leading 0
export function toNotifyLkFormat(value: string): string {
  return `94${normalizePhone(value)}`;
}
