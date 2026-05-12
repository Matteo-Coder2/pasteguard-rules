import type { Finding } from "@/shared/types";
import { matchesToFindings } from "./_helpers";

// Stripe API keys: sk_live, sk_test, pk_live, pk_test, rk_live, rk_test, plus
// restricted keys. Length is variable but always ≥24 alphanumeric chars after
// the prefix.
const STRIPE_RE = /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{24,}\b/g;

export function detectStripeKey(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(STRIPE_RE)), {
    category: "stripe-key",
    label: "Stripe API key",
    defaultSeverity: "critical",
  });
}
