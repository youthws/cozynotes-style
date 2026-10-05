import { useEffect, useMemo, useRef, useState } from 'react'
import { PAGE_TYPES, blankPage, pageFromRow, sortPages, typeById } from '../lib/pageTypes'
import { localDate } from '../lib/constants'
import { shortDate } from '../lib/dates'
import { renderBlock } from './Blocks'
import PageFooter from './PageFooter'

const STATUS = {
  saved: 'All changes saved ✓',
  dirty: 'Unsaved changes…',
  saving: 'Saving…',
  error: "Couldn't save. Retrying…",
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms))

function initialDraft(pages) {
  const today = localDate()
  const row = sortPages(pages.filter((p) => p.type === 'diary' && p.page_date === today))[0]
  return row ? pageFromRow(row) : blankPage('diary')
}

export default function Notebook({ pages, savePage, deletePage, request }) {
  const [draft, setDraft] = useState(() => initialDraft(pages))
  const [status, setStatus] = useState('saved')
  const [confirmDel, setConfirmDel] = useState(false)

  const draftRef = useRef(draft)
  draftRef.current = draft
  const dirty = useRef(false)
  const saving = useRef(false)
  const timer = useRef(null)
  const idByUid = useRef({})     // remembers ids of pages created this session
  const saveRef = useRef(null)

  const type = typeById(draft.type)

  /* ---------- saving ---------- */
  saveRef.current = async function save() {
    clearTimeout(timer.current)
    if (!dirty.current) return
    if (saving.current) { timer.current = setTimeout(() => saveRef.current(), 600); return }
    const snap = { ...draftRef.current }
    if (!snap.id && idByUid.current[snap.uid]) snap.id = idByUid.current[snap.uid]
    saving.current = true
    dirty.current = false
    setStatus('saving')
    const row = await savePage(snap)
    saving.current = false
    if (!row) {
      dirty.current = true
      setStatus('error')
      timer.current = setTimeout(() => saveRef.current(), 5000)
      return
    }
    idByUid.current[snap.uid] = row.id
    setDraft((d) => (d.uid === snap.uid && !d.id ? { ...d, id: row.id } : d))
    setStatus(dirty.current ? 'dirty' : 'saved')
  }

  async function flush() {
    clearTimeout(timer.current)
    while (saving.current) await pause(100)
    if (dirty.current) await saveRef.current()
    while (saving.current) await pause(100)
  }

  // true when it is safe to leave the current page
  async function leave() {
    await flush()
    if (dirty.current && !window.confirm('This page has changes that could not be saved. Leave anyway?')) return false
    dirty.current = false
    return true
  }

  function edit(fn) {
    setDraft(fn)
    dirty.current = true
    setStatus('dirty')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => saveRef.current(), 1500)
  }
  const setBlock = (id, value) => edit((d) => ({ ...d, data: { ...d.data, [id]: value } }))

  /* ---------- opening pages ---------- */
  async function open(row) {
    if (!(await leave())) return
    setDraft(pageFromRow(row)); setStatus('saved'); setConfirmDel(false)
  }
  async function startNew(typeId, preset) {
    if (!(await leave())) return
    setDraft(blankPage(typeId, preset)); setStatus('saved'); setConfirmDel(false)
  }
  async function switchType(typeId) {
    if (typeId === draft.type) return
    if (!(await leave())) return
    const list = sortPages(pages.filter((p) => p.type === typeId))
    const today = localDate()
    const pick = ['diary', 'daily'].includes(typeId) ? list.find((p) => p.page_date === today) : list[0]
    setDraft(pick ? pageFromRow(pick) : blankPage(typeId)); setStatus('saved'); setConfirmDel(false)
  }

  // requests from other screens (open a page, quick mood check-in)
  useEffect(() => {
    if (!request) return
    if (request.id) { const row = pages.find((p) => p.id === request.id); if (row) open(row) }
    else if (request.newType) startNew(request.newType, request.preset)
  }, [request]) // eslint-disable-line react-hooks/exhaustive-deps

  async function remove() {
    await flush()
    const id = draft.id || idByUid.current[draft.uid]
    if (id && !(await deletePage(id))) return
    dirty.current = false
    clearTimeout(timer.current)
    const rest = sortPages(pages.filter((p) => p.type === draft.type && p.id !== id))
    setDraft(rest[0] ? pageFromRow(rest[0]) : blankPage(draft.type))
    setStatus('saved'); setConfirmDel(false)
  }

  // save when leaving, warn on closing the tab with unsaved work
  useEffect(() => {
    const warn = (e) => { if (dirty.current) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
      clearTimeout(timer.current)
      if (dirty.current) saveRef.current()
    }
  }, [])

  const sameType = useMemo(() => sortPages(pages.filter((p) => p.type === draft.type)), [pages, draft.type])
  const allTags = useMemo(() => [...new Set(pages.flatMap((p) => p.tags || []))].sort(), [pages])

  const by = (at) => type.blocks.filter((b) => b.at === at)
  const ctx = { data: draft.data, setBlock, pageDate: draft.page_date }
  const left = by('left'), right = by('right')

  return (
    <div className="nb-shell" onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveRef.current() } }}>
      <div className="nb-main">
        <div className="nb-card clay" style={{ '--type': type.color }}>
          <span className="nb-heart" aria-hidden="true">♥</span>

          <div className="nb-toolbar">
            <select className="nb-select" aria-label="Pages in this section" value={draft.id || '__new'}
              onChange={(e) => { const row = pages.find((p) => p.id === e.target.value); if (row) open(row) }}>
              {!draft.id && <option value="__new">New page (not saved yet)</option>}
              {sameType.map((p) => <option key={p.id} value={p.id}>{shortDate(p.page_date)} · {p.title || type.name}</option>)}
            </select>
            <span className={`status ${status}`} role="status">{STATUS[status]}</span>
            <div className="nb-actions">
              <button type="button" data-sound="chime" className="btn-soft" onClick={() => saveRef.current()} disabled={status === 'saved' || status === 'saving'}>Save</button>
              <button type="button" className="btn-soft" onClick={() => window.print()}>Print</button>
              {confirmDel ? (
                <>
                  <button type="button" className="btn-soft danger" onClick={remove}>Yes, delete</button>
                  <button type="button" className="btn-soft" onClick={() => setConfirmDel(false)}>Keep</button>
                </>
              ) : (
                <button type="button" className="btn-soft danger" onClick={() => setConfirmDel(true)}>Delete</button>
              )}
            </div>
          </div>

          <h1 className="nb-title-pill"><span className="sparks" aria-hidden="true" />{type.emoji} {type.name}<span className="sparks flip" aria-hidden="true" /></h1>

          <div className="nb-meta">
            <label className="meta-field grow"><span>Title</span>
              <input value={draft.title} maxLength={120} placeholder={`e.g. ${type.hint}`}
                onChange={(e) => edit((d) => ({ ...d, title: e.target.value }))} /></label>
            <label className="meta-field"><span>Date</span>
              <input type="date" value={draft.page_date}
                onChange={(e) => e.target.value && edit((d) => ({ ...d, page_date: e.target.value }))} /></label>
          </div>

          <div className="nb-body">
            {by('top').map((b) => renderBlock(b, ctx))}
            {(left.length > 0 || right.length > 0) && (
              <div className="nb-cols" style={{ '--split': type.split || '1.35fr 1fr' }}>
                <div className="nb-col">{left.map((b) => renderBlock(b, ctx))}</div>
                <div className="nb-col">{right.map((b) => renderBlock(b, ctx))}</div>
              </div>
            )}
            {by('bottom').map((b) => renderBlock(b, ctx))}
          </div>

          <PageFooter tags={draft.tags} photos={draft.data.photos || []} allTags={allTags}
            onTags={(tags) => edit((d) => ({ ...d, tags }))}
            onPhotos={(p) => setBlock('photos', p)} />
        </div>

        <div className="nb-add-row">
          <button type="button" className="nb-add" onClick={() => startNew(draft.type)}>＋ Add another page</button>
        </div>
      </div>

      <div className="nb-tabs-wrap">
        <div className="nb-tabs" role="tablist" aria-label="Notebook sections">
          {PAGE_TYPES.map((t) => (
            <button key={t.id} role="tab" aria-selected={t.id === draft.type} className={`nb-tab ${t.id === draft.type ? 'on' : ''}`}
              style={{ '--tab': t.color }} onClick={() => switchType(t.id)} title={t.name}>{t.tab}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
