// Cloud/SaaS/package-publish tokens that aren't covered elsewhere.
import type { Finding } from "@/shared/types";
import { matchesToFindings, lineColumnFor, makeFindingId } from "./_helpers";

// GitHub fine-grained PATs — completely different format from classic ghp_*
const GITHUB_FINE_GRAINED_RE = /\bgithub_pat_[A-Z0-9_]{82}\b/g;

// Stripe webhook signing secrets
const STRIPE_WEBHOOK_RE = /\bwhsec_[A-Za-z0-9]{32,}\b/g;

// npm publish tokens
const NPM_RE = /\bnpm_[A-Za-z0-9]{36}\b/g;

// Google service-account JSON — co-occurrence detector. When the type field
// AND the private_key field both appear within a small window, we treat the
// whole JSON as a critical leak (the regex flags the type marker but
// redaction logic could be extended to wipe the whole block).
const GOOGLE_SA_RE =
  /"type"\s*:\s*"service_account"[\s\S]{0,1024}?"private_key"\s*:\s*"-----BEGIN/g;

export function detectGithubFineGrainedPat(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(GITHUB_FINE_GRAINED_RE)), {
    category: "github-fine-grained-pat",
    label: "GitHub fine-grained PAT",
    defaultSeverity: "critical",
  });
}

export function detectStripeWebhookSecret(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(STRIPE_WEBHOOK_RE)), {
    category: "stripe-webhook-secret",
    label: "Stripe webhook signing secret",
    defaultSeverity: "high",
  });
}

export function detectNpmToken(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(NPM_RE)), {
    category: "npm-token",
    label: "npm publish token",
    defaultSeverity: "critical",
  });
}

export function detectGoogleServiceAccountJson(text: string): Finding[] {
  const out: Finding[] = [];
  for (const m of text.matchAll(GOOGLE_SA_RE)) {
    if (m.index === undefined) continue;
    const matchText = m[0];
    const { line, column } = lineColumnFor(text, m.index);
    out.push({
      id: makeFindingId("google-service-account"),
      category: "google-service-account",
      label: "Google service-account JSON",
      severity: "critical",
      startIndex: m.index,
      endIndex: m.index + matchText.length,
      snippet: matchText.slice(0, 80) + "…",
      line,
      column,
      source: "regex",
      reason: "service_account JSON block with private key",
    });
  }
  return out;
}

// Database connection strings with embedded credentials. Only matches when
// a user:pass segment is present — avoids flagging `postgres://localhost`.
const DB_CONN_RE =
  /\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|amqp|clickhouse|mariadb):\/\/[^:@\s]+:[^@\s]+@[^/\s]+/gi;

export function detectDbConnectionString(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(DB_CONN_RE)), {
    category: "db-connection-string",
    label: "Database connection string with credentials",
    defaultSeverity: "high",
  });
}
