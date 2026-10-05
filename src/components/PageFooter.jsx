import { useRef, useState } from 'react'

const MAX_PHOTOS = 3

async function compress(file, maxSide = 720, quality = 0.62) {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close?.()
  return c.toDataURL('image/jpeg', quality)
}

export default function PageFooter({ tags, photos, allTags, onTags, onPhotos }) {
  const [text, setText] = useState('')
  const [big, setBig] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef(null)

  function addTag(raw) {
    const t = raw.trim().toLowerCase().replace(/^#+/, '').slice(0, 30)
    if (t && !tags.includes(t) && tags.length < 12) onTags([...tags, t])
    setText('')
  }

  async function pick(e) {
    const files = [...e.target.files]
    e.target.value = ''
    setErr('')
    const room = MAX_PHOTOS - photos.length
    if (room <= 0) return setErr(`Up to ${MAX_PHOTOS} photos per page.`)
    setBusy(true)
    try {
      const out = []
      for (const f of files.slice(0, room)) {
        if (f.type.startsWith('image/')) out.push(await compress(f))
      }
      if (out.length) onPhotos([...photos, ...out])
    } catch {
      setErr('That photo could not be read. Try a JPG or PNG.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="nb-foot">
      <div className="tags-row">
        <span className="foot-label">Tags / categories</span>
        {tags.map((t) => (
          <span key={t} className="tag-chip">#{t}<button type="button" onClick={() => onTags(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}>×</button></span>
        ))}
        {tags.length < 12 && (
          <>
            <input className="tag-input" list="all-tags" placeholder="add a tag…" value={text} maxLength={30} aria-label="Add tag"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(text) } }}
              onBlur={() => text.trim() && addTag(text)} />
            <datalist id="all-tags">{allTags.filter((t) => !tags.includes(t)).map((t) => <option key={t} value={t} />)}</datalist>
          </>
        )}
      </div>

      <div className="photos-row">
        {photos.map((src, i) => (
          <span key={i} className="thumb">
            <button type="button" onClick={() => setBig(src)} aria-label={`View photo ${i + 1}`}><img src={src} alt={`Attached photo ${i + 1}`} /></button>
            <button type="button" className="thumb-x" onClick={() => onPhotos(photos.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`}>×</button>
          </span>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button type="button" className="btn-soft" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? 'Adding…' : '📷 Add photo'}</button>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={pick} />
        {err && <span className="msg msg-error">{err}</span>}
      </div>

      {big && (
        <div className="lightbox" onClick={() => setBig(null)} role="dialog" aria-modal="true" aria-label="Photo">
          <img src={big} alt="Enlarged attachment" />
        </div>
      )}
    </div>
  )
}
