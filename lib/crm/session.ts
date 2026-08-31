/**
 * Session token signing. Uses Web Crypto only, so it runs in BOTH the edge
 * middleware and Node route handlers. Password hashing lives in password.ts,
 * which is Node-only — do not import that from middleware.
 */

const ENC = new TextEncoder()

export const SESSION_COOKIE = 'desk_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 12 // 12 hours

function toB64Url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64Url(s: string): Uint8Array<ArrayBuffer> {
  let t = s.replace(/-/g, '+').replace(/_/g, '/')
  while (t.length % 4) t += '='
  const bin = atob(t)
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    ENC.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

/** Returns `<payload>.<signature>`, both base64url. */
export async function signSession(secret: string, ttlSeconds = SESSION_TTL_SECONDS): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const payload = toB64Url(ENC.encode(JSON.stringify({ exp })))
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', await hmacKey(secret), ENC.encode(payload))
  )
  return `${payload}.${toB64Url(sig)}`
}

/** Constant-time via crypto.subtle.verify. Returns false on anything malformed. */
export async function verifySession(secret: string, token: string | undefined): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot < 1) return false
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!payload || !sig) return false

  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      fromB64Url(sig),
      ENC.encode(payload)
    )
    if (!ok) return false
    const claims = JSON.parse(new TextDecoder().decode(fromB64Url(payload)))
    return typeof claims?.exp === 'number' && claims.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}
