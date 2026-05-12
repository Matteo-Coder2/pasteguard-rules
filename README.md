# pasteguard-rules

Open-source detection rules and semantic prompts for [PasteGuard](https://pasteguard.io) — a Chrome extension that warns users before sensitive data hits AI chat services like ChatGPT, Claude, Gemini, Copilot, DeepSeek, Perplexity, Grok, and Mistral.

**This repository contains only the detection logic.** The Chrome extension itself (UI, content script, options page) is closed-source during the bootstrap phase. The rules are open so anyone can audit exactly what PasteGuard considers sensitive.

## What's in here

```
regex/         25 regex-based detectors covering API keys, PII, secrets
semantic/      prompt template + JSON schema for the Gemini Nano semantic layer
tests/         unit tests + the false-positive fixture corpus
```

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
| Custom rules | user-defined regex patterns set in the extension's Options page |

### Semantic layer (Gemini Nano)
The optional semantic layer runs Chrome's on-device Gemini Nano AI to catch sensitive content that regex can't:
- **Customer / company names** in context ("Our customer Acme Corp is reporting…")
- **Internal codenames** ("Project Falcon launches Q3")
- **Confidential business signals** (pricing, salary, M&A, layoffs, unreleased products)

The system prompt and JSON-schema response constraint are in [`semantic/prompts.ts`](semantic/prompts.ts). The model runs entirely on the user's device — text never leaves the browser.

## Test fixtures

[`tests/false-positives.ts`](tests/false-positives.ts) is the false-positive corpus — real-world knowledge-worker paste samples (code snippets, JSON, lorem ipsum, email signatures, etc.) that **must not trigger any detector**. This is the trust contract: any rule change that breaks a fixture is rejected in CI.

## Privacy policy

See [PRIVACY.md](PRIVACY.md) for the extension's privacy stance. The short version: zero outbound network calls from the extension code, no telemetry, no account required, detection runs 100% on-device.

## Contributing

The rules are MIT-licensed — copy, fork, audit, propose improvements. Particularly welcome:

- **New vendor API key patterns** as services launch (Mistral, Cohere, Together, Fireworks, etc.)
- **Industry-specific patterns** that knowledge workers commonly paste (legal case IDs, medical record formats, financial security IDs)
- **False-positive fixtures** — if you hit a real paste that should NOT trigger, add it to the corpus

Open a PR. Each detector needs:
1. The regex/heuristic (in `regex/<category>.ts`)
2. At least 3 positive cases + 3 false-positive cases in the test file
3. A line in this README's table

## Versioning

This repo tracks the extension's published Chrome Web Store version. Tag releases match the extension's `manifest.json` version. Rule changes shipped in v0.1.x land here first.

## License

MIT. Use the rules anywhere — your own DLP, your own browser extension, your CI checks. Attribution appreciated but not required.
