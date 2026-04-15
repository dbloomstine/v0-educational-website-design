/**
 * Gmail API client for the outreach pipeline.
 *
 * Talks to the Gmail REST API directly via raw fetch. No googleapis SDK
 * dependency — consistent with the existing Resend raw-fetch pattern.
 *
 * Handles:
 *   - OAuth2 token refresh (exchange refresh_token for short-lived access_token)
 *   - MIME message construction for text/plain UTF-8 bodies with proper headers
 *   - Base64url encoding (the variant Google's API requires)
 *   - Send via users/me/messages/send
 *   - List + get messages for the reply/bounce monitor
 *
 * Requires env vars:
 *   GMAIL_OAUTH_CLIENT_ID
 *   GMAIL_OAUTH_CLIENT_SECRET
 *   GMAIL_OAUTH_REFRESH_TOKEN
 *   GMAIL_SENDER_EMAIL (optional, defaults to dbloomstine@gmail.com)
 */

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

const DEFAULT_SENDER_EMAIL = 'dbloomstine@gmail.com'
const DEFAULT_SENDER_NAME = 'Danny Bloomstine'

// ─── Token cache (per-process, per-cold-start) ───────────────────────────────
// Vercel serverless functions cold-start between cron invocations, so this
// cache only helps within a single run. Good enough: one token per cron fires.

interface CachedToken {
  accessToken: string
  expiresAt: number // epoch ms
}

let _tokenCache: CachedToken | null = null

async function getAccessToken(): Promise<string> {
  // Return cached token if it has >60s of life left.
  if (_tokenCache && _tokenCache.expiresAt - Date.now() > 60_000) {
    return _tokenCache.accessToken
  }

  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_OAUTH_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Gmail OAuth env vars (GMAIL_OAUTH_CLIENT_ID / GMAIL_OAUTH_CLIENT_SECRET / GMAIL_OAUTH_REFRESH_TOKEN)',
    )
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gmail OAuth refresh failed ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    access_token: string
    expires_in: number
    token_type: string
  }

  _tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return _tokenCache.accessToken
}

// ─── Base64url encoding (Gmail API variant) ─────────────────────────────────
function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ─── MIME message construction ──────────────────────────────────────────────

// eslint-disable-next-line no-control-regex
const NON_ASCII_RE = /[^\x00-\x7F]/

function encodeHeaderIfNeeded(s: string): string {
  // RFC 2047 encoded-word for non-ASCII subject/header values.
  if (NON_ASCII_RE.test(s)) {
    return `=?UTF-8?B?${Buffer.from(s, 'utf-8').toString('base64')}?=`
  }
  return s
}

function normalizeLineEndings(body: string): string {
  // Normalize any bare \n to \r\n. Gmail's MIME parser is strict about
  // line endings in some contexts.
  return body.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n')
}

function randomBoundary(): string {
  // Fresh boundary per message. Must not appear inside any part body;
  // 128 bits of randomness makes collision effectively impossible.
  return '----=_Part_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function buildMimeMessage(params: {
  from: string
  fromName: string
  to: string
  subject: string
  body: string
  html?: string
}): string {
  // Gmail's send API expects an RFC 2822 message, base64url-encoded.
  //
  // Two modes:
  //   - text only: single text/plain part (backwards compatible, short template)
  //   - text + html: multipart/alternative with both parts (forward mode)

  const headers = [
    `From: "${params.fromName}" <${params.from}>`,
    `To: ${params.to}`,
    `Subject: ${encodeHeaderIfNeeded(params.subject)}`,
    'MIME-Version: 1.0',
  ]

  const normalizedText = normalizeLineEndings(params.body)

  if (!params.html) {
    // Text only
    const lines = [
      ...headers,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      normalizedText,
    ]
    return lines.join('\r\n')
  }

  // Multipart/alternative: text + html bodies, recipient's mail client
  // picks whichever it supports (modern clients always html).
  const boundary = randomBoundary()
  const normalizedHtml = normalizeLineEndings(params.html)

  const lines = [
    ...headers,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    normalizedText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    normalizedHtml,
    '',
    `--${boundary}--`,
    '',
  ]
  return lines.join('\r\n')
}

