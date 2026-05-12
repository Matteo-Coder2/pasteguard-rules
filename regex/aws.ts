import type { Finding } from "@/shared/types";
import { matchesToFindings } from "./_helpers";

// AWS access keys: AKIA / ASIA / AGPA / AROA / AIPA prefix + 16 uppercase
// alphanumeric. ASIA is short-term session keys. ABIA / ACCA also exist but
// are less common; the spec covers AKIA + ASIA explicitly.
const AWS_ACCESS_RE = /\b(?:AKIA|ASIA|AGPA|AROA|AIPA|ANPA|ABIA|ACCA)[A-Z0-9]{16}\b/g;

export function detectAwsAccessKey(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(AWS_ACCESS_RE)), {
    category: "aws-access-key",
    label: "AWS access key",
    defaultSeverity: "critical",
  });
}

// AWS secret keys are 40-character base64. To suppress noise, only flag when
// the string appears in proximity (within 64 chars) to the keywords aws, secret,
// or session_token. This is heuristic and OFF by default in settings.
const AWS_SECRET_PROXIMITY_RE =
  /(aws|secret|session[_-]?token)[^\n]{0,64}\b([A-Za-z0-9+/]{40})\b/gi;

export function detectAwsSecretKey(text: string): Finding[] {
  const out: Finding[] = [];
  for (const m of text.matchAll(AWS_SECRET_PROXIMITY_RE)) {
    const candidate = m[2];
    if (!candidate || m.index === undefined) continue;
    const offset = m[0].lastIndexOf(candidate);
    if (offset < 0) continue;
    const startIndex = m.index + offset;
    out.push({
      id: `aws-secret-key-${startIndex}`,
      category: "aws-secret-key",
      label: "AWS secret access key (heuristic)",
      severity: "critical",
      startIndex,
      endIndex: startIndex + candidate.length,
      snippet: candidate,
      source: "regex",
    });
  }
  return out;
}
