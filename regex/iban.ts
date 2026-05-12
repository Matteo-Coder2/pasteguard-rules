import type { Finding } from "@/shared/types";
import { lineColumnFor, makeFindingId } from "./_helpers";

// IBAN: country code + 2 check digits + up to 30 alphanumeric chars (BBAN).
// Validated with the ISO 7064 mod-97 checksum.
const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g;

export function detectIban(text: string): Finding[] {
  const out: Finding[] = [];
  for (const m of text.matchAll(IBAN_RE)) {
    if (m.index === undefined) continue;
    const candidate = m[0];
    if (!ibanChecksumValid(candidate)) continue;
    const { line, column } = lineColumnFor(text, m.index);
    out.push({
      id: makeFindingId("iban"),
      category: "iban",
      label: "IBAN",
      severity: "medium",
      startIndex: m.index,
      endIndex: m.index + candidate.length,
      snippet: candidate,
      line,
      column,
      source: "regex",
    });
  }
  return out;
}

function ibanChecksumValid(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged
    .split("")
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 48 && code <= 57) return c;
      if (code >= 65 && code <= 90) return String(code - 55);
      return "";
    })
    .join("");
  // Mod 97 over a long numeric string, computed in chunks to fit JS numbers.
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const chunk = String(remainder) + numeric.slice(i, i + 7);
    remainder = Number(chunk) % 97;
  }
  return remainder === 1;
}
