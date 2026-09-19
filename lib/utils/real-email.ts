// Walk-in customers get a placeholder address (walkin_<timestamp>@salon.com) that must never be emailed
const PLACEHOLDER_EMAIL = /^walkin_.+@salon\.com$/i;

export function realEmail(email: string | null | undefined): string | null {
  if (!email || PLACEHOLDER_EMAIL.test(email)) return null;
  return email;
}
