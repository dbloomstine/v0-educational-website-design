'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { DeskRow, ContactLogEntry, WorkState } from '@/lib/crm/queries'
import styles from './desk.module.css'

type ColKey =
  | 'check' | 'contact' | 'work_state' | 'received' | 'title' | 'firm' | 'strategy'
  | 'target' | 'person_location' | 'firm_location' | 'email' | 'source'
  | 'firm_type' | 'priority' | 'share_ok' | 'email_confidence' | 'linkedin'
  | 'phone' | 'website' | 'lead_ref'

interface Col {
  key: ColKey
  label: string
  on: boolean
  locked?: boolean
  sticky?: string
  sortBy?: (r: DeskRow) => string
  render?: (r: DeskRow) => ReactNode
}

const STATE_LABEL: Record<WorkState, string> = {
  to_do: 'To do', in_progress: 'Working', done: 'Done', parked: 'Parked',
}
const STATE_CLASS: Record<string, string> = {
  to_do: styles.stTodo, in_progress: styles.stWorking, done: styles.stDone, parked: styles.stDone,
}

function dash(v: string | null | undefined): ReactNode {
  return v ? v : <span className={styles.soft}>—</span>
}

const INITIAL_COLS: Col[] = [
  { key: 'check', label: '', on: true, locked: true, sticky: styles.kCheck },
  { key: 'contact', label: 'Contact', on: true, locked: true, sticky: styles.kContact,
    sortBy: r => r.full_name,
    render: r => (
      <span className={styles.contactName}>
        {r.hold_note ? <span className={styles.flagDot} title="Handling flag">!</span> : null}
        {r.full_name}
      </span>
    ) },
  { key: 'work_state', label: 'Status', on: true, sortBy: r => r.work_state,
    render: r => <span className={`${styles.st} ${STATE_CLASS[r.work_state]}`}>{STATE_LABEL[r.work_state]}</span> },
  { key: 'received', label: 'Received', on: true,
    sortBy: r => r.date_received ?? r.created_at,
    render: r => <span className={`${styles.mono} ${styles.soft}`}>{(r.date_received ?? r.created_at).slice(5, 10)}</span> },
  { key: 'title', label: 'Title', on: true, sortBy: r => r.title ?? '', render: r => dash(r.title) },
  { key: 'firm', label: 'Firm', on: true, sortBy: r => r.firm_name, render: r => r.firm_name },
  { key: 'strategy', label: 'Strategy', on: true, sortBy: r => r.strategy ?? '', render: r => dash(r.strategy) },
  { key: 'target', label: 'Fund / target', on: true, sortBy: r => r.target_raise ?? '',
    render: r => r.target_raise ? <span className={styles.mono}>{r.target_raise}</span> : dash(null) },
  { key: 'person_location', label: 'Person based', on: true, sortBy: r => r.person_location ?? '',
    render: r => dash(r.person_location) },
  { key: 'firm_location', label: 'Fund based', on: true, sortBy: r => r.firm_location ?? '',
    render: r => r.firm_location
      ? <span className={r.person_location === r.firm_location ? styles.soft : undefined}>{r.firm_location}</span>
      : dash(null) },
  { key: 'email', label: 'Email', on: true, sortBy: r => r.email,
    render: r => <span className={styles.mono}>{r.email}</span> },
  { key: 'source', label: 'Source', on: true, sortBy: r => r.source_name ?? '',
    render: r => r.source_name
      ? <>{r.source_name}{r.source_org ? <span className={styles.soft}> · {r.source_org}</span> : null}</>
      : dash(null) },
  { key: 'firm_type', label: 'Fund type', on: false, sortBy: r => r.firm_type ?? '', render: r => dash(r.firm_type) },
  { key: 'priority', label: 'Pri', on: false, sortBy: r => r.priority ?? 'Z',
    render: r => r.priority
      ? <span className={`${styles.pri} ${r.priority === 'A' ? styles.priA : r.priority === 'B' ? styles.priB : styles.priC}`}>{r.priority}</span>
      : dash(null) },
  { key: 'share_ok', label: 'Share', on: false, sortBy: r => r.share_ok,
    render: r => {
      const map: Record<string, [string, string]> = {
        yes: [styles.tagOk, 'Shareable'],
        no_discreet: [styles.tagDisc, 'Discreet'],
        no_internal: ['', 'Internal'],
      }
      const [cls, label] = map[r.share_ok] ?? ['', r.share_ok]
      return <span className={`${styles.tag} ${cls}`}>{label}</span>
    } },
  { key: 'email_confidence', label: 'Email conf', on: false, sortBy: r => r.email_confidence ?? '',
    render: r => <span className={styles.soft}>{r.email_confidence ?? '—'}</span> },
  { key: 'linkedin', label: 'LinkedIn', on: false, sortBy: r => r.linkedin ?? '',
    render: r => r.linkedin
      ? <a className={`${styles.lnk} ${styles.mono}`} href={r.linkedin.startsWith('http') ? r.linkedin : `https://linkedin.com/${r.linkedin.replace(/^\/+/, '')}`}
           target="_blank" rel="noreferrer noopener" onClick={e => e.stopPropagation()}>{r.linkedin}</a>
      : dash(null) },
  { key: 'phone', label: 'Phone', on: false, sortBy: r => r.phone ?? '',
    render: r => <span className={`${styles.mono} ${styles.soft}`}>{r.phone ?? '—'}</span> },
  { key: 'website', label: 'Website', on: false, sortBy: r => r.website ?? '',
    render: r => r.website
      ? <a className={styles.lnk} href={r.website.startsWith('http') ? r.website : `https://${r.website}`}
           target="_blank" rel="noreferrer noopener" onClick={e => e.stopPropagation()}>{r.website.replace(/^https?:\/\//, '')}</a>
      : dash(null) },
  { key: 'lead_ref', label: 'Ref', on: false, sortBy: r => r.lead_ref,
    render: r => <span className={`${styles.mono} ${styles.soft}`}>{r.lead_ref}</span> },
]

const FILTERS: { id: string; label: string; fn: (r: DeskRow) => boolean }[] = [
  { id: 'to_do', label: 'To do', fn: r => r.work_state === 'to_do' },
  { id: 'working', label: 'Working', fn: r => r.work_state === 'in_progress' },
  { id: 'done', label: 'Done', fn: r => r.work_state === 'done' },
  { id: 'all', label: 'All', fn: () => true },
  { id: 'referral', label: 'Referrals', fn: r => r.source_type === 'referral_partner' },
  { id: 'auto', label: 'Automated', fn: r => r.source_type !== 'referral_partner' },
  { id: 'discreet', label: 'Discreet', fn: r => r.share_ok === 'no_discreet' },
]

export default function DeskGrid({ rows }: { rows: DeskRow[] }) {
  const router = useRouter()
  const [cols, setCols] = useState<Col[]>(INITIAL_COLS)
  const [filter, setFilter] = useState('to_do')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<ColKey>('received')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [openRow, setOpenRow] = useState<DeskRow | null>(null)
  const [log, setLog] = useState<ContactLogEntry[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [logAs, setLogAs] = useState<'researched' | 'contacted'>('researched')

  const visible = useMemo(() => cols.filter(c => c.on), [cols])

  const list = useMemo(() => {
    const f = FILTERS.find(x => x.id === filter)!
    const q = query.trim().toLowerCase()
    const out = rows.filter(f.fn).filter(r => {
      if (!q) return true
      return [r.full_name, r.firm_name, r.title, r.strategy, r.source_name, r.source_org,
              r.person_location, r.firm_location, r.email, r.firm_type, r.lead_ref]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    })
    const col = cols.find(c => c.key === sortKey)
    if (col?.sortBy) {
      out.sort((a, b) => {
        const A = col.sortBy!(a) ?? '', B = col.sortBy!(b) ?? ''
        return A < B ? -sortDir : A > B ? sortDir : 0
      })
    }
    return out
  }, [rows, filter, query, sortKey, sortDir, cols])

  const todoCount = useMemo(() => rows.filter(r => r.work_state === 'to_do').length, [rows])

  const openDrawer = useCallback(async (r: DeskRow) => {
    setOpenRow(r); setLog(null)
    try {
      const res = await fetch(`/api/desk/contact-log?firmId=${encodeURIComponent(r.firm_id)}`)
      const body = await res.json()
      setLog(res.ok ? body.entries ?? [] : [])
    } catch { setLog([]) }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpenRow(null); setPickerOpen(false) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  async function applyState(workState: WorkState) {
    if (sel.size === 0) return
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/desk/work-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...sel], workState, logAs: workState === 'done' ? logAs : null }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(body.error ?? 'Update failed'); return }
      setSel(new Set())
      router.refresh()
    } catch {
      setErr('Network error')
    } finally { setBusy(false) }
  }

  const allShown = list.length > 0 && list.every(r => sel.has(r.id))

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <h1 className={styles.mark}>Lead<span>·</span>Desk</h1>
        <div className={styles.queueN}>
          <b className={styles.mono}>{todoCount}</b><span>to do</span>
        </div>
        <div className={styles.topRight}>
          <span className={styles.sync}>9mo researched · 6mo contacted</span>
          <div className={styles.picker}>
            <button className={styles.btn} onClick={() => setPickerOpen(o => !o)}>Columns</button>
            {pickerOpen && (
              <div className={styles.pickPanel}>
                <div className={styles.pickHead}>Display columns</div>
                {cols.filter(c => c.key !== 'check').map(c => (
                  <label key={c.key} className={styles.pickRow}>
                    <input
                      type="checkbox" checked={c.on} disabled={c.locked}
                      onChange={e => setCols(prev => prev.map(x => x.key === c.key ? { ...x, on: e.target.checked } : x))}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <form action="/api/desk/logout" method="post" onSubmit={async e => {
            e.preventDefault()
            await fetch('/api/desk/logout', { method: 'POST' })
            router.replace('/desk/login')
          }}>
            <button className={styles.btn} type="submit">Sign out</button>
          </form>
        </div>
      </header>

      <div className={styles.filters}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`${styles.chip} ${filter === f.id ? styles.chipOn : ''}`}
            aria-pressed={filter === f.id}
            onClick={() => { setFilter(f.id); setSel(new Set()) }}
          >
            {f.label}<span className={`${styles.ct} ${styles.mono}`}>{rows.filter(f.fn).length}</span>
          </button>
        ))}
        <span className={styles.sep} />
        <input
          className={styles.search} type="search" value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search firm, person, strategy, source…"
        />
        <span style={{ marginLeft: 'auto' }} />
        <a className={styles.btn} href="/api/desk/export">Shareable cut</a>
      </div>

      {sel.size > 0 && (
        <div className={styles.bulk}>
          <b className={styles.mono}>{sel.size}</b><span>selected</span>
          <div className={styles.bulkRight}>
            <label htmlFor="logAs" style={{ fontSize: 11.5 }}>log as</label>
            <select id="logAs" className={styles.logSel} value={logAs} onChange={e => setLogAs(e.target.value as 'researched' | 'contacted')}>
              <option value="researched">researched (9mo)</option>
              <option value="contacted">contacted (6mo)</option>
            </select>
            <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy} onClick={() => applyState('done')}>
              {busy ? 'Saving…' : 'Mark done'}
            </button>
            <button className={styles.btn} disabled={busy} onClick={() => applyState('in_progress')}>Mark working</button>
            <button className={styles.btn} disabled={busy} onClick={() => setSel(new Set())}>Clear</button>
          </div>
        </div>
      )}

      <div className={styles.gridWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {visible.map(c => c.key === 'check' ? (
                <th key="check" className={c.sticky}>
                  <input
                    type="checkbox" checked={allShown}
                    onChange={e => {
                      const next = new Set(sel)
                      list.forEach(r => e.target.checked ? next.add(r.id) : next.delete(r.id))
                      setSel(next)
                    }}
                  />
                </th>
              ) : (
                <th key={c.key} className={c.sticky}
                    onClick={() => {
                      if (!c.sortBy) return
                      if (sortKey === c.key) setSortDir(d => (d === 1 ? -1 : 1))
                      else { setSortKey(c.key); setSortDir(1) }
                    }}>
                  {c.label}
                  {sortKey === c.key && <span className={styles.arrow}>{sortDir < 0 ? '↓' : '↑'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td className={styles.empty} colSpan={visible.length}>
                {rows.length === 0 ? 'No leads yet. Forward some to the leads inbox and run /process-leads.' : 'Nothing matches.'}
              </td></tr>
            ) : list.map(r => (
              <tr
                key={r.id}
                className={`${sel.has(r.id) ? styles.rowSel : ''} ${r.work_state === 'done' ? styles.rowDone : ''}`}
                onClick={() => openDrawer(r)}
              >
                {visible.map(c => c.key === 'check' ? (
                  <td key="check" className={c.sticky} onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox" checked={sel.has(r.id)}
                      onChange={e => {
                        const next = new Set(sel)
                        if (e.target.checked) next.add(r.id)
                        else next.delete(r.id)
                        setSel(next)
                      }}
                    />
                  </td>
                ) : (
                  <td key={c.key} className={c.sticky}>{c.render ? c.render(r) : null}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.statusBar}>
        <span>{list.length} of {rows.length} rows · {visible.length - 1} columns</span>
        <span>sorted by {sortKey} {sortDir < 0 ? 'desc' : 'asc'}</span>
        {err && <span className={styles.err}>{err}</span>}
        <span className={styles.statusRight}>danny-lead-crm</span>
      </div>

      {openRow && (
        <>
          <div className={styles.scrim} role="presentation" onClick={() => setOpenRow(null)} />
          <aside className={styles.draw}>
            <button className={styles.drawX} onClick={() => setOpenRow(null)} aria-label="Close">×</button>
            <div className={`${styles.mono} ${styles.soft}`}>{openRow.lead_ref}</div>
            <h2 className={styles.drawH}>{openRow.full_name}</h2>
            <div className={styles.drawSub}>{openRow.title ?? '—'} · {openRow.firm_name}</div>

            {openRow.hold_note && (
              <div className={`${styles.box} ${styles.boxFlag}`}><b>Handling</b>{openRow.hold_note}</div>
            )}

            <dl className={styles.kv}>
              <dt>Email</dt><dd className={styles.mono}>{openRow.email} <span className={styles.soft}>({openRow.email_confidence ?? '?'})</span></dd>
              <dt>Phone</dt><dd className={styles.mono}>{openRow.phone ?? '—'}</dd>
              <dt>LinkedIn</dt><dd className={styles.mono}>{openRow.linkedin ?? '—'}</dd>
              <dt>Person in</dt><dd>{openRow.person_location ?? '—'}</dd>
              <dt>Fund in</dt><dd>{openRow.firm_location ?? '—'}</dd>
              <dt>Type</dt><dd>{[openRow.firm_type, openRow.strategy].filter(Boolean).join(' · ') || '—'}</dd>
              <dt>Target</dt><dd>{openRow.target_raise ?? '—'}</dd>
              <dt>Source</dt><dd>{[openRow.source_name, openRow.source_org].filter(Boolean).join(' · ') || '—'}</dd>
              <dt>Priority</dt><dd>{openRow.priority ?? '—'}</dd>
              <dt>Blocker</dt><dd>{openRow.blocker ?? '—'}</dd>
            </dl>

            {openRow.notes && (
              <div className={`${styles.box} ${styles.boxNote}`}><b>Internal note — never exported</b>{openRow.notes}</div>
            )}

            <div className={styles.pickHead} style={{ margin: '0 0 9px' }}>Contact log</div>
            {log === null ? (
              <p className={styles.soft} style={{ fontSize: 12.5 }}>Loading…</p>
            ) : log.length === 0 ? (
              <p className={styles.soft} style={{ fontSize: 12.5 }}>No entries yet.</p>
            ) : (
              <ul className={styles.tl}>
                {log.map((e, i) => (
                  <li key={i}>
                    <span className={`${styles.tlWhen} ${styles.mono}`}>{e.occurred_at.slice(0, 10)}</span>
                    <span><b>{e.event_type}</b>{e.notes ? ` — ${e.notes}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </>
      )}
    </div>
  )
}
