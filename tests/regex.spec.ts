import { describe, it, expect } from "vitest";
import { detectSsn } from "@/detection/regex/ssn";
import { detectCreditCard, luhn } from "@/detection/regex/credit-card";
import { detectAwsAccessKey, detectAwsSecretKey } from "@/detection/regex/aws";
import { detectStripeKey } from "@/detection/regex/stripe";
import { detectGithubToken } from "@/detection/regex/github";
import { detectSlackToken } from "@/detection/regex/slack";
import { detectJwt } from "@/detection/regex/jwt";
import { detectPrivateKeyPem } from "@/detection/regex/pem";
import { detectIban } from "@/detection/regex/iban";
import { detectPassportUs } from "@/detection/regex/passport-us";
import { runRegexLayer } from "@/detection/regex";
import { DEFAULT_SETTINGS, type Settings } from "@/shared/settings";
import { FALSE_POSITIVE_PASTES } from "../fixtures/false-positives";

describe("SSN", () => {
  it("detects formatted SSN with dashes", () => {
    expect(detectSsn("DOB SSN 123-45-6789 file ref")).toHaveLength(1);
  });
  it("detects formatted SSN with spaces", () => {
    expect(detectSsn("SSN 123 45 6789")).toHaveLength(1);
  });
  it("rejects all-zero area number (clear placeholder)", () => {
    expect(detectSsn("000-12-3456")).toHaveLength(0);
  });
  it("flags 666 area number (real-world pastes need coverage even of reserved ranges)", () => {
    expect(detectSsn("666-12-3456")).toHaveLength(1);
  });
  it("flags 9XX area number", () => {
    expect(detectSsn("987-65-4321")).toHaveLength(1);
  });
  it("rejects all-zero serial (clear placeholder)", () => {
    expect(detectSsn("123-45-0000")).toHaveLength(0);
  });
  it("flags two SSNs on separate lines (regression: 9XX prefix was previously silently dropped)", () => {
    expect(detectSsn("123-45-6789\n987-65-4321")).toHaveLength(2);
  });
  it("rejects unformatted 9-digit numbers without context (would be too noisy)", () => {
    expect(detectSsn("123456789")).toHaveLength(0);
    expect(detectSsn("Reference number 123456789 in the system")).toHaveLength(0);
  });

  it("flags unformatted 9-digit when 'SSN' keyword is nearby", () => {
    expect(detectSsn("SSN 123456789")).toHaveLength(1);
    expect(detectSsn("SSN: 123456789")).toHaveLength(1);
    expect(detectSsn("ssn is 123456789 today")).toHaveLength(1);
  });

  it("flags unformatted 9-digit when 'social security' is nearby", () => {
    expect(detectSsn("social security 123456789")).toHaveLength(1);
    expect(detectSsn("Social Security Number: 123456789")).toHaveLength(1);
  });

  it("does not double-count when both formatted and context patterns match the same range", () => {
    // "SSN 123-45-6789" — the formatted pattern already covers it; context
    // pattern shouldn't add a duplicate finding.
    expect(detectSsn("SSN 123-45-6789")).toHaveLength(1);
  });
});

describe("Credit card + Luhn", () => {
  it("Luhn passes for known good test number 4111 1111 1111 1111", () => {
    expect(luhn("4111111111111111")).toBe(true);
  });
  it("Luhn fails for 4111 1111 1111 1112", () => {
    expect(luhn("4111111111111112")).toBe(false);
  });
  it("detects a Luhn-valid 16-digit number with spaces", () => {
    expect(detectCreditCard("Card 4111 1111 1111 1111 expires 12/30")).toHaveLength(1);
  });
  it("does not flag a 16-digit non-Luhn number", () => {
    expect(detectCreditCard("Order id 1234567890123456 reference")).toHaveLength(0);
  });
  it("detects an Amex-like 15-digit Luhn-valid number", () => {
    expect(detectCreditCard("amex 378282246310005")).toHaveLength(1);
  });
});

