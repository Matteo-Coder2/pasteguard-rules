# PasteGuard Privacy Policy

**Effective: v0.1.0**

## TL;DR

The contents of your clipboard never leave your browser.

## What this extension does

PasteGuard inspects text you paste into ChatGPT, Claude, and Gemini and warns you if it looks like sensitive data (SSNs, API keys, JWTs, customer names, etc.). All inspection happens locally on your device.

## Network requests this extension makes

In v0.1.0, **PasteGuard makes zero network requests of its own.**

The only network activity attributable to PasteGuard is:

| Request | Made by | Purpose |
|---|---|---|
| Extension auto-update | Chrome (the browser) | Standard Web Store update mechanism. We do not control this. |

We do not operate a license server, telemetry endpoint, error reporter, or analytics pipeline. There is no opt-in to enable any of these in v0.1.0 because they do not exist.

## What is stored locally

PasteGuard uses `chrome.storage.local` (your local browser profile) for:

- Settings (which sites are protected, which detectors are enabled, custom rules, allowlist, sensitivity)
- A small audit log of paste events from the last 7 days. The audit log records: timestamp, site (chatgpt/claude/gemini), the user's decision (cancel/redact/send), and **counts** of findings by severity. **It does not record the content of the paste, the snippet of any finding, or any text from the page.**
- An onboarding flag (per-site) so the first-run tooltip is shown only once.

This data is removed when you uninstall the extension via Chrome's standard mechanism.

## What is NOT stored, ever

- The text of any paste you make
- Snippets of detected secrets
- Page contents of chatgpt.com, claude.ai, or gemini.google.com
- Any identifier for you or your device
- IP addresses
- Browsing history

## Gemini Nano (the on-device model)

When the "Advanced semantic detection" feature is enabled, PasteGuard uses Chrome's built-in Gemini Nano model. Inference runs on-device. Google states the model performs no network calls during inference. Chrome may update the model binary on its own schedule via the standard browser update mechanism.

## Open-source

The detection rules and semantic prompts are published at github.com/Matteo-Coder2/pasteguard-rules. You can audit exactly what the extension looks for.

## Permissions explained

| Permission | Why it's needed |
|---|---|
| `storage` | To save your settings and the local audit log on your machine. |
| `scripting` | To inject the content script that intercepts paste events on the AI sites. |
| `alarms` | To resume scanning automatically when "Pause for 1 hour" expires. |
| `host_permissions` | See "Hosts the content script runs on" below. |

### Hosts the content script runs on

The content script (and only the content script) loads on these hosts:

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
| **`x.com`, `www.x.com`** | **Important caveat below.** |

**The x.com caveat:** Grok is also available as a sidebar inside x.com that
can open on any X URL (a tweet, profile, timeline). For PasteGuard to protect
that sidebar, the content script must load on every x.com page. However:

- The script **only intercepts** pastes/typing into composers that show
  Grok-specific markers (placeholder "Ask anything", aria-label containing
  "Grok", or an ancestor with a Grok data-testid).
- Pastes and typing in **tweet drafts and reply boxes are explicitly ignored**
  — we never scan them, never read their contents.
- A diagnostic log (only in development builds; stripped in production) is the
  only on-page evidence that the script ran.

If you'd prefer the script not load on x.com at all, you can disable Grok in
Options → Sites, which prevents any action on x.com. The content script will
still attach passively, but every paste/typing event short-circuits before
reading any text.

## Contact

Open an issue at github.com/Matteo-Coder2/pasteguard-rules.
