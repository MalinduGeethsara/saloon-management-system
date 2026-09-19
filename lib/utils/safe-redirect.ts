// Client-safe (no server imports): where to send someone after they sign in.
// Only same-site paths are honoured ("/profile", "/booking?step=6"). Anything that could leave the
// site ("https://evil.example", "//evil.example", "/\evil.example", "javascript:...") falls back, so
// a crafted /login?callbackUrl=... link cannot bounce a freshly signed-in user to a look-alike site.
export function safeCallbackPath(value: string | null | undefined, fallback: string): string {
  if (!value || !/^\/(?![/\\])/.test(value) || /[\\\r\n\t]/.test(value)) return fallback;
  return value;
}
