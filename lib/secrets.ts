// Central place for secrets that must never fall back to a hardcoded default —
// a silent fallback here would let anyone forge session JWTs or OTP hashes.
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET environment variable is not set. Refusing to start without it.'
    );
  }
  return secret;
}
