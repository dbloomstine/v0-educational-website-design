'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { DeskRow, ContactLogEntry, WorkState } from '@/lib/crm/queries'
import styles from './desk.module.css'

/* ------------------------------------------------------------------ */
/* Column definitions                                                  */
/* ------------------------------------------------------------------ */

type Kind = 'text' | 'enum' | 'date' | 'bool'

interface Col {
  key: string
  label: string
  on: boolean
  locked?: boolean
  sticky?: string
  kind: Kind
  /** raw value used for filtering + sorting */
  val: (r: DeskRow) => string
  render?: (r: DeskRow) => ReactNode
}

const STATE_LABEL: Record<WorkState, string> = {
  to_do: 'To do', in_progress: 'Working', done: 'Done', parked: 'Parked',
}
const STATE_CLASS: Record<string, string> = {
  to_do: styles.stTodo, in_progress: styles.stWorking, done: styles.stDone, parked: styles.stDone,
}
const SHARE_LABEL: Record<string, [string, string]> = {
  yes: [styles.tagOk, 'Shareable'],
  no_discreet: [styles.tagDisc, 'Discreet'],
  no_internal: ['', 'Internal'],
}

function dash(v: string | null | undefined): ReactNode {
  return v ? v : <span className={styles.soft}>—</span>
}
const S = (v: unknown) => (v === null || v === undefined || v === '' ? '' : String(v))

