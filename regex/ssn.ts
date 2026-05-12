import type { Finding } from "@/shared/types";
import { matchesToFindings, lineColumnFor, makeFindingId } from "./_helpers";

// Formatted SSN: AAA-GG-SSSS or AAA GG SSSS. We allow any leading digit
// (including the technically-reserved 666 and 9XX area numbers) — in a paste
// guard, anything SSN-shaped is more likely to be sensitive than not.
// Only reject the obvious all-placeholder shapes (000 area, 00 middle,
// 0000 serial — these are explicitly invalid by SSA rules and the most
// common "fake data" patterns).
const SSN_RE = /\b(?!000)\d{3}([- ])(?!00)\d{2}\1(?!0000)\d{4}\b/g;

// Context-aware unformatted SSN: 9-digit number near the keywords "SSN" or
// "social security". Catches typed cases like "SSN 123456789" that the
// formatted regex misses. Window is 32 chars to keep the match local.
const SSN_CONTEXT_RE =
  /(?:SSN|social[\s-]*security(?:[\s-]*number)?)[^\d\n]{0,32}((?!000)\d{3}(?!00)\d{2}(?!0000)\d{4})\b/gi;

export function detectSsn(text: string): Finding[] {
  const out: Finding[] = matchesToFindings(text, Array.from(text.matchAll(SSN_RE)), {
    category: "ssn",
    label: "US Social Security Number",
    defaultSeverity: "high",
  });

  // Context-aware unformatted matches.
  for (const m of text.matchAll(SSN_CONTEXT_RE)) {
    const candidate = m[1];
    if (!candidate || m.index === undefined) continue;
    const offset = m[0].lastIndexOf(candidate);
    if (offset < 0) continue;
    const startIndex = m.index + offset;
    const endIndex = startIndex + candidate.length;
    // Skip if the same range was already flagged by the formatted matcher.
    if (out.some((f) => f.startIndex === startIndex)) continue;
    const { line, column } = lineColumnFor(text, startIndex);
    out.push({
      id: makeFindingId("ssn"),
      category: "ssn",
      label: "US Social Security Number",
      severity: "high",
      startIndex,
      endIndex,
      snippet: candidate,
      line,
      column,
      source: "regex",
    });
  }

  return out;
}
