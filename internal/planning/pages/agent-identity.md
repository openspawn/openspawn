# OpenSpawn Agent Identity Specification

**Version:** 0.1.0
**Status:** Draft
**Date:** 2026-02-26

---

## Overview

Every OpenSpawn agent gets a cryptographic identity at hire time — an Ed25519 keypair, like SSH keys but for agents. No auth servers, no shared secrets, no infrastructure costs. Identity is decentralized: ORG.md is the registry, the agent workspace holds the private key, and verification is peer-to-peer.

---

## 1. Identity Format

An agent's canonical identity is a structured URI:

```
openspawn:<org-id>:<agent-id>
```

**Examples:**

- `openspawn:krusty-krab:mr-krabs`
- `openspawn:acme-corp:deploy-bot`
- `openspawn:krusty-krab:squidward`

Each agent has:

- **One Ed25519 keypair** generated at hire time
- **Private key** stored in the agent's workspace at `.identity/private.key`
- **Public key** published in ORG.md and `.well-known/agents.json`

Full workspace path for the private key:

```
~/.openclaw/workspace-<agent-id>/.identity/private.key
```

---

## 2. Key Generation & Storage

### Generation

Keys are generated automatically during `openspawn hire` or `openspawn init`.

```typescript
import { generateKeyPairSync, createPublicKey } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

interface AgentIdentity {
  agentId: string;
  orgId: string;
  publicKeyBase64: string;
  fingerprint: string;
}

function generateAgentIdentity(
  orgId: string,
  agentId: string,
  workspacePath: string,
): AgentIdentity {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");

  // Store private key as PEM
  const identityDir = join(workspacePath, ".identity");
  mkdirSync(identityDir, { recursive: true, mode: 0o700 });
  writeFileSync(
    join(identityDir, "private.key"),
    privateKey.export({ type: "pkcs8", format: "pem" }),
    { mode: 0o600 },
  );

  // Export public key for publishing
  const pubKeyDer = publicKey.export({ type: "spki", format: "der" });
  const publicKeyBase64 = pubKeyDer.toString("base64");

  // Compute fingerprint
  const { createHash } = require("node:crypto");
  const fingerprint = "SHA256:" + createHash("sha256").update(pubKeyDer).digest("base64url");

  // Write public key PEM too (convenience)
  writeFileSync(join(identityDir, "public.key"), publicKey.export({ type: "spki", format: "pem" }));

  return { agentId, orgId, publicKeyBase64, fingerprint };
}
```

### Storage Summary

| Artifact            | Location                            | Permissions             |
| ------------------- | ----------------------------------- | ----------------------- |
| Private key (PEM)   | `<workspace>/.identity/private.key` | `0600` — agent only     |
| Public key (PEM)    | `<workspace>/.identity/public.key`  | `0644` — world-readable |
| Public key (base64) | ORG.md + `.well-known/agents.json`  | Public                  |

### Key Rotation

```bash
openspawn rotate-keys mr-krabs
```

This:

