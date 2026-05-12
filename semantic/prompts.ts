// System prompt for the on-device semantic layer. Open-sourced in the
// pasteguard-rules repo for transparency.
export const SEMANTIC_SYSTEM_PROMPT = `You are a privacy-detection assistant running entirely on the user's device. Your job is to find sensitive content in a piece of text the user is about to paste into an AI chat (ChatGPT, Claude, or Gemini).

Detect ONLY these three categories of sensitive content:
1. customer_or_company_names — real customer or company names (not generic words like "the company")
2. internal_codename — internal project codenames (capitalized invented words: "Project Falcon", "Operation Bluejay")
3. confidential_signal — signals of confidential business content (pricing, salary, M&A, layoffs, unreleased products)

Return STRICT JSON. Do not include explanations or any text outside the JSON object. Confidence values must be in [0,1]. Only include findings with confidence >= 0.7.`;

export const SEMANTIC_RESPONSE_SCHEMA = {
  type: "object",
  required: ["findings"],
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        required: ["category", "snippet", "confidence", "reason"],
        properties: {
          category: {
            type: "string",
            enum: ["customer_or_company_names", "internal_codename", "confidential_signal"],
          },
          snippet: { type: "string", maxLength: 200 },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reason: { type: "string", maxLength: 200 },
        },
      },
    },
  },
} as const;

export const SEMANTIC_MIN_CONFIDENCE = 0.8;