// ─── Public: send an email ──────────────────────────────────────────────────
export async function sendGmail(params: {
  to: string
  subject: string
  body: string
  html?: string // Optional HTML body — when provided, sends multipart/alternative
  from?: string
  fromName?: string
}): Promise<{ messageId: string }> {
  const accessToken = await getAccessToken()

  const from = params.from ?? process.env.GMAIL_SENDER_EMAIL ?? DEFAULT_SENDER_EMAIL
  const fromName = params.fromName ?? DEFAULT_SENDER_NAME

  const raw = buildMimeMessage({
    from,
    fromName,
    to: params.to,
    subject: params.subject,
    body: params.body,
    html: params.html,
  })

  // Base64url encoding of binary data — for HTML bodies we need to treat
  // the input as UTF-8 bytes, not a JS string, so Buffer.from('utf-8')
  // correctly encodes any multi-byte characters. The existing helper
  // already handles this.
  const encoded = base64UrlEncode(raw)

  const res = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gmail send failed ${res.status}: ${text.slice(0, 300)}`)
  }

  const data = (await res.json()) as { id?: string; threadId?: string }
  if (!data.id) throw new Error('Gmail send succeeded but returned no message ID')

  return { messageId: data.id }
}

// ─── Public: fetch an inbox message's HTML and text parts ─────────────────
/**
 * Fetch a Gmail message and extract both text/plain and text/html parts
 * from the multipart payload. Used by the newsletter forward feature to
 * grab today's FundOps Daily newsletter from Danny's inbox so we can
 * forward it with a personal note.
 *
 * Returns both parts when present. If the message is not multipart, the
 * single body is returned in whichever field its mimeType indicates, and
 * the other field is empty.
 */
export interface GmailMessageContent {
  id: string
  threadId: string
  subject: string
  fromName: string
  fromEmail: string
  date: string // RFC 2822 date header as sent
  text: string
  html: string
}

export async function getMessageContent(messageId: string): Promise<GmailMessageContent> {
  const accessToken = await getAccessToken()
  const url = new URL(`${GMAIL_API_BASE}/messages/${messageId}`)
  url.searchParams.set('format', 'full')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gmail getMessageContent failed ${res.status}: ${text.slice(0, 200)}`)
  }

  // Gmail API payload shape for format=full. Parts can nest arbitrarily
  // (multipart/mixed → multipart/alternative → text/plain + text/html).
  interface MimePart {
    mimeType?: string
    headers?: Array<{ name: string; value: string }>
    body?: { size?: number; data?: string }
    parts?: MimePart[]
  }
  interface GmailMessage {
    id: string
    threadId: string
    payload?: MimePart
  }
  const data = (await res.json()) as GmailMessage

  const headers = data.payload?.headers ?? []
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''

  const subject = getHeader('Subject')
  const date = getHeader('Date')
  const fromRaw = getHeader('From')

  // Parse "Display Name <email@host>" or bare "email@host"
  const angleMatch = fromRaw.match(/^(.*?)\s*<([^>]+)>\s*$/)
  let fromName = ''
  let fromEmail = ''
  if (angleMatch) {
    fromName = angleMatch[1].trim().replace(/^"|"$/g, '')
    fromEmail = angleMatch[2].trim().toLowerCase()
  } else {
    fromEmail = fromRaw.trim().toLowerCase()
  }

  // Walk the MIME tree and collect the first text/plain and first text/html
  // parts we encounter. Gmail can nest parts deep in multipart/mixed +
  // multipart/related trees; we use a DFS.
  let textBody = ''
  let htmlBody = ''

  function decode(base64UrlData: string): string {
    return Buffer.from(base64UrlData, 'base64url').toString('utf-8')
  }

  function walk(part: MimePart) {
    if (part.mimeType === 'text/plain' && part.body?.data && !textBody) {
      textBody = decode(part.body.data)
    }
    if (part.mimeType === 'text/html' && part.body?.data && !htmlBody) {
      htmlBody = decode(part.body.data)
    }
    if (part.parts) {
      for (const child of part.parts) walk(child)
    }
  }

  if (data.payload) walk(data.payload)

  return {
    id: data.id,
    threadId: data.threadId,
    subject,
    fromName,
    fromEmail,
    date,
    text: textBody,
    html: htmlBody,
  }
}

// ─── Public: list inbox messages (for the monitor route) ───────────────────
export interface GmailListedMessage {
  id: string
  threadId: string
}

export async function listInboxMessages(params: {
  query: string
  maxResults?: number
}): Promise<GmailListedMessage[]> {
  const accessToken = await getAccessToken()
  const url = new URL(`${GMAIL_API_BASE}/messages`)
  url.searchParams.set('q', params.query)
  url.searchParams.set('maxResults', String(params.maxResults ?? 50))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gmail list failed ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as { messages?: GmailListedMessage[] }
  return data.messages ?? []
}

// ─── Public: get a specific message (full body for opt-out detection) ──────
export interface GmailMessageDetail {
  id: string
  threadId: string
  fromEmail: string
  subject: string
  body: string
}

export async function getMessage(messageId: string): Promise<GmailMessageDetail> {
  const accessToken = await getAccessToken()
  const url = new URL(`${GMAIL_API_BASE}/messages/${messageId}`)
  url.searchParams.set('format', 'full')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gmail get failed ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    id: string
    threadId: string
    payload?: {
      headers?: Array<{ name: string; value: string }>
      body?: { data?: string }
      parts?: Array<{
        mimeType?: string
        body?: { data?: string }
        parts?: Array<{ mimeType?: string; body?: { data?: string } }>
      }>
    }
  }

  const headers = data.payload?.headers ?? []
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''

  // "From" header comes like: `"John Doe" <john@example.com>` or `john@example.com`.
  // Extract the bare email.
  const fromRaw = getHeader('From')
  const fromEmailMatch = fromRaw.match(/<([^>]+)>/) ?? fromRaw.match(/([^\s<>]+@[^\s<>]+)/)
  const fromEmail = fromEmailMatch ? fromEmailMatch[1].toLowerCase() : fromRaw.toLowerCase()

  const subject = getHeader('Subject')

  // Extract the plain-text body. Gmail messages can have a simple body or
  // multipart/alternative with text/plain + text/html. Look for text/plain
  // first, fall back to the top-level body.
  function extractBody(
    payload: NonNullable<typeof data.payload>,
  ): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64url').toString('utf-8')
    }
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64url').toString('utf-8')
        }
        // Nested multipart: recurse one level for multipart/alternative → text/plain
        if (part.parts) {
          for (const nested of part.parts) {
            if (nested.mimeType === 'text/plain' && nested.body?.data) {
              return Buffer.from(nested.body.data, 'base64url').toString('utf-8')
            }
          }
        }
      }
      // Fallback: any text part.
      for (const part of payload.parts) {
        if (part.body?.data) {
          return Buffer.from(part.body.data, 'base64url').toString('utf-8')
        }
      }
    }
    return ''
  }

  const body = data.payload ? extractBody(data.payload) : ''

  return {
    id: data.id,
    threadId: data.threadId,
    fromEmail,
    subject,
    body,
  }
}
