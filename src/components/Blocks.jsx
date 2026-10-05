import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MOODS } from '../lib/constants'
import { addDays, fmtDate, mondayOf, parseDate } from '../lib/dates'
import { blankRow } from '../lib/pageTypes'

const LINE = 30
const num = (v) => parseFloat(String(v ?? '').replace(/,/g, '')) || 0
const money = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 })
const NOTE_COLORS = ['#f6e58d', '#ffd0dc', '#cdeccf', '#cfe0ff', '#e8d9fb']
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

/* ---------- shared bits ---------- */
export function Box({ title, className = '', children }) {
  return (
    <section className={`box ${className}`}>
      {title && <h3 className="box-title">{title}</h3>}
      {children}
    </section>
  )
}

// a textarea that grows with its text
function AutoText({ value, onChange, rows = 4, placeholder, className = 'lined', max = 20000, label }) {
  const ref = useRef(null)
  const fit = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, rows * LINE)}px`
  }
  useLayoutEffect(fit, [value, rows]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = ref.current
    let w = el.offsetWidth
    const ro = new ResizeObserver(() => { if (el.offsetWidth !== w) { w = el.offsetWidth; fit() } })
    ro.observe(el)
    return () => ro.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <textarea ref={ref} className={className} rows={rows} value={value} placeholder={placeholder}
      maxLength={max} aria-label={label} onChange={(e) => onChange(e.target.value)} />
  )
}

/* ---------- tools ---------- */
function MoodTool({ value, onChange }) {
  return (
    <div className="mood-inline" role="radiogroup" aria-label="Mood">
      {MOODS.map((m) => (
        <button type="button" key={m.id} role="radio" aria-checked={value === m.id} title={m.label} aria-label={m.label}
          className={`mood sm ${value === m.id ? 'on' : ''}`} style={{ '--mood': m.color }}
          onClick={() => onChange(value === m.id ? '' : m.id)}>
          <span aria-hidden="true">{m.emoji}</span>
        </button>
      ))}
    </div>
  )
}

function LinesTool({ value, onChange, numbered }) {
  return (
    <ol className={`lines ${numbered ? 'numbered' : ''}`}>
      {value.map((v, i) => (
        <li key={i}>
          <input className="line-input" value={v} maxLength={200} aria-label={`Line ${i + 1}`}
            onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
        </li>
      ))}
    </ol>
  )
}

function ChecklistTool({ value, onChange }) {
  const refs = useRef([])
  const [focusIdx, setFocusIdx] = useState(null)
  useEffect(() => {
    if (focusIdx !== null) { refs.current[focusIdx]?.focus(); setFocusIdx(null) }
  }, [focusIdx, value.length])

  const set = (i, patch) => onChange(value.map((it, j) => (j === i ? { ...it, ...patch } : it)))
  const add = (at = value.length) => {
    if (value.length >= 100) return
    const next = [...value]
    next.splice(at, 0, { t: '', d: false })
    onChange(next)
    setFocusIdx(at)
  }
  const remove = (i) => onChange(value.length > 1 ? value.filter((_, j) => j !== i) : [{ t: '', d: false }])
  const done = value.filter((x) => x.d).length

  return (
    <div className="check">
      <ul>
        {value.map((it, i) => (
          <li key={i} className={it.d ? 'done' : ''}>
            <input type="checkbox" className="cb" checked={it.d} onChange={(e) => set(i, { d: e.target.checked })} aria-label={`Done: ${it.t || `item ${i + 1}`}`} />
            <input ref={(el) => { refs.current[i] = el }} className="line-input" value={it.t} maxLength={200} aria-label={`Item ${i + 1}`}
              onChange={(e) => set(i, { t: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); add(i + 1) }
                if (e.key === 'Backspace' && it.t === '' && value.length > 1) { e.preventDefault(); remove(i); setFocusIdx(Math.max(0, i - 1)) }
              }} />
            <button type="button" className="x" onClick={() => remove(i)} aria-label="Remove item">×</button>
          </li>
        ))}
      </ul>
      <div className="box-foot">
        <button type="button" className="add" onClick={() => add()}>＋ Add item</button>
        <span className="hint">{done}/{value.length} done</span>
      </div>
    </div>
  )
}

function TableTool({ spec, value, onChange }) {
  const { cols } = spec
  const setCell = (r, c, v) => onChange(value.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)))
  const addRow = () => { if (value.length < 200) onChange([...value, blankRow(cols)]) }
  const removeRow = (r) => onChange(value.length > 1 ? value.filter((_, i) => i !== r) : [blankRow(cols)])

  let progress = null
  if (spec.progress !== undefined) {
    const used = value.filter((row) => row.some((v, ci) => cols[ci].type !== 'check' && String(v).trim()))
    const done = used.filter((row) => row[spec.progress]).length
    if (used.length) progress = { done, total: used.length, pct: Math.round((done / used.length) * 100) }
  }

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {cols.map((c, ci) => <th key={ci} style={{ width: c.w }} scope="col">{c.label}</th>)}
            <th className="tbl-x" />
          </tr>
        </thead>
        <tbody>
          {value.map((row, r) => (
            <tr key={r}>
              {cols.map((c, ci) => (
                <td key={ci}>
                  {c.type === 'check' ? (
                    <input type="checkbox" className="cb" checked={!!row[ci]} onChange={(e) => setCell(r, ci, e.target.checked)} aria-label={`${c.label}, row ${r + 1}`} />
                  ) : (
                    <input className={`cell ${c.type === 'number' ? 'num' : ''}`} inputMode={c.type === 'number' ? 'decimal' : undefined}
                      value={row[ci] ?? ''} maxLength={c.type === 'number' ? 14 : 200} aria-label={`${c.label}, row ${r + 1}`}
                      onChange={(e) => setCell(r, ci, e.target.value)} />
                  )}
                </td>
              ))}
              <td className="tbl-x">
                {spec.addRow && <button type="button" className="x" onClick={() => removeRow(r)} aria-label={`Remove row ${r + 1}`}>×</button>}
              </td>
            </tr>
          ))}
        </tbody>
        {spec.totals && (
          <tfoot>
            <tr>
              {cols.map((c, ci) => (
                <td key={ci} className={c.type === 'number' ? 'num total' : 'total'}>
                  {ci === 0 ? 'Total' : c.type === 'number' ? money(value.reduce((s, row) => s + num(row[ci]), 0)) : ''}
                </td>
              ))}
              <td />
            </tr>
          </tfoot>
        )}
      </table>
      {(spec.addRow || progress) && (
        <div className="box-foot">
          {spec.addRow ? <button type="button" className="add" onClick={addRow}>＋ Add row</button> : <span />}
          {progress && (
            <span className="progress" title={`${progress.done} of ${progress.total} done`}>
              <span className="bar"><i style={{ width: `${progress.pct}%` }} /></span>
              {progress.done}/{progress.total} done
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function StickyTool({ spec, value, onChange }) {
  return (
    <div className="sticky-pad" style={{ '--sticky': spec.color }}>
      <AutoText className="sticky-text" rows={spec.rows || 4} value={value} onChange={onChange} label={spec.title} />
    </div>
  )
}

function StickiesTool({ value, onChange }) {
  const set = (i, patch) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  return (
    <div className="stickies">
      {value.map((s, i) => (
        <div key={i} className="sticky-pad small" style={{ '--sticky': NOTE_COLORS[s.c % NOTE_COLORS.length] }}>
          <AutoText className="sticky-text" rows={4} value={s.t} onChange={(t) => set(i, { t })} label={`Idea ${i + 1}`} max={1000} />
          <div className="sticky-tools">
            <button type="button" onClick={() => set(i, { c: (s.c + 1) % NOTE_COLORS.length })} aria-label="Change colour" title="Change colour">🎨</button>
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Delete note" title="Delete">×</button>
          </div>
        </div>
      ))}
      {value.length < 40 && (
        <button type="button" className="sticky-add" onClick={() => onChange([...value, { t: '', c: value.length % NOTE_COLORS.length }])}>＋ New sticky</button>
      )}
    </div>
  )
}

function HabitsTool({ spec, value, onChange }) {
  const labels = spec.labels || Array.from({ length: spec.days }, (_, i) => String(i + 1))
  const toggle = (r, d) => onChange(value.map((row, i) => (i === r ? { ...row, d: row.d.map((x, j) => (j === d ? !x : x)) } : row)))
  const rename = (r, n) => onChange(value.map((row, i) => (i === r ? { ...row, n } : row)))
  return (
    <div className="tbl-wrap">
      <table className="habits">
        <thead>
          <tr>
            <th scope="col" className="hname">Habit</th>
            {labels.map((l, i) => <th key={i} scope="col">{l}</th>)}
            <th scope="col">✓</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {value.map((row, r) => (
            <tr key={r}>
              <td className="hname"><input className="cell" value={row.n} maxLength={60} aria-label={`Habit ${r + 1}`} onChange={(e) => rename(r, e.target.value)} /></td>
              {labels.map((l, d) => (
                <td key={d}>
                  <button type="button" className={`dot ${row.d[d] ? 'on' : ''}`} aria-pressed={!!row.d[d]} aria-label={`${row.n || 'Habit'}, day ${l}`} onClick={() => toggle(r, d)} />
                </td>
              ))}
              <td className="count">{row.d.filter(Boolean).length}/{spec.days}</td>
              <td><button type="button" className="x" onClick={() => onChange(value.filter((_, i) => i !== r))} aria-label="Remove habit">×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="box-foot">
        <button type="button" className="add" onClick={() => value.length < 30 && onChange([...value, { n: '', d: Array(spec.days).fill(false) }])}>＋ Add habit</button>
      </div>
    </div>
  )
}

function CounterTool({ spec, value, onChange }) {
  return (
    <div className="counter">
      <div className="cups">
        {Array.from({ length: spec.max }).map((_, i) => (
          <button key={i} type="button" className={`cup ${i < value ? 'on' : ''}`} aria-pressed={i < value} aria-label={`${i + 1} of ${spec.max}`}
            onClick={() => onChange(value === i + 1 ? i : i + 1)}>{spec.icon}</button>
        ))}
      </div>
      <span className="hint">{value}/{spec.max}</span>
    </div>
  )
}

function SelectTool({ spec, value, onChange }) {
  return (
    <select className="nb-select full" value={value} onChange={(e) => onChange(e.target.value)} aria-label={spec.title}>
      {spec.options.map((o) => <option key={o}>{o}</option>)}
    </select>
  )
}

function WeekGridTool({ value, onChange, pageDate }) {
  const monday = mondayOf(pageDate)
  return (
    <div className="weekgrid">
      {DAYS.map((d, i) => {
        const dt = addDays(monday, i)
        return (
          <div className="wk-row" key={d}>
            <div className="wk-label"><b>{d}</b><span>{dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
            <AutoText className="lined" rows={2} value={value[i] ?? ''} label={`${d} plans`} max={2000}
              onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
          </div>
        )
      })}
    </div>
  )
}

function MonthGridTool({ value, onChange, pageDate }) {
  const d = parseDate(pageDate)
  const y = d.getFullYear()
  const m = d.getMonth()
  const lead = new Date(y, m, 1).getDay()
  const count = new Date(y, m + 1, 0).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)
  const keyOf = (n) => fmtDate(new Date(y, m, n))
  const setDay = (n, v) => {
    const next = { ...value }
    if (v) next[keyOf(n)] = v
    else delete next[keyOf(n)]
    onChange(next)
  }
  return (
    <div className="month">
      <div className="month-title">{d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
      <div className="month-scroll">
        <div className="month-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((h) => <div className="mh" key={h}>{h}</div>)}
          {cells.map((n, i) => n ? (
            <label key={i} className="mc">
              <span className="mn">{n}</span>
              <textarea value={value[keyOf(n)] || ''} maxLength={300} aria-label={`Notes for day ${n}`} onChange={(e) => setDay(n, e.target.value)} />
            </label>
          ) : <div key={i} className="mc empty" />)}
        </div>
      </div>
    </div>
  )
}

function SummaryTool({ data }) {
  const sum = (id, col) => (data[id] || []).reduce((s, r) => s + num(r[col]), 0)
  const income = sum('income', 1)
  const planned = sum('expenses', 1)
  const spent = sum('expenses', 2)
  const left = income - spent
  const tiles = [['Income', income], ['Planned', planned], ['Spent', spent], ['Left', left]]
  return (
    <div className="tiles">
      {tiles.map(([label, v]) => (
        <div key={label} className={`tile ${label === 'Left' && v < 0 ? 'neg' : ''}`}>
          <span>{label}</span><b>{money(v)}</b>
        </div>
      ))}
    </div>
  )
}

/* ---------- render one block ---------- */
export function renderBlock(spec, { data, setBlock, pageDate }) {
  const v = data[spec.id]
  const set = (val) => setBlock(spec.id, val)
  let body = null
  let cls = `box-${spec.kind}`
  switch (spec.kind) {
    case 'mood': body = <MoodTool value={v} onChange={set} />; if (spec.at === 'top') cls += ' inline'; break
    case 'text': body = <AutoText rows={spec.rows} value={v} onChange={set} placeholder={spec.placeholder} label={spec.title} />; break
    case 'lines': body = <LinesTool value={v} onChange={set} numbered={spec.numbered} />; break
    case 'checklist': body = <ChecklistTool value={v} onChange={set} />; break
    case 'table': body = <TableTool spec={spec} value={v} onChange={set} />; break
    case 'sticky': body = <StickyTool spec={spec} value={v} onChange={set} />; break
    case 'stickies': body = <StickiesTool value={v} onChange={set} />; break
    case 'habits': body = <HabitsTool spec={spec} value={v} onChange={set} />; break
    case 'counter': body = <CounterTool spec={spec} value={v} onChange={set} />; break
    case 'select': body = <SelectTool spec={spec} value={v} onChange={set} />; break
    case 'weekgrid': body = <WeekGridTool value={v} onChange={set} pageDate={pageDate} />; break
    case 'monthgrid': body = <MonthGridTool value={v} onChange={set} pageDate={pageDate} />; break
    case 'summary': body = <SummaryTool data={data} />; break
    default: return null
  }
  return <Box key={spec.id} title={spec.title} className={cls}>{body}</Box>
}