1. Generates a new keypair
2. Backs up the old private key to `.identity/private.key.bak`
3. Updates ORG.md with the new public key and fingerprint
4. Updates `.well-known/agents.json`
5. Invalidates any outstanding JWTs (they'll fail verification)

---

## 3. Message Signing

Every inter-agent message carries a cryptographic signature proving who sent it.

### Signed Envelope

```typescript
interface SignedMessage {
  sender_id: string; // "openspawn:krusty-krab:mr-krabs"
  timestamp: string; // ISO 8601
  payload: string; // message body
  signature: string; // base64-encoded Ed25519 signature
}
```

### Signing

The signature covers: `sender_id + "\n" + timestamp + "\n" + SHA-256(payload)`

```typescript
import { createPrivateKey, createHash, sign } from "node:crypto";
import { readFileSync } from "node:fs";

function signMessage(senderId: string, payload: string, privateKeyPath: string): SignedMessage {
  const timestamp = new Date().toISOString();
  const payloadHash = createHash("sha256").update(payload).digest("hex");
  const signable = `${senderId}\n${timestamp}\n${payloadHash}`;

  const privateKey = createPrivateKey(readFileSync(privateKeyPath));
  const signature = sign(null, Buffer.from(signable), privateKey).toString("base64");

  return { sender_id: senderId, timestamp, payload, signature };
}
```

### Verification

```typescript
import { createPublicKey, verify } from "node:crypto";

function verifyMessage(message: SignedMessage, publicKeyPem: string): boolean {
  // Replay protection: reject messages older than 5 minutes
  const messageAge = Date.now() - new Date(message.timestamp).getTime();
  if (messageAge > 5 * 60 * 1000 || messageAge < -30_000) {
    return false; // Expired or from the future
  }

  const payloadHash = createHash("sha256").update(message.payload).digest("hex");
  const signable = `${message.sender_id}\n${message.timestamp}\n${payloadHash}`;

  const publicKey = createPublicKey(publicKeyPem);
  return verify(null, Buffer.from(signable), publicKey, Buffer.from(message.signature, "base64"));
}
```

### What This Prevents

- **Impersonation:** Can't forge a signature without the private key
- **Replay attacks:** 5-minute timestamp window; messages outside it are rejected
- **Tampering:** Signature covers the payload hash; any modification invalidates it

---

## 4. Plugin Authentication

Agents authenticate to plugins using short-lived JWTs signed with their Ed25519 key.

### JWT Structure

**Header:**

```json
{ "alg": "EdDSA", "typ": "JWT" }
```

**Payload:**

```json
{
  "sub": "openspawn:krusty-krab:mr-krabs",
  "agent_id": "mr-krabs",
  "org_id": "krusty-krab",
  "permissions": ["plugin:slack:read", "plugin:slack:write"],
  "iat": 1740580200,
  "exp": 1740581100
}
```

Tokens expire after **15 minutes**. Agents mint fresh tokens as needed.

### Minting a Token

```typescript
import { createPrivateKey, sign as cryptoSign } from "node:crypto";
import { readFileSync } from "node:fs";

function mintAgentJwt(
  agentId: string,
  orgId: string,
  permissions: string[],
  privateKeyPath: string,
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "EdDSA", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: `openspawn:${orgId}:${agentId}`,
      agent_id: agentId,
      org_id: orgId,
      permissions,
      iat: now,
      exp: now + 900, // 15 minutes
    }),
  ).toString("base64url");

  const signable = `${header}.${payload}`;
  const privateKey = createPrivateKey(readFileSync(privateKeyPath));
  const signature = cryptoSign(null, Buffer.from(signable), privateKey).toString("base64url");

  return `${signable}.${signature}`;
}
```

### Plugin-Side Verification

```typescript
function verifyAgentJwt(
  token: string,
  getPublicKey: (agentUri: string) => string | null,
): { valid: boolean; payload?: any } {
  const [headerB64, payloadB64, signatureB64] = token.split(".");
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

  // Check expiry
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return { valid: false };
  }

  // Look up public key from ORG.md / agents.json
  const publicKeyPem = getPublicKey(payload.sub);
  if (!publicKeyPem) return { valid: false };

  const signable = `${headerB64}.${payloadB64}`;
  const publicKey = createPublicKey(publicKeyPem);
  const valid = verify(
    null,
    Buffer.from(signable),
    publicKey,
    Buffer.from(signatureB64, "base64url"),
  );

  return { valid, payload: valid ? payload : undefined };
}
```

---

## 5. Cross-Org Trust (Federation)

Organizations can trust each other's agents through an opt-in federation model.

### How It Works

1. **Org A** publishes its agents at `https://orgA.example/.well-known/agents.json`
2. **Org B** explicitly adds Org A to its trust store: `openspawn trust add https://orgA.example`
3. Org B's plugins can now verify JWTs from Org A's agents
4. Trust is **revocable** — `openspawn trust remove orgA`

### `.well-known/agents.json`

```json
{
  "org_id": "krusty-krab",
  "agents": {
    "mr-krabs": {
      "public_key": "MCowBQYDK2VwAyEA...",
      "fingerprint": "SHA256:abc123...",
      "role": "CEO",
      "level": 10
    },
    "squidward": {
      "public_key": "MCowBQYDK2VwAyEA...",
      "fingerprint": "SHA256:def456...",
      "role": "Cashier",
      "level": 3
    }
  },
  "updated_at": "2026-02-26T15:00:00Z"
}
```

### Trust Store

Stored in the org workspace at `.openspawn/trust.json`:

```json
{
  "trusted_orgs": [
    {
      "org_id": "acme-corp",
      "url": "https://acme-corp.example",
      "fingerprints": ["SHA256:xyz789..."],
      "added_at": "2026-02-26T15:00:00Z"
    }
  ]
}
```

Trust resolution: when a plugin receives a JWT with `org_id: "acme-corp"`, it fetches (and caches) `acme-corp`'s `agents.json` to verify the signature — but only if `acme-corp` is in the trust store.

---

## 6. ORG.md Integration

Identity is declared inline in ORG.md alongside each agent's role:

```markdown
## Agents

### Mr. Krabs

- Role: CEO
- Level: 10
- Public Key: `ed25519:MCowBQYDK2VwAyEAr3nFGoJm8uR8VBh...`
- Fingerprint: `SHA256:2jmj7l5rSw0yVb_vlWAYkK_YBwk`
- Hired: 2026-01-15

### Squidward

- Role: Cashier
- Level: 3
- Public Key: `ed25519:MCowBQYDK2VwAyEA8kP2q1mXvB9nRxZ...`
- Fingerprint: `SHA256:K7gNU3sdo-OL0wNhqoVWhr3g6s1xYv`
- Hired: 2026-02-01
```

The `openspawn hire` and `openspawn rotate-keys` commands update these entries automatically.

---

## 7. CLI Commands

| Command                            | Description                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| `openspawn init`                   | Generate keypairs for all agents in ORG.md that don't have one |
| `openspawn hire <agent-id>`        | Create agent workspace, generate keypair, update ORG.md        |
| `openspawn identity <agent-id>`    | Print public key and fingerprint                               |
| `openspawn verify <message-file>`  | Verify a signed message against ORG.md keys                    |
| `openspawn rotate-keys <agent-id>` | Generate new keypair, update ORG.md, backup old key            |
| `openspawn trust add <org-url>`    | Add an org's agents.json URL to the trust store                |
| `openspawn trust remove <org-id>`  | Revoke trust for an org                                        |
| `openspawn trust list`             | Show all trusted orgs                                          |

### Example Usage

```bash
# Hire a new agent (generates identity automatically)
$ openspawn hire spongebob --role "Fry Cook" --level 5
✓ Created workspace ~/.openclaw/workspace-spongebob/
✓ Generated Ed25519 keypair
✓ Updated ORG.md
  Agent ID:    openspawn:krusty-krab:spongebob
  Fingerprint: SHA256:dGhlIGt...

# Check an agent's identity
$ openspawn identity mr-krabs
Agent:       openspawn:krusty-krab:mr-krabs
Public Key:  ed25519:MCowBQYDK2VwAyEAr3nFGoJm8uR8VBh...
Fingerprint: SHA256:2jmj7l5rSw0yVb_vlWAYkK_YBwk

# Verify a signed message
$ openspawn verify message.json
✓ Valid signature from openspawn:krusty-krab:mr-krabs
  Signed at: 2026-02-26T15:30:00Z (2 minutes ago)

# Rotate keys after a compromise
$ openspawn rotate-keys squidward
✓ Old key backed up to .identity/private.key.bak
✓ Generated new Ed25519 keypair
✓ Updated ORG.md
  New fingerprint: SHA256:newKey...
```

---

## 8. Security Considerations

### Key Protection

- Private keys **never leave the agent workspace**
- File permissions: `0600` (owner read/write only)
- Agents must never log, print, or transmit private keys
- The `.identity/` directory is `0700`

### Decentralized Registry

- **No central key server** — ORG.md is the source of truth
- No single point of failure for identity verification
- Each org controls its own agent registry

### Compromise Response

1. Remove the agent's public key from ORG.md (immediate revocation)
2. Run `openspawn rotate-keys <agent-id>` to generate a new keypair
3. All outstanding JWTs from the old key become unverifiable instantly
4. Audit recent messages signed with the compromised key
5. Notify trusted orgs if the agent had cross-org access

### Replay Protection

- Message signatures include a timestamp
- Receiving agents reject messages outside a **5-minute window**
- Clock skew tolerance: 30 seconds into the future

### Token Hygiene

- JWTs expire after **15 minutes**
- Agents mint tokens on-demand, not cached long-term
- Permissions are scoped per-token (principle of least privilege)

---

## 9. Why Ed25519?

| Approach             | Decentralized |  Auth Server  | Non-Repudiation |      Cost      |
| -------------------- | :-----------: | :-----------: | :-------------: | :------------: |
| **Ed25519 keypairs** |      ✅       |  Not needed   |       ✅        |      Free      |
| OAuth 2.0            |      ❌       |   Required    |       ✅        | Infrastructure |
| JWTs (HMAC)          |      ❌       | Shared secret |       ❌        |      Free      |
| API keys             |      ❌       |   Key store   |       ❌        |      Free      |

**Ed25519 specifically because:**

- **Fast:** Signing and verification are sub-millisecond
- **Small keys:** 32 bytes public, 64 bytes private
- **Deterministic:** Same input always produces the same signature (no randomness bugs)
- **Standard:** Supported natively in Node.js `crypto`, OpenSSL, libsodium, and every major language
- **Battle-tested:** Used by SSH, Signal, WireGuard, and Tor

**What the alternatives lack:**

- **OAuth** solves identity but requires running an authorization server, token endpoints, and refresh flows — overkill for agent-to-agent communication
- **JWTs with HMAC** (HS256) use a shared secret, so any party that can verify can also forge — no non-repudiation
- **API keys** are shared secrets with no cryptographic binding to identity — if leaked, anyone can impersonate the agent

---

## Appendix: Full Working Example

A complete sign-and-verify flow:

```typescript
import {
  generateKeyPairSync,
  createPrivateKey,
  createPublicKey,
  createHash,
  sign,
  verify,
} from "node:crypto";

// --- Setup: generate a keypair ---
const { publicKey, privateKey } = generateKeyPairSync("ed25519");

const agentId = "openspawn:krusty-krab:mr-krabs";

// --- Sign a message ---
const payload = "Give Squidward a raise? No.";
const timestamp = new Date().toISOString();
const payloadHash = createHash("sha256").update(payload).digest("hex");
const signable = `${agentId}\n${timestamp}\n${payloadHash}`;

const signature = sign(null, Buffer.from(signable), privateKey);

console.log("Signature:", signature.toString("base64"));

// --- Verify the message ---
const isValid = verify(null, Buffer.from(signable), publicKey, signature);
console.log("Valid:", isValid); // true

// --- Tamper detection ---
const tamperedPayload = "Give Squidward a raise? Yes!";
const tamperedHash = createHash("sha256").update(tamperedPayload).digest("hex");
const tamperedSignable = `${agentId}\n${timestamp}\n${tamperedHash}`;

const isTamperValid = verify(null, Buffer.from(tamperedSignable), publicKey, signature);
console.log("Tampered valid:", isTamperValid); // false
```

---

_This spec is a living document. As OpenSpawn evolves, so will the identity model._
