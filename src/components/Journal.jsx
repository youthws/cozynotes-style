import { useMemo, useState } from 'react'
import { MOODS, moodById } from '../lib/constants'
import { PAGE_TYPES, pageSnippet, sortPages, typeById } from '../lib/pageTypes'
import { shortDate } from '../lib/dates'

export default function Journal({ pages, onOpen, onDelete, onNew }) {
  const [q, setQ] = useState('')
  const [typeF, setTypeF] = useState('all')
  const [tagF, setTagF] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  const tags = useMemo(() => {
    const count = {}
    pages.forEach((p) => (p.tags || []).forEach((t) => { count[t] = (count[t] || 0) + 1 }))
    return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t)
  }, [pages])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return sortPages(pages).filter((p) => {
      if (typeF !== 'all' && p.type !== typeF) return false
      if (tagF && !(p.tags || []).includes(tagF)) return false
      if (!needle) return true
      return p.title.toLowerCase().includes(needle) || (p.tags || []).some((t) => t.includes(needle)) || JSON.stringify(p.data).toLowerCase().includes(needle)
    })
  }, [pages, q, typeF, tagF])

  if (pages.length === 0) {
    return (
      <div className="empty clay">
        <h1>Your journal is empty</h1>
        <p>Every page you write in the notebook shows up here.</p>
        <button className="btn-main compact" onClick={() => onNew('diary')}>Start a diary page</button>
      </div>
    )
  }

  return (
    <div className="journal">
      <section className="hello"><h1>Journal</h1><p>{pages.length} {pages.length === 1 ? 'page' : 'pages'} in your notebook</p></section>

      <div className="journal-tools">
        <input className="search" type="search" placeholder="Search titles, tags and page contents" aria-label="Search pages" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="type-filters" role="group" aria-label="Filter by page type">
        <button className={`filter ${typeF === 'all' ? 'on' : ''}`} onClick={() => setTypeF('all')}>All</button>
        {PAGE_TYPES.filter((t) => pages.some((p) => p.type === t.id)).map((t) => (
          <button key={t.id} className={`filter ${typeF === t.id ? 'on' : ''}`} onClick={() => setTypeF(t.id)} title={t.name}>{t.emoji} {t.tab}</button>
        ))}
      </div>
      {tags.length > 0 && (
        <div className="type-filters" role="group" aria-label="Filter by tag">
          {tags.map((t) => <button key={t} className={`filter small ${tagF === t ? 'on' : ''}`} onClick={() => setTagF(tagF === t ? '' : t)}>#{t}</button>)}
        </div>
      )}

      {shown.length === 0 && <p className="hint center">No pages match. Try a different word or filter.</p>}

      <div className="lib-grid">
        {shown.map((p) => {
          const t = typeById(p.type)
          const mood = p.data?.mood ? moodById(p.data.mood) : null
          const snip = pageSnippet(p)
          return (
            <article key={p.id} className="lib-card clay" style={{ '--c': t.color }}>
              <header>
                <span className="lib-type">{t.emoji} {t.name}</span>
                {mood && <span title={mood.label}>{mood.emoji}</span>}
              </header>
              <h2>{p.title || 'Untitled page'}</h2>
              <time>{shortDate(p.page_date)}</time>
              {snip && <p className="snip">{snip}</p>}
              {(p.tags || []).length > 0 && <div className="lib-tags">{p.tags.map((tg) => <span key={tg} className="tag-chip static">#{tg}</span>)}</div>}
              <footer>
                {confirmId === p.id ? (
                  <>
                    <span className="hint">Delete this page?</span>
                    <button className="btn-soft danger" onClick={() => { onDelete(p.id); setConfirmId(null) }}>Yes, delete</button>
                    <button className="btn-soft" onClick={() => setConfirmId(null)}>Keep</button>
                  </>
                ) : (
                  <>
                    <button className="btn-main compact" onClick={() => onOpen(p)}>Open</button>
                    <button className="btn-soft" onClick={() => setConfirmId(p.id)}>Delete</button>
                  </>
                )}
              </footer>
            </article>
          )
        })}
      </div>
    </div>
  )
}
