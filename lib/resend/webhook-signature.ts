import crypto from 'node:crypto'

/**
 * Verify a Svix-format webhook signature (what Resend uses for every webhook).
 *
 * The signed payload is `${id}.${timestamp}.${rawBody}`, HMAC-SHA256'd with
 * the base64-decoded secret and compared against the base64 signatures in the
 * `svix-signature` header (space-separated, each prefixed with its version,
 * e.g. "v1,abc== v1,def=="). Multiple signatures appear during secret
 * rotation, so any match is a pass. Each Resend webhook has its own secret.
 */
export const SIGNATURE_TOLERANCE_SECONDS = 5 * 60

export function verifySvixSignature(
  rawBody: string,
  headers: Headers,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): { ok: true } | { ok: false; reason: string } {
  const id = headers.get('svix-id')
  const timestamp = headers.get('svix-timestamp')
  const signatureHeader = headers.get('svix-signature')

  if (!id || !timestamp || !signatureHeader) {
    return { ok: false, reason: 'missing svix headers' }
  }

  // Reject replays of an old capture.
  const sentAt = Number(timestamp)
  if (!Number.isFinite(sentAt)) return { ok: false, reason: 'bad timestamp' }
  if (Math.abs(nowSeconds - sentAt) > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: 'timestamp outside tolerance' }
  }

  // Secrets are handed out as `whsec_<base64>`; the raw key is the decoded tail.
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest()

  for (const entry of signatureHeader.split(' ')) {
    const [, value] = entry.split(',')
    if (!value) continue
    const candidate = Buffer.from(value, 'base64')
    if (candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected)) {
      return { ok: true }
    }
  }

  return { ok: false, reason: 'no matching signature' }
}

/** Test helper and documentation of the format: the header a sender would put on `rawBody`. */
export function signSvix(rawBody: string, secret: string, id: string, timestamp: number): string {
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const sig = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest('base64')
  return `v1,${sig}`
}
