import type { Finding } from "@/shared/types";
import { matchesToFindings } from "./_helpers";

// GitHub PATs and OAuth tokens use 5 distinct prefixes:
//   ghp_ — personal access token (classic)
//   ghs_ — server-to-server installation token
//   ghu_ — user-to-server token
//   gho_ — OAuth access token
//   ghr_ — refresh token
// Length is 36+ characters of base62 after the prefix.
const GITHUB_RE = /\bgh[opsur]_[A-Za-z0-9]{36,}\b/g;

export function detectGithubToken(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(GITHUB_RE)), {
    category: "github-token",
    label: "GitHub token",
    defaultSeverity: "critical",
  });
}
