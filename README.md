# pasteguard-rules

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Privacy: on-device](https://img.shields.io/badge/Privacy-on--device-4ade80.svg)](PRIVACY.md)
[![Website](https://img.shields.io/badge/site-pasteguard.io-38bdf8.svg)](https://pasteguard.io)

Open-source detection rules and semantic prompts for [PasteGuard](https://pasteguard.io) — a Chrome extension that warns users before sensitive data hits AI chat services (ChatGPT, Claude, Gemini, Copilot, DeepSeek, Perplexity, Grok, Mistral).

**This repository contains only the detection logic.** The Chrome extension UI is closed-source for v0.1; the rules are open so anyone can audit exactly what PasteGuard considers sensitive — and so you can fork them for your own DLP.

```
.
├── regex/         25 regex-based detectors covering API keys, PII, secrets
├── semantic/      prompt template + JSON schema for the Gemini Nano layer
├── tests/         unit tests + the false-positive fixture corpus
├── PRIVACY.md     extension privacy policy (mirror of pasteguard.io/privacy)
└── LICENSE        MIT
```

**Quick links:** [Install](https://pasteguard.io) · [Privacy policy](https://pasteguard.io/privacy) · [Support](https://pasteguard.io/support) · [Audit a detector](#audit-a-detector-in-30-seconds) · [Contributing](#contributing)

---

## Audit a detector in 30 seconds

Suppose you want to verify what PasteGuard does with AWS access keys. Each detector lives in its own file under `regex/`. Open [`regex/aws.ts`](regex/aws.ts):

```ts
// AWS access key IDs always start with a specific 4-char prefix:
// AKIA (long-term), ASIA (temporary), AGPA/AROA/AIPA/ANPA/ABIA/ACCA (other classes).
// Followed by exactly 16 uppercase alphanumeric characters.
const AWS_ACCESS_KEY_RE = /\b(?:AKIA|ASIA|AGPA|AROA|AIPA|ANPA|ABIA|ACCA)[A-Z0-9]{16}\b/g;
```

Then check `tests/regex/aws.spec.ts` for what's tested:
- **Positive cases**: real-looking keys at start / middle / end of paste
- **False-positive cases**: similar-looking strings that must NOT trigger (e.g. random 20-char uppercase strings without the prefix)

Every detector follows the same shape. The whole corpus is auditable in under an hour.

---

## Verify the privacy claim yourself

PasteGuard's main claim is "zero outbound network requests from the extension." You can verify this in 30 seconds:

1. Install PasteGuard from the [Chrome Web Store](https://pasteguard.io)
2. Open any AI chat site (chatgpt.com, claude.ai, etc.)
3. Open DevTools → **Network** tab
4. Filter to exclude the host page's own traffic:
   ```
   -scheme:chrome-extension -domain:chatgpt.com -domain:openai.com -domain:oaistatic.com
   ```
5. Click the 🚫 **Clear** button on the Network panel
6. Paste a fake AWS key: `AKIAIOSFODNN7EXAMPLE`
7. The PasteGuard modal appears.
8. **The Network panel stays empty.** Status bar reads "0 / N requests."

If you ever see PasteGuard make a network request that isn't a chunk load from `chrome-extension://`, that's a bug — [open a security issue](https://github.com/Matteo-Coder2/pasteguard-rules/issues) immediately.

---

## Detection categories (25 total)

### AI vendor API keys (10)
| Detector | Pattern shape |
|---|---|
| Anthropic | `sk-ant-(api\|admin)\d{2}-[A-Za-z0-9_-]{93,}` |
| OpenAI (modern) | `sk-(proj\|svcacct\|admin)-[A-Za-z0-9_-]{20,}` |
| OpenAI (legacy) | `sk-[A-Za-z0-9]{48}` |
| Google AI / GCP | `AIza[0-9A-Za-z_-]{35}` |
| Google service-account JSON | co-occurrence of `"type":"service_account"` + `"private_key":"-----BEGIN` |
| Hugging Face | `hf_[A-Za-z0-9]{34,40}` |
| Replicate | `r8_[A-Za-z0-9]{37}` |
| Groq | `gsk_[A-Za-z0-9]{52}` |
| Perplexity | `pplx-[A-Za-z0-9]{48,}` |
| OpenRouter | `sk-or-(v1-)?[A-Za-z0-9]{64}` |

### Cloud / infrastructure (4)
| Detector | Pattern shape |
|---|---|
| AWS access key | `(AKIA\|ASIA\|AGPA\|AROA\|AIPA\|ANPA\|ABIA\|ACCA)[A-Z0-9]{16}` |
| AWS secret key (heuristic) | 40-char base64 near `aws` / `secret` / `session_token` |
| PEM private key | `-----BEGIN (?:RSA \|EC \|OPENSSH \|...)? PRIVATE KEY-----` |
| Database connection string | `(mongodb\|postgres\|mysql\|redis\|amqp)://USER:PASS@HOST` |

### SaaS / developer tokens (7)
| Detector | Pattern shape |
|---|---|
| Stripe API key | `(sk\|pk\|rk)_(live\|test)_[A-Za-z0-9]{24,}` |
| Stripe webhook secret | `whsec_[A-Za-z0-9]{32,}` |
| GitHub classic PAT / OAuth | `gh[opsur]_[A-Za-z0-9]{36,}` |
| GitHub fine-grained PAT | `github_pat_[A-Z0-9_]{82}` |
| Slack token | `xox[abpsr]-…-…-…` |
| npm publish token | `npm_[A-Za-z0-9]{36}` |
| JWT | three base64url segments + verified `"alg"` JSON header |

### Identity & financial PII (4)
| Detector | Pattern shape |
|---|---|
| US SSN — formatted | `\d{3}[- ]\d{2}[- ]\d{4}` (rejects all-zero placeholders) |
| US SSN — context-aware unformatted | 9 digits within 32 chars of `SSN` / `social security` |
| Credit card | 13–19 digits, Luhn-validated |
| IBAN | country code + 2 check digits + 10–30 alphanum, mod-97 validated |
| US passport | 9 chars, requires `passport` keyword within 30 chars |

### Generic + custom
| Detector | Pattern |
|---|---|
| High-entropy string | 32+ char base64-ish strings with Shannon entropy ≥ 4.5 (off by default) |
| Custom rules | user-defined regex patterns set in the extension's Options page (with ReDoS static lint at save time) |

### Semantic layer (Gemini Nano)
The optional semantic layer runs Chrome's on-device Gemini Nano AI to catch sensitive content that regex can't:
- **Customer / company names** in context ("Our customer Acme Corp is reporting…")
- **Internal codenames** ("Project Falcon launches Q3")
- **Confidential business signals** (pricing, salary, M&A, layoffs, unreleased products)

The system prompt and JSON-schema response constraint are in [`semantic/prompts.ts`](semantic/prompts.ts). The model runs entirely on the user's device — text never leaves the browser.

---

## False-positive corpus

[`tests/false-positives.ts`](tests/false-positives.ts) is the trust contract. It's a collection of real-world paste samples — code snippets, JSON dumps, lorem ipsum, email signatures, log lines — that **must not trigger any detector**. CI rejects any rule change that breaks a fixture.

If you find a real paste that PasteGuard flags incorrectly, [open an issue](https://github.com/Matteo-Coder2/pasteguard-rules/issues) with the snippet (redacted as needed) and we'll add it to the corpus.

---

## Privacy policy

See [PRIVACY.md](PRIVACY.md). Short version: zero outbound network calls from the extension code, no telemetry, no account required, detection runs 100% on-device. The PRIVACY.md here is the canonical source — the styled version at [pasteguard.io/privacy](https://pasteguard.io/privacy) mirrors it.

---

## Contributing

The rules are MIT-licensed — copy, fork, audit, propose improvements. Particularly welcome:

- **New vendor API key patterns** as services launch (Mistral, Cohere, Together, Fireworks, etc.)
- **Industry-specific patterns** knowledge workers commonly paste (legal case IDs, medical record formats, financial security IDs)
- **False-positive fixtures** — if you hit a real paste that should NOT trigger, add it to the corpus

Each new detector PR needs:
1. The regex / heuristic in `regex/<category>.ts`
2. At least 3 positive cases + 3 false-positive cases in the test file
3. A line in this README's detection table

---

## Versioning

This repo tracks the published Chrome Web Store extension version. Tags here match the extension's `manifest.json` version. Rule changes ship here first, then in the extension's next release.

Current: **v0.1.1**

---

## License

MIT. Use the rules anywhere — your own DLP, your own browser extension, your CI checks. Attribution appreciated but not required.
