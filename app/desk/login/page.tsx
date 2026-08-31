'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../desk.module.css'

export default function DeskLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/desk/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.replace('/desk')
        router.refresh()
        return
      }
      const body = await res.json().catch(() => ({}))
      setErr(body.error ?? 'Sign in failed')
    } catch {
      setErr('Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.loginWrap}>
      <form className={styles.loginCard} onSubmit={submit}>
        <h1 className={styles.loginMark}>Lead<span>·</span>Desk</h1>
        <p className={styles.loginSub}>Private. Authorized use only.</p>
        <input
          className={styles.loginInput}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          autoFocus
          required
        />
        <button className={styles.loginBtn} type="submit" disabled={busy || !password}>
          {busy ? 'Checking…' : 'Sign in'}
        </button>
        <p className={styles.loginErr} role="alert">{err}</p>
      </form>
    </div>
  )
}
