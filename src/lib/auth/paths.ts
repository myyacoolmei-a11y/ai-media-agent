export function safeInternalPath(value: string | null, fallback = "/admin") {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\") ||
    value.includes("://")
  ) {
    return fallback;
  }
  return value;
}
