import type { Finding } from "@/shared/types";
import type { Settings } from "@/shared/settings";
import { lineColumnFor, makeFindingId } from "./regex/_helpers";

// Heuristic high-entropy detector. Off by default. Looks for ≥32-char runs of
// base64-ish characters with Shannon entropy above the configured threshold.
// Lots of false positives on hash-like content; only useful for power users.
const TOKEN_RE = /\b[A-Za-z0-9+/_-]{32,}\b/g;

export function runEntropyLayer(text: string, settings: Settings): Finding[] {
  const threshold = settings.detection.entropy.threshold;
  const out: Finding[] = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    if (m.index === undefined) continue;
    const token = m[0];
    if (shannon(token) < threshold) continue;
    const { line, column } = lineColumnFor(text, m.index);
    out.push({
      id: makeFindingId("high-entropy"),
      category: "high-entropy",
      label: "High-entropy string",
      severity: "medium",
      startIndex: m.index,
      endIndex: m.index + token.length,
      snippet: token,
      line,
      column,
      source: "regex",
    });
  }
  return out;
}

export function shannon(input: string): number {
  if (input.length === 0) return 0;
  const freq = new Map<string, number>();
  for (const ch of input) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let h = 0;
  for (const count of freq.values()) {
    const p = count / input.length;
    h -= p * Math.log2(p);
  }
  return h;
}
