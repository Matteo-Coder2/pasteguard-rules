import type { Finding } from "@/shared/types";
import { lineColumnFor, makeFindingId } from "./_helpers";

// Credit-card-shaped sequences (13–19 digits, optionally separated by spaces
// or hyphens). Validated with the Luhn checksum to suppress false positives.
const CC_RE = /\b(?:\d[ -]?){12,18}\d\b/g;

export function detectCreditCard(text: string): Finding[] {
  const out: Finding[] = [];
  for (const m of text.matchAll(CC_RE)) {
    if (m.index === undefined) continue;
    const matchText = m[0];
    const digits = matchText.replace(/[ -]/g, "");
    if (digits.length < 13 || digits.length > 19) continue;
    if (!luhn(digits)) continue;
    const { line, column } = lineColumnFor(text, m.index);
    out.push({
      id: makeFindingId("credit-card"),
      category: "credit-card",
      label: "Credit card number",
      severity: "high",
      startIndex: m.index,
      endIndex: m.index + matchText.length,
      snippet: matchText,
      line,
      column,
      source: "regex",
    });
  }
  return out;
}

export function luhn(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}