function buildCols(onToggleDone: (r: DeskRow, done: boolean) => void): Col[] {
  return [
    { key: 'check', label: '', on: true, locked: true, sticky: styles.kCheck, kind: 'text', val: () => '' },

    { key: 'full_name', label: 'Contact', on: true, locked: true, sticky: styles.kContact, kind: 'text',
      val: r => r.full_name,
      render: r => (
        <span className={styles.contactName}>
          {r.hold_note ? <span className={styles.flagDot} title="Handling flag">!</span> : null}
          {r.full_name}
        </span>
      ) },

    { key: 'work_state', label: 'Status', on: true, kind: 'enum',
      val: r => STATE_LABEL[r.work_state],
      render: r => (
        <span className={styles.doneCell}>
          <input
            type="checkbox"
            checked={r.work_state === 'done'}
            title={r.work_state === 'done' ? 'Mark as to do' : 'Mark done'}
            onClick={e => e.stopPropagation()}
            onChange={e => onToggleDone(r, e.target.checked)}
          />
          <span className={`${styles.st} ${STATE_CLASS[r.work_state]}`}>{STATE_LABEL[r.work_state]}</span>
        </span>
      ) },

    { key: 'date_received', label: 'Received', on: true, kind: 'date',
      val: r => (r.date_received ?? r.created_at).slice(0, 10),
      render: r => <span className={`${styles.mono} ${styles.soft}`}>{(r.date_received ?? r.created_at).slice(0, 10)}</span> },

    { key: 'title', label: 'Title', on: true, kind: 'text', val: r => S(r.title), render: r => dash(r.title) },

    { key: 'firm_name', label: 'Company', on: true, kind: 'text', val: r => r.firm_name, render: r => r.firm_name },

    { key: 'domain', label: 'Domain', on: true, kind: 'text', val: r => S(r.domain),
      render: r => r.domain ? <span className={styles.mono}>{r.domain}</span> : dash(null) },

    { key: 'firm_type', label: 'Fund type', on: true, kind: 'enum', val: r => S(r.firm_type), render: r => dash(r.firm_type) },

    { key: 'strategy', label: 'Strategy', on: true, kind: 'text', val: r => S(r.strategy), render: r => dash(r.strategy) },

    { key: 'target_raise', label: 'Fund / target', on: true, kind: 'text', val: r => S(r.target_raise),
      render: r => r.target_raise ? <span className={styles.mono}>{r.target_raise}</span> : dash(null) },

    { key: 'person_location', label: 'Person based', on: true, kind: 'enum', val: r => S(r.person_location),
      render: r => dash(r.person_location) },

    { key: 'firm_location', label: 'Fund based', on: true, kind: 'enum', val: r => S(r.firm_location),
      render: r => r.firm_location
        ? <span className={r.person_location === r.firm_location ? styles.soft : undefined}>{r.firm_location}</span>
        : dash(null) },

    { key: 'email', label: 'Email', on: true, kind: 'text', val: r => r.email,
      render: r => <span className={styles.mono}>{r.email}</span> },

    { key: 'source_name', label: 'Source', on: true, kind: 'enum', val: r => S(r.source_name),
      render: r => r.source_name
        ? <>{r.source_name}{r.source_org && r.source_org !== 'seed' ? <span className={styles.soft}> · {r.source_org}</span> : null}</>
        : dash(null) },

    { key: 'status', label: 'Fund status', on: false, kind: 'enum', val: r => S(r.status), render: r => dash(r.status) },
    { key: 'share_ok', label: 'Share', on: false, kind: 'enum',
      val: r => (SHARE_LABEL[r.share_ok]?.[1] ?? r.share_ok),
      render: r => {
        const [cls, label] = SHARE_LABEL[r.share_ok] ?? ['', r.share_ok]
        return <span className={`${styles.tag} ${cls}`}>{label}</span>
      } },
    { key: 'priority', label: 'Pri', on: false, kind: 'enum', val: r => S(r.priority),
      render: r => r.priority
        ? <span className={`${styles.pri} ${r.priority === 'A' ? styles.priA : r.priority === 'B' ? styles.priB : styles.priC}`}>{r.priority}</span>
        : dash(null) },
    { key: 'role_class', label: 'Role', on: false, kind: 'enum', val: r => S(r.role_class), render: r => dash(r.role_class) },
    { key: 'linkedin', label: 'LinkedIn', on: false, kind: 'text', val: r => S(r.linkedin),
      render: r => r.linkedin
        ? <a className={`${styles.lnk} ${styles.mono}`} onClick={e => e.stopPropagation()}
             href={r.linkedin.startsWith('http') ? r.linkedin : `https://www.linkedin.com/${r.linkedin.replace(/^\/+/, '')}`}
             target="_blank" rel="noreferrer noopener">{r.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\//, '')}</a>
        : dash(null) },
    { key: 'linkedin_verified', label: 'LI verified', on: false, kind: 'bool',
      val: r => (r.linkedin_verified ? 'Verified' : 'Not verified'),
      render: r => r.linkedin_verified
        ? <span className={`${styles.tag} ${styles.tagOk}`}>verified</span>
        : <span className={styles.soft}>—</span> },
    { key: 'email_confidence', label: 'Email conf', on: false, kind: 'enum', val: r => S(r.email_confidence),
      render: r => <span className={styles.soft}>{r.email_confidence ?? '—'}</span> },
    { key: 'email_type', label: 'Email type', on: false, kind: 'enum', val: r => S(r.email_type),
      render: r => <span className={styles.soft}>{r.email_type ?? '—'}</span> },
    { key: 'phone', label: 'Phone', on: false, kind: 'text', val: r => S(r.phone),
      render: r => <span className={`${styles.mono} ${styles.soft}`}>{r.phone ?? '—'}</span> },
    { key: 'lead_type', label: 'Lead type', on: false, kind: 'enum', val: r => S(r.lead_type), render: r => dash(r.lead_type) },
    { key: 'blocker', label: 'Blocker', on: false, kind: 'text', val: r => S(r.blocker), render: r => dash(r.blocker) },
    { key: 'touch_count', label: 'Touches', on: false, kind: 'enum', val: r => String(r.touch_count),
      render: r => <span className={styles.mono}>{r.touch_count}</span> },
    { key: 'lead_ref', label: 'Ref', on: false, kind: 'text', val: r => r.lead_ref,
      render: r => <span className={`${styles.mono} ${styles.soft}`}>{r.lead_ref}</span> },
  ]
}

const QUICK = [
  { id: 'all', label: 'All', fn: () => true },
  { id: 'to_do', label: 'To do', fn: (r: DeskRow) => r.work_state === 'to_do' },
  { id: 'working', label: 'Working', fn: (r: DeskRow) => r.work_state === 'in_progress' },
  { id: 'done', label: 'Done', fn: (r: DeskRow) => r.work_state === 'done' },
  { id: 'referral', label: 'Referrals', fn: (r: DeskRow) => r.source_type === 'referral_partner' },
  { id: 'discreet', label: 'Discreet', fn: (r: DeskRow) => r.share_ok === 'no_discreet' },
]

/* ------------------------------------------------------------------ */

export default function DeskGrid({ rows }: { rows: DeskRow[] }) {
  const router = useRouter()

  const [quick, setQuick] = useState('all')          // defaults to All
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('date_received')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({})
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [popPos, setPopPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [openRow, setOpenRow] = useState<DeskRow | null>(null)
  const [log, setLog] = useState<ContactLogEntry[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [logAs, setLogAs] = useState<'researched' | 'contacted'>('researched')

  const toggleDone = useCallback(async (r: DeskRow, done: boolean) => {
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/desk/work-state', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: [r.id],
          workState: done ? 'done' : 'to_do',
          logAs: done ? logAs : null,
        }),
      })
      if (!res.ok) setErr((await res.json().catch(() => ({}))).error ?? 'Update failed')
      else router.refresh()
    } catch { setErr('Network error') } finally { setBusy(false) }
  }, [logAs, router])

  const [cols, setCols] = useState<Col[]>(() => buildCols(() => {}))
  // keep the render closure pointing at the latest toggleDone
  const liveCols = useMemo(
    () => cols.map(c => (c.key === 'work_state' ? buildCols(toggleDone).find(x => x.key === 'work_state')! : c))
      .map(c => ({ ...c, on: cols.find(x => x.key === c.key)!.on })),
    [cols, toggleDone]
  )
  const visible = useMemo(() => liveCols.filter(c => c.on), [liveCols])

  /* ---- filtering ---------------------------------------------------- */

  const passesExcept = useCallback((r: DeskRow, skipKey: string | null) => {
    for (const [key, allowed] of Object.entries(colFilters)) {
      if (key === skipKey || !allowed.length) continue
      const col = liveCols.find(c => c.key === key)
      if (col && !allowed.includes(col.val(r))) return false
    }
    if (skipKey !== 'date_received') {
      const d = (r.date_received ?? r.created_at).slice(0, 10)
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
    }
    return true
  }, [colFilters, dateFrom, dateTo, liveCols])

  const list = useMemo(() => {
    const qf = QUICK.find(x => x.id === quick)!
    const q = query.trim().toLowerCase()
    const out = rows.filter(qf.fn).filter(r => passesExcept(r, null)).filter(r => {
      if (!q) return true
      return liveCols.map(c => c.val(r)).join(' ').toLowerCase().includes(q)
    })
    const col = liveCols.find(c => c.key === sortKey)
    if (col) {
      out.sort((a, b) => {
        const A = col.val(a), B = col.val(b)
        if (A === B) return 0
        if (A === '') return 1
        if (B === '') return -1
        return A < B ? -sortDir : sortDir
      })
    }
    return out
  }, [rows, quick, query, sortKey, sortDir, liveCols, passesExcept])

  /** Distinct values for a column, honouring every OTHER active filter (Excel behaviour). */
  const distinctFor = useCallback((key: string) => {
    const col = liveCols.find(c => c.key === key)
    if (!col) return []
    const counts = new Map<string, number>()
    const qf = QUICK.find(x => x.id === quick)!
    for (const r of rows.filter(qf.fn)) {
      if (!passesExcept(r, key)) continue
      const v = col.val(r)
      counts.set(v, (counts.get(v) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => (a[0] === '' ? 1 : b[0] === '' ? -1 : a[0].localeCompare(b[0])))
  }, [liveCols, rows, quick, passesExcept])

  const activeFilterKeys = useMemo(
    () => Object.entries(colFilters).filter(([, v]) => v.length).map(([k]) => k),
    [colFilters]
  )

  /* ---- selection & bulk --------------------------------------------- */

  const allShown = list.length > 0 && list.every(r => sel.has(r.id))

  async function applyState(workState: WorkState) {
    if (!sel.size) return
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/desk/work-state', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...sel], workState, logAs: workState === 'done' ? logAs : null }),
      })
      if (!res.ok) { setErr((await res.json().catch(() => ({}))).error ?? 'Update failed'); return }
      setSel(new Set()); router.refresh()
    } catch { setErr('Network error') } finally { setBusy(false) }
  }

  async function exportXlsx(mode: 'shareable' | 'internal') {
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/desk/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, ids: sel.size ? [...sel] : undefined }),
      })
      if (!res.ok) { setErr('Export failed'); return }
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition') ?? ''
      const name = /filename="([^"]+)"/.exec(cd)?.[1] ?? 'lead-desk.xlsx'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = name; document.body.appendChild(a); a.click()
      a.remove(); URL.revokeObjectURL(url)
    } catch { setErr('Export failed') } finally { setBusy(false) }
  }

  /* ---- drawer -------------------------------------------------------- */

  const openDrawer = useCallback(async (r: DeskRow) => {
    setOpenRow(r); setLog(null)
    try {
      const res = await fetch(`/api/desk/contact-log?firmId=${encodeURIComponent(r.firm_id)}`)
      const b = await res.json()
      setLog(res.ok ? b.entries ?? [] : [])
    } catch { setLog([]) }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenRow(null); setPickerOpen(false); setOpenFilter(null) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  /* ------------------------------------------------------------------ */

  const todo = rows.filter(r => r.work_state === 'to_do').length

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <h1 className={styles.mark}>Lead<span>·</span>Desk</h1>
        <div className={styles.queueN}>
          <b className={styles.mono}>{todo}</b><span>to do</span>
        </div>
        <div className={styles.topRight}>
          <span className={styles.sync}>9mo researched · 6mo contacted</span>
          <div className={styles.picker}>
            <button className={styles.btn} onClick={() => setPickerOpen(o => !o)}>Columns</button>
            {pickerOpen && (
              <div className={styles.pickPanel}>
                <div className={styles.pickHead}>Display columns</div>
                {liveCols.filter(c => c.key !== 'check').map(c => (
                  <label key={c.key} className={styles.pickRow}>
                    <input type="checkbox" checked={c.on} disabled={c.locked}
                      onChange={e => setCols(prev => prev.map(x => x.key === c.key ? { ...x, on: e.target.checked } : x))} />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <form onSubmit={async e => { e.preventDefault(); await fetch('/api/desk/logout', { method: 'POST' }); router.replace('/desk/login') }}>
            <button className={styles.btn} type="submit">Sign out</button>
          </form>
        </div>
      </header>

      <div className={styles.filters}>
        {QUICK.map(f => (
          <button key={f.id} className={`${styles.chip} ${quick === f.id ? styles.chipOn : ''}`}
            aria-pressed={quick === f.id} onClick={() => { setQuick(f.id); setSel(new Set()) }}>
            {f.label}<span className={`${styles.ct} ${styles.mono}`}>{rows.filter(f.fn).length}</span>
          </button>
        ))}
        <span className={styles.sep} />
        <input className={styles.search} type="search" value={query}
          onChange={e => setQuery(e.target.value)} placeholder="Search anything…" />
        <span style={{ marginLeft: 'auto' }} />
        <button className={styles.btn} disabled={busy} onClick={() => exportXlsx('internal')}>
          Export {sel.size ? `${sel.size} ` : ''}to Excel
        </button>
        <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy} onClick={() => exportXlsx('shareable')}>
          Export shareable
        </button>
      </div>

      {(activeFilterKeys.length > 0 || dateFrom || dateTo) && (
        <div className={styles.activeBar}>
          <span>Filters:</span>
          {activeFilterKeys.map(k => (
            <span key={k} className={styles.fTag}>
              {liveCols.find(c => c.key === k)?.label}: {colFilters[k].length}
              <button onClick={() => setColFilters(p => ({ ...p, [k]: [] }))} aria-label="Clear">×</button>
            </span>
          ))}
          {(dateFrom || dateTo) && (
            <span className={styles.fTag}>
              Received {dateFrom || '…'} → {dateTo || '…'}
              <button onClick={() => { setDateFrom(''); setDateTo('') }} aria-label="Clear">×</button>
            </span>
          )}
          <button className={styles.btn} style={{ padding: '2px 9px' }}
            onClick={() => { setColFilters({}); setDateFrom(''); setDateTo('') }}>Clear all</button>
        </div>
      )}

      {sel.size > 0 && (
        <div className={styles.bulk}>
          <b className={styles.mono}>{sel.size}</b><span>selected</span>
          <div className={styles.bulkRight}>
            <label htmlFor="logAs" style={{ fontSize: 11.5 }}>log as</label>
            <select id="logAs" className={styles.logSel} value={logAs}
              onChange={e => setLogAs(e.target.value as 'researched' | 'contacted')}>
              <option value="researched">researched (9mo)</option>
              <option value="contacted">contacted (6mo)</option>
            </select>
            <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy} onClick={() => applyState('done')}>
              {busy ? 'Saving…' : 'Mark done'}
            </button>
            <button className={styles.btn} disabled={busy} onClick={() => applyState('in_progress')}>Mark working</button>
            <button className={styles.btn} disabled={busy} onClick={() => applyState('to_do')}>Mark to do</button>
            <button className={styles.btn} onClick={() => setSel(new Set())}>Clear</button>
          </div>
        </div>
      )}

      <div className={styles.gridWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {visible.map(c => c.key === 'check' ? (
                <th key="check" className={c.sticky}>
                  <input type="checkbox" checked={allShown} onChange={e => {
                    const next = new Set(sel)
                    list.forEach(r => e.target.checked ? next.add(r.id) : next.delete(r.id))
                    setSel(next)
                  }} />
                </th>
              ) : (
                <th key={c.key} className={c.sticky}>
                  <span className={`${styles.thInner} ${(colFilters[c.key]?.length || (c.key === 'date_received' && (dateFrom || dateTo))) ? styles.thActive : ''}`}>
                    <button type="button" className={styles.thLabel} onClick={e => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      setPopPos({ left: Math.min(rect.left, window.innerWidth - 250), top: rect.bottom + 4 })
                      setOpenFilter(openFilter === c.key ? null : c.key)
                    }}>{c.label}</button>
                    <span className={styles.thCaret}>▼</span>
                    {sortKey === c.key && <span className={styles.arrow}>{sortDir < 0 ? '↓' : '↑'}</span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td className={styles.empty} colSpan={visible.length}>
                {rows.length === 0
                  ? 'No leads yet. Forward some to the leads inbox and run /process-leads.'
                  : 'Nothing matches these filters.'}
              </td></tr>
            ) : list.map(r => (
              <tr key={r.id}
                className={`${sel.has(r.id) ? styles.rowSel : ''} ${r.work_state === 'done' ? styles.rowDone : ''}`}
                onClick={() => openDrawer(r)}>
                {visible.map(c => c.key === 'check' ? (
                  <td key="check" className={c.sticky} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={sel.has(r.id)} onChange={e => {
                      const next = new Set(sel)
                      if (e.target.checked) next.add(r.id); else next.delete(r.id)
                      setSel(next)
                    }} />
                  </td>
                ) : (
                  <td key={c.key} className={c.sticky} title={c.val(r)}>{c.render ? c.render(r) : dash(c.val(r))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.statusBar}>
        <span>{list.length} of {rows.length} rows · {visible.length - 1} columns{sel.size ? ` · ${sel.size} selected` : ''}</span>
        <span>sorted by {liveCols.find(c => c.key === sortKey)?.label ?? sortKey} {sortDir < 0 ? 'desc' : 'asc'}</span>
        {err && <span className={styles.err}>{err}</span>}
        <span className={styles.statusRight}>danny-lead-crm</span>
      </div>

      {openFilter && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 65 }} onClick={() => setOpenFilter(null)} role="presentation" />
          <ColumnFilter
            colKey={openFilter}
            label={liveCols.find(c => c.key === openFilter)?.label ?? ''}
            kind={liveCols.find(c => c.key === openFilter)?.kind ?? 'text'}
            pos={popPos}
            values={distinctFor(openFilter)}
            selected={colFilters[openFilter] ?? []}
            dateFrom={dateFrom} dateTo={dateTo}
            onDate={(f, t) => { setDateFrom(f); setDateTo(t) }}
            onChange={vals => setColFilters(p => ({ ...p, [openFilter]: vals }))}
            onSort={dir => { setSortKey(openFilter); setSortDir(dir); setOpenFilter(null) }}
            onClose={() => setOpenFilter(null)}
          />
        </>
      )}

      {openRow && (
        <Drawer row={openRow} log={log} onClose={() => setOpenRow(null)} onSaved={() => router.refresh()} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Excel-style column filter                                           */
/* ------------------------------------------------------------------ */

function ColumnFilter(props: {
  colKey: string; label: string; kind: Kind
  pos: { left: number; top: number }
  values: [string, number][]
  selected: string[]
  dateFrom: string; dateTo: string
  onDate: (from: string, to: string) => void
  onChange: (vals: string[]) => void
  onSort: (dir: 1 | -1) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const shown = props.values.filter(([v]) => v.toLowerCase().includes(search.toLowerCase()))
  const all = props.selected.length === 0
  const isOn = (v: string) => all || props.selected.includes(v)

  function toggle(v: string) {
    const current = all ? props.values.map(x => x[0]) : props.selected
    const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
    props.onChange(next.length === props.values.length ? [] : next)
  }

  return (
    <div className={styles.fPop} style={{ left: props.pos.left, top: props.pos.top }}>
      <div className={styles.fSort}>
        <button onClick={() => props.onSort(1)}>Sort A→Z</button>
        <button onClick={() => props.onSort(-1)}>Sort Z→A</button>
      </div>

      {props.kind === 'date' ? (
        <div className={styles.fDate}>
          <div className={styles.fPresets}>
            {[['7d', 7], ['30d', 30], ['90d', 90]].map(([lbl, days]) => (
              <button key={lbl as string} onClick={() => {
                const d = new Date(); d.setDate(d.getDate() - (days as number))
                props.onDate(d.toISOString().slice(0, 10), '')
              }}>Last {lbl}</button>
            ))}
            <button onClick={() => props.onDate('', '')}>Any</button>
          </div>
          <label htmlFor="dfrom">From</label>
          <input id="dfrom" type="date" value={props.dateFrom} onChange={e => props.onDate(e.target.value, props.dateTo)} />
          <label htmlFor="dto">To</label>
          <input id="dto" type="date" value={props.dateTo} onChange={e => props.onDate(props.dateFrom, e.target.value)} />
        </div>
      ) : (
        <>
          <input className={styles.fSearch} placeholder={`Search ${props.label.toLowerCase()}…`}
            value={search} onChange={e => setSearch(e.target.value)} />
          <div className={styles.fList}>
            <label className={styles.fItem} aria-label="Select all values">
              <input type="checkbox" checked={all} onChange={() => props.onChange([])} />
              <span><b>(Select all)</b></span>
            </label>
            {shown.map(([v, n]) => (
              <label key={v || '__blank'} className={styles.fItem} title={v || '(blank)'}>
                <input type="checkbox" checked={isOn(v)} onChange={() => toggle(v)} />
                <span>{v === '' ? <i>(blank)</i> : v}</span>
                <span className={styles.fCount}>{n}</span>
              </label>
            ))}
            {shown.length === 0 && <div className={styles.soft} style={{ padding: '6px 5px' }}>No values</div>}
          </div>
        </>
      )}

      <div className={styles.fFoot}>
        <button onClick={() => { props.onChange([]); if (props.kind === 'date') props.onDate('', '') }}>Clear</button>
        <button onClick={props.onClose}>Done</button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Detail drawer                                                       */
/* ------------------------------------------------------------------ */

function Drawer({ row, log, onClose, onSaved }: {
  row: DeskRow; log: ContactLogEntry[] | null; onClose: () => void; onSaved: () => void
}) {
  const [notes, setNotes] = useState(row.notes ?? '')
  const [firmNotes, setFirmNotes] = useState(row.firm_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string>('')
  const dirty = notes !== (row.notes ?? '') || firmNotes !== (row.firm_notes ?? '')
  const first = useRef(true)

  useEffect(() => {
    setNotes(row.notes ?? ''); setFirmNotes(row.firm_notes ?? ''); setSavedAt(''); first.current = true
  }, [row.id, row.notes, row.firm_notes])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/desk/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: row.id, notes, firmNotes }),
      })
      if (res.ok) { setSavedAt(new Date().toLocaleTimeString()); onSaved() }
    } finally { setSaving(false) }
  }

  const shareLabel = SHARE_LABEL[row.share_ok]?.[1] ?? row.share_ok

  return (
    <>
      <div className={styles.scrim} role="presentation" onClick={onClose} />
      <aside className={styles.draw}>
        <button className={styles.drawX} onClick={onClose} aria-label="Close">×</button>
        <div className={`${styles.mono} ${styles.soft}`}>{row.lead_ref}</div>
        <h2 className={styles.drawH}>{row.full_name}</h2>
        <div className={styles.drawSub}>{row.title ?? '—'} · {row.firm_name}</div>

        {row.hold_note && <div className={`${styles.box} ${styles.boxFlag}`}><b>Handling</b>{row.hold_note}</div>}
        {row.blocker && <div className={`${styles.box} ${styles.boxNote}`}><b>Blocker</b>{row.blocker}</div>}

        <div className={styles.drawSection}>Person</div>
        <dl className={styles.kv}>
          <dt>Email</dt><dd className={styles.mono}>{row.email} <span className={styles.soft}>({row.email_confidence ?? '?'} · {row.email_type ?? '?'})</span></dd>
          <dt>Phone</dt><dd className={styles.mono}>{row.phone ?? '—'}</dd>
          <dt>LinkedIn</dt><dd>{row.linkedin
            ? <a className={`${styles.lnk} ${styles.mono}`} target="_blank" rel="noreferrer noopener"
                 href={row.linkedin.startsWith('http') ? row.linkedin : `https://www.linkedin.com/${row.linkedin.replace(/^\/+/, '')}`}>{row.linkedin}</a>
            : '—'}{row.linkedin_verified ? <span className={`${styles.tag} ${styles.tagOk}`} style={{ marginLeft: 6 }}>verified</span> : null}</dd>
          <dt>Role</dt><dd>{row.role_class ?? '—'}</dd>
          <dt>Based</dt><dd>{row.person_location ?? '—'}</dd>
        </dl>

        <div className={styles.drawSection}>Firm</div>
        <dl className={styles.kv}>
          <dt>Company</dt><dd>{row.firm_name}</dd>
          <dt>Domain</dt><dd className={styles.mono}>{row.domain ?? '—'}</dd>
          <dt>Based</dt><dd>{row.firm_location ?? '—'}{row.firm_country ? ` · ${row.firm_country}` : ''}</dd>
          <dt>Type</dt><dd>{row.firm_type ?? '—'}</dd>
          <dt>Strategy</dt><dd>{row.strategy ?? '—'}</dd>
          <dt>Target</dt><dd>{row.target_raise ?? '—'}</dd>
          <dt>Fund status</dt><dd>{row.status}</dd>
        </dl>

        <div className={styles.drawSection}>Provenance</div>
        <dl className={styles.kv}>
          <dt>Source</dt><dd>{[row.source_name, row.source_org].filter(Boolean).join(' · ') || '—'}</dd>
          <dt>Channel</dt><dd>{row.source_type ?? '—'}</dd>
          <dt>Received</dt><dd className={styles.mono}>{(row.date_received ?? row.created_at).slice(0, 10)}</dd>
          <dt>Share</dt><dd>{shareLabel}{row.share_ok_reason ? <span className={styles.soft}> — {row.share_ok_reason}</span> : null}</dd>
          <dt>Touches</dt><dd className={styles.mono}>{row.touch_count}</dd>
        </dl>

        {row.research_summary && (
          <div className={`${styles.box} ${styles.boxNote}`}><b>Research</b>{row.research_summary}</div>
        )}

        <div className={styles.drawSection}>Notes on this person — internal, never exported</div>
        <textarea className={styles.noteArea} value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Angle, timing, who to mention, what not to mention…" />

        <div className={styles.drawSection} style={{ marginTop: 14 }}>Notes on the firm</div>
        <textarea className={styles.noteArea} value={firmNotes} onChange={e => setFirmNotes(e.target.value)}
          placeholder="High-level context on the firm — incumbent providers, structure, history…" />

        <div className={styles.noteRow}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={!dirty || saving} onClick={save}>
            {saving ? 'Saving…' : 'Save notes'}
          </button>
          {dirty && !saving && <span className={styles.dirty}>unsaved</span>}
          {!dirty && savedAt && <span className={styles.saved}>saved {savedAt}</span>}
        </div>

        <div className={styles.drawSection}>Contact log</div>
        {log === null ? <p className={styles.soft} style={{ fontSize: 12.5 }}>Loading…</p>
          : log.length === 0 ? <p className={styles.soft} style={{ fontSize: 12.5 }}>No entries yet.</p>
          : (
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
  )
}
