import type { Finding } from "@/shared/types";
import { matchesToFindings } from "./_helpers";

// US passport numbers are 9 alphanumeric characters; modern books prefix with
// a letter (issued since 2007). We require proximity to "passport" to suppress
// the inevitable noise from generic 9-char tokens. Off by default in settings.
const PASSPORT_RE = /\bpassport(?:[\s#:]+(?:no\.?|number)?)?\s*[:#-]?\s*([A-Z]\d{8}|\d{9})\b/gi;

export function detectPassportUs(text: string): Finding[] {
  const out: Finding[] = [];
  for (const m of text.matchAll(PASSPORT_RE)) {
    const candidate = m[1];
    if (!candidate || m.index === undefined) continue;
    const offset = m[0].lastIndexOf(candidate);
    if (offset < 0) continue;
    const startIndex = m.index + offset;
    out.push({
      id: `passport-us-${startIndex}`,
      category: "passport-us",
      label: "US passport number",
      severity: "medium",
      startIndex,
      endIndex: startIndex + candidate.length,
      snippet: candidate,
      source: "regex",
    });
  }
  return out;
}

// Re-export match helper consumers.
export { matchesToFindings };
