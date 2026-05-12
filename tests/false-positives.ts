// Realistic "should NOT trigger" pastes — the false-positive corpus that
// keeps the regex layer trustworthy for knowledge workers.
export const FALSE_POSITIVE_PASTES: Array<{ name: string; text: string }> = [
  {
    name: "phone number that looks SSN-shaped without dashes",
    text: "Call us at 415 555 1212 — that's 4155551212 if you're typing it.",
  },
  {
    name: "16-digit non-Luhn number",
    text: "The order ID is 1234567890123456 — please reference it in your reply.",
  },
  {
    name: "JSON with order numbers (non-Luhn)",
    text: '{"orderId": "9999000011112222", "amount": 4200}',
  },
  {
    name: "Lorem ipsum",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    name: "code snippet with hex color",
    text: "background-color: #1a2b3c4d;\nborder-radius: 12px;\ncolor: #aaaaaa;",
  },
  {
    name: "git commit hash",
    text: "fixed in commit abc1234567890def1234567890abcdef12345678",
  },
  {
    name: "email signature with phone",
    text: "Best,\nJane Doe\n+1 (415) 555-2671\njane@example.com",
  },
  {
    name: "marketing copy with version numbers",
    text: "Version 2.4.1 ships the new dashboard. See the 14-day trial details at example.com/trial.",
  },
  {
    name: "AWS docs URL",
    text: "Read the AWS guide at https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html",
  },
  {
    name: "fake AWS-looking string with wrong prefix",
    text: "AKID4PMBM7BFHE53PM2SG1234567890ABCDEF — but this isn't AKIA-prefixed",
  },
  {
    name: "Stripe public docs reference",
    text: "Use sk_test_... in development per https://stripe.com/docs/keys",
  },
  {
    name: "non-JWT base64 string",
    text: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP",
  },
  {
    name: "git diff with hashes",
    text: "diff --git a/src/foo.ts b/src/foo.ts\nindex 1234567..89abcde 100644",
  },
  {
    name: "release notes with dates",
    text: "Released 2024-03-15. Hotfix on 2024-03-22 addresses the cache regression.",
  },
];