describe("AWS keys", () => {
  it("detects an AKIA-prefixed access key", () => {
    expect(detectAwsAccessKey("export KEY=AKIAIOSFODNN7EXAMPLE")).toHaveLength(1);
  });
  it("detects an ASIA short-term session key", () => {
    expect(detectAwsAccessKey("ASIAY34FZKBOKMUTVV7A")).toHaveLength(1);
  });
  it("does not flag wrong-prefix lookalike", () => {
    expect(detectAwsAccessKey("AKID4PMBM7BFHE53PM2SG")).toHaveLength(0);
  });
  it("flags secret-like 40-char base64 in proximity to 'aws'", () => {
    expect(
      detectAwsSecretKey(
        "aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      ),
    ).toHaveLength(1);
  });
  it("does not flag arbitrary 40-char base64 without context", () => {
    expect(detectAwsSecretKey("abcd1234".repeat(5))).toHaveLength(0);
  });
});

describe("Stripe", () => {
  it("detects sk_live key", () => {
    expect(detectStripeKey("sk_live_" + "A".repeat(24))).toHaveLength(1);
  });
  it("detects sk_test key", () => {
    expect(detectStripeKey("paste sk_test_" + "B".repeat(24) + " here")).toHaveLength(1);
  });
  it("does not flag plain 'sk_live_' prefix without enough chars", () => {
    expect(detectStripeKey("see sk_live_short")).toHaveLength(0);
  });
});

describe("GitHub", () => {
  it("detects ghp_ token", () => {
    expect(detectGithubToken("token=ghp_" + "A".repeat(36))).toHaveLength(1);
  });
  it("detects gho_ OAuth token", () => {
    expect(detectGithubToken("gho_" + "B".repeat(40))).toHaveLength(1);
  });
});

describe("Slack", () => {
  it("detects xoxb bot token", () => {
    expect(
      detectSlackToken("xoxb-" + "1".repeat(10) + "-" + "1".repeat(10) + "-" + "a".repeat(24))
    ).toHaveLength(1);
  });
});

describe("JWT", () => {
  it("detects a real JWT", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(detectJwt(`Authorization: Bearer ${jwt}`)).toHaveLength(1);
  });
  it("rejects three-dot strings whose first segment isn't a JWT header", () => {
    expect(detectJwt("eyJfb28.eyJzdWIiOiI.signature")).toHaveLength(0);
  });
});

describe("PEM", () => {
  it("detects an RSA private key block", () => {
    const pem = `-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA\n-----END RSA PRIVATE KEY-----`;
    expect(detectPrivateKeyPem(pem)).toHaveLength(1);
  });
  it("detects an OPENSSH private key block", () => {
    const pem = `-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXkt\n-----END OPENSSH PRIVATE KEY-----`;
    expect(detectPrivateKeyPem(pem)).toHaveLength(1);
  });
});

describe("IBAN", () => {
  it("detects a valid German IBAN", () => {
    expect(detectIban("send to DE89370400440532013000 today")).toHaveLength(1);
  });
  it("rejects a checksum-invalid IBAN", () => {
    expect(detectIban("DE89370400440532013001")).toHaveLength(0);
  });
});

describe("US passport", () => {
  it("detects with explicit 'passport' context", () => {
    expect(detectPassportUs("Passport: A12345678")).toHaveLength(1);
  });
  it("does not flag random 9-char alphanumerics", () => {
    expect(detectPassportUs("token A12345678 has nothing to do with travel")).toHaveLength(0);
  });
});

describe("False-positive corpus", () => {
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    detection: {
      ...DEFAULT_SETTINGS.detection,
      // Enable everything with default severities for the worst-case scan.
      categories: Object.fromEntries(
        Object.entries(DEFAULT_SETTINGS.detection.categories).map(([k, v]) => [
          k,
          { ...v!, enabled: true },
        ]),
      ),
    },
  };

  for (const fixture of FALSE_POSITIVE_PASTES) {
    it(`does not trigger on: ${fixture.name}`, () => {
      const findings = runRegexLayer(fixture.text, settings);
      expect(findings, `unexpected findings: ${JSON.stringify(findings)}`).toHaveLength(0);
    });
  }
});
