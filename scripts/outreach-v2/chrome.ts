/**
 * Headless Chrome over the DevTools protocol, for local scripts (the mock-up
 * logo resolver and its contact sheet). No packages: Node's own WebSocket and
 * the Chrome already on the Mac. The approach is the social desk's
 * (~/fundopshq-workspace/social/engine/chrome.mjs), adapted: a page can be
 * photographed at 2x, by clip, on a transparent ground, and a load that never
 * finishes gives up after a deadline instead of hanging.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export interface Page {
  goto(url: string, timeoutMs?: number): Promise<void>
  eval<T = unknown>(expression: string): Promise<T>
  transparent(on: boolean): Promise<void>
  shot(clip?: { x: number; y: number; width: number; height: number }): Promise<Buffer>
  close(): Promise<void>
}

export async function launch({ width = 1440, height = 900, scale = 2 } = {}): Promise<Page> {
  const profile = mkdtempSync(join(tmpdir(), 'fops-outreach-chrome-'))
  const proc: ChildProcess = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, `--window-size=${width},${height}`,
    '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio',
    '--disable-background-networking', '--disable-component-update', '--disable-sync', '--password-store=basic', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] })
  const wsUrl = await new Promise<string>((resolve, reject) => {
    let buf = ''
    const timer = setTimeout(() => { proc.kill('SIGKILL'); reject(new Error('Chrome did not start')) }, 60_000)
    proc.stderr!.on('data', (d) => {
      buf += d
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/)
      if (m) { clearTimeout(timer); resolve(m[1]) }
    })
    proc.on('exit', (code) => { clearTimeout(timer); reject(new Error(`Chrome exited (${code})`)) })
  })
  const ws = new WebSocket(wsUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let seq = 0
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
  const listeners = new Set<(m: { method?: string; sessionId?: string }) => void>()
  ws.onmessage = (ev) => {
    const msg = JSON.parse(String(ev.data))
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id)!
      pending.delete(msg.id)
      if (msg.error) p.reject(new Error(msg.error.message))
      else p.resolve(msg.result)
    } else for (const l of listeners) l(msg)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const send = (method: string, params: object = {}, sessionId?: string): Promise<any> =>
    new Promise((resolve, reject) => {
      const id = ++seq
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    })
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const s = (method: string, params: object = {}) => send(method, params, sessionId)
  await s('Page.enable')
  await s('Runtime.enable')
  await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false })
  await s('Network.enable')
  await s('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' })

  const page: Page = {
    async goto(url, timeoutMs = 25_000) {
      const loaded = new Promise<void>((resolve) => {
        const l = (m: { method?: string; sessionId?: string }) => { if (m.method === 'Page.loadEventFired' && m.sessionId === sessionId) { listeners.delete(l); resolve() } }
        listeners.add(l)
      })
      await s('Page.navigate', { url })
      await Promise.race([loaded, new Promise((r) => setTimeout(r, timeoutMs))])
      await page.eval(`document.fonts ? document.fonts.ready.then(() => true) : true`).catch(() => {})
    },
    async eval<T>(expression: string): Promise<T> {
      const r = await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
      return r.result.value as T
    },
    async transparent(on) {
      await s('Emulation.setDefaultBackgroundColorOverride', on ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {})
    },
    async shot(clip) {
      const r = await s('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}), captureBeyondViewport: !!clip })
      return Buffer.from(r.data, 'base64')
    },
    async close() {
      await Promise.race([send('Browser.close').catch(() => {}), new Promise((r) => setTimeout(r, 2000))])
      proc.kill()
      try { ws.close() } catch { /* closed */ }
      try { rmSync(profile, { recursive: true, force: true }) } catch { /* temp */ }
    },
  }
  return page
}
