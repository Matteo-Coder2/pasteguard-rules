import type { Finding, FindingCategory } from "@/shared/types";
import type { Settings } from "@/shared/settings";
import { detectSsn } from "./ssn";
import { detectCreditCard } from "./credit-card";
import { detectAwsAccessKey, detectAwsSecretKey } from "./aws";
import { detectStripeKey } from "./stripe";
import { detectGithubToken } from "./github";
import { detectSlackToken } from "./slack";
import { detectJwt } from "./jwt";
import { detectPrivateKeyPem } from "./pem";
import { detectIban } from "./iban";
import { detectPassportUs } from "./passport-us";
import {
  detectAnthropicKey,
  detectOpenAiKey,
  detectGoogleAiKey,
  detectHuggingFaceKey,
  detectReplicateKey,
  detectGroqKey,
  detectPerplexityKey,
  detectOpenRouterKey,
} from "./ai-vendors";
import {
  detectGithubFineGrainedPat,
  detectStripeWebhookSecret,
  detectNpmToken,
  detectGoogleServiceAccountJson,
  detectDbConnectionString,
} from "./cloud-package";

type Detector = (text: string) => Finding[];

// Substring prefilters: a cheap O(n) `text.includes()` check that runs before
// each detector's regex. If the prefilter returns false, we skip the regex
// entirely. Catches the common case (most pastes don't contain any of these
// markers) and avoids paying regex cost on every detector.
//
// Each prefilter is a list of substrings that MUST appear (any one of them)
// for the detector to bother running. Use lowercase; we lowercase the text
// once and reuse the comparison.
type Prefilter = (lowerText: string, text: string) => boolean;

const includesAny = (...needles: string[]): Prefilter => (lower) => needles.some((n) => lower.includes(n));
const ALWAYS: Prefilter = () => true;

const DETECTORS: Array<{ id: FindingCategory; run: Detector; pre: Prefilter }> = [
  // SSN: formatted variant has digits + dashes; context variant has "ssn" or "social"
  { id: "ssn", run: detectSsn, pre: (lower) => /\d-\d|ssn|social/.test(lower) },
  // CC: any 12+ digit run
  { id: "credit-card", run: detectCreditCard, pre: includesAny("0", "1", "2", "3", "4", "5", "6", "7", "8", "9") },
  { id: "aws-access-key", run: detectAwsAccessKey, pre: includesAny("akia", "asia", "agpa", "aroa", "aipa", "anpa", "abia", "acca") },
  { id: "aws-secret-key", run: detectAwsSecretKey, pre: includesAny("aws", "secret", "session_token", "session-token") },
  { id: "stripe-key", run: detectStripeKey, pre: includesAny("sk_live_", "sk_test_", "pk_live_", "pk_test_", "rk_live_", "rk_test_") },
  { id: "stripe-webhook-secret", run: detectStripeWebhookSecret, pre: includesAny("whsec_") },
  { id: "github-token", run: detectGithubToken, pre: includesAny("ghp_", "ghs_", "ghu_", "gho_", "ghr_") },
  { id: "github-fine-grained-pat", run: detectGithubFineGrainedPat, pre: includesAny("github_pat_") },
  { id: "slack-token", run: detectSlackToken, pre: includesAny("xox") },
  { id: "jwt", run: detectJwt, pre: includesAny("eyj") },
  { id: "private-key-pem", run: detectPrivateKeyPem, pre: includesAny("-----begin") },
  { id: "iban", run: ALWAYS_RUN(detectIban), pre: ALWAYS }, // mod-97 in detector is the gate
  { id: "passport-us", run: detectPassportUs, pre: includesAny("passport") },
  // AI vendors
  { id: "anthropic-key", run: detectAnthropicKey, pre: includesAny("sk-ant-") },
  { id: "openai-key", run: detectOpenAiKey, pre: includesAny("sk-proj-", "sk-svcacct-", "sk-admin-", "sk-") },
  { id: "google-ai-key", run: detectGoogleAiKey, pre: includesAny("aiza") },
  { id: "google-service-account", run: detectGoogleServiceAccountJson, pre: includesAny('"type"', "service_account") },
  { id: "huggingface-key", run: detectHuggingFaceKey, pre: includesAny("hf_") },
  { id: "replicate-key", run: detectReplicateKey, pre: includesAny("r8_") },
  { id: "groq-key", run: detectGroqKey, pre: includesAny("gsk_") },
  { id: "perplexity-key", run: detectPerplexityKey, pre: includesAny("pplx-") },
  { id: "openrouter-key", run: detectOpenRouterKey, pre: includesAny("sk-or-") },
  { id: "npm-token", run: detectNpmToken, pre: includesAny("npm_") },
  { id: "db-connection-string", run: detectDbConnectionString, pre: includesAny("://") },
];

// Helper to mark detectors whose internal logic is the real gate. Keeps the
// detector signature consistent without forcing a no-op prefilter check.
function ALWAYS_RUN<T>(fn: T): T {
  return fn;
}

export function runRegexLayer(text: string, settings: Settings): Finding[] {
  const out: Finding[] = [];
  const lower = text.toLowerCase();
  for (const { id, run, pre } of DETECTORS) {
    const cfg = settings.detection.categories[id];
    if (!cfg?.enabled) continue;
    if (!pre(lower, text)) continue;
    const findings = run(text);
    for (const f of findings) {
      out.push({ ...f, severity: cfg.severity });
    }
  }
  return out.filter((f) => !isAllowlisted(f.snippet, settings.allowlist));
}

export { isAllowlisted };

function isAllowlisted(snippet: string, allowlist: string[]): boolean {
  return allowlist.some((entry) => snippet === entry || snippet.includes(entry));
}
