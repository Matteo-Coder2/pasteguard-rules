// Modern AI vendor API keys. Each prefix is hardcoded by the vendor, so the
// false-positive rate is near-zero. These are the highest-signal additions
// for the AI-chat use case: developers paste SDK code into the SAME AI's
// chat all the time.
import type { Finding } from "@/shared/types";
import { matchesToFindings } from "./_helpers";

// Anthropic — Claude API keys
const ANTHROPIC_RE = /\bsk-ant-(?:api|admin)\d{2}-[A-Za-z0-9_-]{93,}\b/g;

// OpenAI — modern + legacy formats
//   sk-proj-...   project-scoped
//   sk-svcacct-... service account
//   sk-admin-...  admin
//   sk-<48 chars> legacy user key
const OPENAI_MODERN_RE = /\bsk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]{20,}\b/g;
const OPENAI_LEGACY_RE = /\bsk-[A-Za-z0-9]{48}\b/g;

// Google — AI Studio + GCP API keys share the AIza prefix
const GOOGLE_AI_RE = /\bAIza[0-9A-Za-z_-]{35}\b/g;

// Hugging Face access tokens
const HUGGING_FACE_RE = /\bhf_[A-Za-z0-9]{34,40}\b/g;

// Replicate API tokens
const REPLICATE_RE = /\br8_[A-Za-z0-9]{37}\b/g;

// Groq API keys
const GROQ_RE = /\bgsk_[A-Za-z0-9]{52}\b/g;

// Perplexity API keys
const PERPLEXITY_RE = /\bpplx-[A-Za-z0-9]{48,}\b/g;

// OpenRouter API keys
const OPENROUTER_RE = /\bsk-or-(?:v1-)?[A-Za-z0-9]{64}\b/g;

export function detectAnthropicKey(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(ANTHROPIC_RE)), {
    category: "anthropic-key",
    label: "Anthropic API key",
    defaultSeverity: "critical",
  });
}

export function detectOpenAiKey(text: string): Finding[] {
  const modern = matchesToFindings(text, Array.from(text.matchAll(OPENAI_MODERN_RE)), {
    category: "openai-key",
    label: "OpenAI API key",
    defaultSeverity: "critical",
  });
  const legacy = matchesToFindings(text, Array.from(text.matchAll(OPENAI_LEGACY_RE)), {
    category: "openai-key",
    label: "OpenAI API key (legacy)",
    defaultSeverity: "critical",
  });
  return [...modern, ...legacy];
}

export function detectGoogleAiKey(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(GOOGLE_AI_RE)), {
    category: "google-ai-key",
    label: "Google API key",
    defaultSeverity: "critical",
  });
}

export function detectHuggingFaceKey(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(HUGGING_FACE_RE)), {
    category: "huggingface-key",
    label: "Hugging Face access token",
    defaultSeverity: "high",
  });
}

export function detectReplicateKey(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(REPLICATE_RE)), {
    category: "replicate-key",
    label: "Replicate API token",
    defaultSeverity: "high",
  });
}

export function detectGroqKey(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(GROQ_RE)), {
    category: "groq-key",
    label: "Groq API key",
    defaultSeverity: "high",
  });
}

export function detectPerplexityKey(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(PERPLEXITY_RE)), {
    category: "perplexity-key",
    label: "Perplexity API key",
    defaultSeverity: "high",
  });
}

export function detectOpenRouterKey(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(OPENROUTER_RE)), {
    category: "openrouter-key",
    label: "OpenRouter API key",
    defaultSeverity: "high",
  });
}
