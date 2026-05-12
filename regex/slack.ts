import type { Finding } from "@/shared/types";
import { matchesToFindings } from "./_helpers";

// Slack tokens: xoxb (bot), xoxa (legacy app), xoxp (user), xoxr (refresh),
// xoxs (workspace). Format: xox[a-z]-{numeric segments separated by dashes}.
const SLACK_RE = /\bxox[abpsr]-\d+-\d+-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)?\b/g;

export function detectSlackToken(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(SLACK_RE)), {
    category: "slack-token",
    label: "Slack token",
    defaultSeverity: "high",
  });
}
