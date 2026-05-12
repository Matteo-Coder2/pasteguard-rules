import type { Finding } from "@/shared/types";
import { matchesToFindings } from "./_helpers";

// JWT: three base64url segments separated by dots. The first segment must
// decode to a JSON header containing "alg" — we verify that to suppress noise.
const JWT_RE = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

export function detectJwt(text: string): Finding[] {
  const matches = Array.from(text.matchAll(JWT_RE)).filter((m) => looksLikeJwt(m[0]));
  return matchesToFindings(text, matches, {
    category: "jwt",
    label: "JSON Web Token",
    defaultSeverity: "high",
  });
}

function looksLikeJwt(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const header = parts[0];
  if (!header) return false;
  try {
    const padded = header.padEnd(header.length + ((4 - (header.length % 4)) % 4), "=");
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return /"alg"\s*:/.test(decoded);
  } catch {
    return false;
  }
}
