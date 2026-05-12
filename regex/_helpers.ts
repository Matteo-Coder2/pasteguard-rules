import type { Finding, FindingCategory, Severity } from "@/shared/types";

let counter = 0;
export function makeFindingId(category: FindingCategory): string {
  counter += 1;
  return `${category}-${counter}-${Date.now().toString(36)}`;
}

// Module-level cache of newline offsets for the last-scanned text. Avoids
// repeated O(n) scans inside lineColumnFor when a single detection pass
// produces many findings against the same text.
let cachedLineStarts: { text: string; starts: number[] } | null = null;

function getLineStarts(text: string): number[] {
  if (cachedLineStarts && cachedLineStarts.text === text) {
    return cachedLineStarts.starts;
  }
  const starts: number[] = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10 /* \n */) starts.push(i + 1);
  }
  cachedLineStarts = { text, starts };
  return starts;
}

export function lineColumnFor(text: string, index: number): { line: number; column: number } {
  const starts = getLineStarts(text);
  // Binary search for the largest starts[i] <= index. starts is monotonic.
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    const v = starts[mid];
    if (v !== undefined && v <= index) lo = mid;
    else hi = mid - 1;
  }
  const lineStart = starts[lo] ?? 0;
  return { line: lo + 1, column: index - lineStart + 1 };
}

interface MatchOptions {
  category: FindingCategory;
  label: string;
  defaultSeverity: Severity;
  source?: Finding["source"];
}

export function matchesToFindings(
  text: string,
  matches: RegExpMatchArray[],
  opts: MatchOptions,
): Finding[] {
  const out: Finding[] = [];
  for (const m of matches) {
    if (m.index === undefined) continue;
    const matchText = m[0];
    const { line, column } = lineColumnFor(text, m.index);
    out.push({
      id: makeFindingId(opts.category),
      category: opts.category,
      label: opts.label,
      severity: opts.defaultSeverity,
      startIndex: m.index,
      endIndex: m.index + matchText.length,
      snippet: matchText,
      line,
      column,
      source: opts.source ?? "regex",
    });
  }
  return out;
}
