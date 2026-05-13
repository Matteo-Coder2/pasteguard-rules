# PasteGuard Privacy Policy

**Effective: v0.1.1 — May 12, 2026**

## TL;DR

The contents of your clipboard never leave your browser. PasteGuard adds zero outbound network requests to your AI-chat workflow.

## What this extension does

PasteGuard inspects text you paste into, type into, or submit on 8 supported AI chat sites (ChatGPT, Claude, Gemini, Microsoft Copilot, DeepSeek, Perplexity, Grok, Mistral Le Chat). It warns you if the text looks like sensitive data — API keys, SSNs, credit card numbers, customer data, internal codenames, and 25+ other categories. All inspection happens locally on your device.

## Network requests this extension makes

In v0.1.1, **PasteGuard makes zero network requests of its own.**

The only network activity attributable to PasteGuard is:

| Request | Made by | Purpose |
|---|---|---|
| Extension auto-update | Chrome (the browser) | Standard Web Store update mechanism. We do not control this. |
| Pro tier checkout (only if you click Upgrade) | ExtensionPay (separate service) | Loads `extensionpay.com` for Stripe checkout. PasteGuard never sees your payment details. |

We do not operate a license server, telemetry endpoint, error reporter, or analytics pipeline. There is no opt-in to enable any of these in v0.1.1 because they do not exist.

## What is stored locally

PasteGuard uses `chrome.storage.local` (your local browser profile) for:

- Settings: which sites are protected, which detectors are enabled, custom regex rules, allowlist entries, sensitivity profile, pause-for-1-hour timestamp.
- A small audit log of paste events from the last 7 days. The audit log records: timestamp, site (one of the 8 supported), the user's decision (cancel/redact/send), and **counts** of findings by severity. **It does not record the content of the paste, the snippet of any finding, or any text from the page.**
- Pro tier status (set by ExtensionPay if you upgrade): a flag indicating active/canceled and an end-date timestamp.
- An onboarding flag so the first-run tooltip on each supported site is shown only once.

This data is removed when you uninstall the extension via Chrome's standard mechanism.

## What is NOT stored, ever

- The text of any paste you make
- The text you type into AI chat composers
- Snippets of detected secrets
- Page contents of any AI chat site
- Any identifier for you or your device
- IP addresses
- Browsing history
- Tweet contents, profile info, or any X content (even though the content script loads on x.com to support the Grok sidebar — see the x.com section below)

## Gemini Nano (the on-device model)

When the "Advanced semantic detection" feature is enabled (Pro tier only), PasteGuard uses Chrome's built-in Gemini Nano model. Inference runs entirely on-device. Google states the model performs no network calls during inference. Chrome may update the model binary on its own schedule via the standard browser update mechanism.

## Open-source

The detection rules and semantic prompts are published at [github.com/Matteo-Coder2/pasteguard-rules](https://github.com/Matteo-Coder2/pasteguard-rules). You can audit exactly what the extension looks for.

## Permissions explained

| Permission | Why it's needed |
|---|---|
| `storage` | To save your settings, audit log, and Pro status on your machine. **This is the only API permission the extension requests.** |
| `host_permissions` | The content script loads on the AI chat sites listed below. |

### Hosts the content script runs on

| Host | Why |
|---|---|
| `chatgpt.com`, `chat.openai.com` | ChatGPT |
| `claude.ai` | Claude |
| `gemini.google.com` | Gemini |
| `copilot.microsoft.com`, `m365.cloud.microsoft` | Microsoft Copilot (standalone + M365 surface) |
| `chat.deepseek.com`, `www.deepseek.com` | DeepSeek |
| `perplexity.ai`, `www.perplexity.ai` | Perplexity |
| `grok.com`, `www.grok.com` | xAI Grok standalone |
| `chat.mistral.ai` | Mistral Le Chat |
| `extensionpay.com` | Pro checkout flow (only loads on the ExtensionPay site, not on AI chats) |
| **`x.com`, `www.x.com`** | **Important caveat below.** |

**The x.com caveat.** Grok is also available as a sidebar inside x.com. The X site is a single-page app — users typically land on `/home` or a tweet URL and navigate to `/i/grok` in-app. For PasteGuard to protect the Grok sidebar, the content script must load on every x.com page (a narrower path-scope would miss SPA navigation). However:

- The script **only acts** on composers that show Grok-specific markers (placeholder "Ask anything", aria-label containing "Grok", or an ancestor with a Grok data-testid).
- Pastes and typing in **tweet drafts, reply boxes, and DMs are explicitly ignored** — we never scan them, never read their contents.
- The script no-ops silently on every URL except `/i/grok` and on every composer except the Grok one.

If you'd prefer the script not load on x.com at all, you can disable Grok in Options → Sites. The content script will still attach passively, but every event short-circuits before reading any text.

## Content Security Policy

PasteGuard's extension pages run under a strict CSP: `script-src 'self'; object-src 'self'`. No remote code execution, no inline scripts, no eval.

## Audit (verify our claims yourself)

- Open DevTools on any AI chat site after PasteGuard is installed
- Network tab, filter out the host site's own domains
- Paste a fake AWS key (e.g. `AKIAIOSFODNN7EXAMPLE`) into the composer
- The PasteGuard modal will appear
- The Network panel stays empty — no requests are made by PasteGuard

## About the marketing website

The marketing site at [pasteguard.io](https://pasteguard.io) is served from Cloudflare Pages and uses [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) — a privacy-respecting, cookieless analytics product — for aggregate page views, referrers, and country-level visit data. No personal data, no cookies, no third-party trackers.

**This applies only to the marketing site.** The Chrome extension itself uses no analytics whatsoever — see the rest of this policy.

## Contact

- For privacy questions: open an issue at [github.com/Matteo-Coder2/pasteguard-rules/issues](https://github.com/Matteo-Coder2/pasteguard-rules/issues)
- For support: `support@pasteguard.io`

## Changes to this policy

Material changes will be reflected in the extension's version number and noted at the top of this document with a new effective date.
