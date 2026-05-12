import type { Finding } from "@/shared/types";
import { matchesToFindings } from "./_helpers";

// Catches RSA, EC, OpenSSH, ED25519, encrypted, and unlabeled PRIVATE KEY
// PEM headers. Match extends to the matching END line so the whole block is
// flagged for redaction.
const PEM_RE =
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY-----/g;

export function detectPrivateKeyPem(text: string): Finding[] {
  return matchesToFindings(text, Array.from(text.matchAll(PEM_RE)), {
    category: "private-key-pem",
    label: "Private key (PEM)",
    defaultSeverity: "critical",
  });
}
