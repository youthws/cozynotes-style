import { useLayoutEffect, useRef, useState } from 'react'
import { MOODS, formatDate, moodById } from '../lib/constants'
import { typeById } from '../lib/pageTypes'
import { Cloud, Flower, Plant, SittingMascot } from './Illustrations'

const PER_SHELF = 14

/* ---- Fixed-layout settings (tweak these) ----
   The whole home page is drawn on a canvas that is DESIGN_W px wide and is then
   scaled as ONE piece to fit the window, so it looks the same at every window size. */
const DESIGN_W = 1100      // width of the fixed canvas (card = 760px, plants/clouds sit in the sides)
const MAX_SCALE = 1.4      // how much bigger than 100% it may grow on huge screens
const FIT_HEIGHT = true    // true = shrink until the whole page fits without scrolling
const MIN_H_SCALE = 0.7    // (only if FIT_HEIGHT) never shrink below this because of height
const CHROME_H = 206       // (only if FIT_HEIGHT) space kept for the top bar + bottom dock
const DESKTOP = '(min-width: 700px)'   // below this width phones use the normal mobile layout

function useFit(canvasRef) {
  const [fit, setFit] = useState(() => ({ desktop: window.matchMedia(DESKTOP).matches, scale: 1, h: 0 }))

  useLayoutEffect(() => {
    const el = canvasRef.current
    const update = () => {
      const desktop = window.matchMedia(DESKTOP).matches
      if (!desktop) {
        setFit((f) => (!f.desktop ? f : { desktop: false, scale: 1, h: 0 }))
        return
      }
      const naturalH = el.offsetHeight            // unaffected by the scale transform
      if (!naturalH) return
      const root = document.documentElement
      let scale = (root.clientWidth - 24) / DESIGN_W
      if (FIT_HEIGHT) scale = Math.min(scale, Math.max((root.clientHeight - CHROME_H) / naturalH, MIN_H_SCALE))
      scale = Math.min(scale, MAX_SCALE)
      setFit((f) => (f.desktop && Math.abs(f.scale - scale) < 0.001 && f.h === naturalH ? f : { desktop: true, scale, h: naturalH }))
    }
    update()
    window.addEventListener('resize', update)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => { window.removeEventListener('resize', update); ro.disconnect() }
  }, [canvasRef])

  return fit
}

function hash(str) {
  let h = 0
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

function Book({ page, onOpen }) {
  const t = typeById(page.type)
  const color = page.data?.mood ? moodById(page.data.mood).color : t.color
  const h = hash(page.id)
  const label = page.title || t.name
  return (
    <button
      className={`book ${h % 11 === 0 ? 'lean' : ''}`}
      style={{ '--c': color, height: 96 + (h % 5) * 9 }}
      onClick={() => onOpen(page)}
      aria-label={`${label}, ${formatDate(page.created_at)}`}
    >
      <span className="tip">{t.emoji} {label}<small>{formatDate(page.created_at)}</small></span>
    </button>
  )
}

const Ghosts = ({ n }) => Array.from({ length: n }).map((_, i) => (
  <i key={i} className="book ghost" style={{ height: 92 + ((i * 7) % 5) * 9 }} aria-hidden="true" />
))

export default function Home({ profile, pages: entries, rewards, owned, streak, onNav, onQuickMood, onOpen }) {
  const shown = entries.slice(0, PER_SHELF * 2)
  const shelf1 = shown.slice(0, PER_SHELF)
  const shelf2 = shown.slice(PER_SHELF)
  const decor = rewards.filter((r) => r.kind === 'decor' && owned.includes(r.id))
  const latest = entries[0]
  const canvasRef = useRef(null)
  const fit = useFit(canvasRef)
  const fixed = fit.desktop

  return (
    <div className="home">
      <div className={`home-fit ${fixed ? 'on' : ''}`} style={fixed ? { width: DESIGN_W * fit.scale, height: fit.h * fit.scale } : undefined}>
      <div ref={canvasRef} className={`home-canvas ${fixed ? 'on' : ''}`} style={fixed ? { width: DESIGN_W, transform: `scale(${fit.scale})` } : undefined}>
      <Cloud className="home-cloud-a" />
      <Cloud className="home-cloud-b" />
      <Plant className="home-plant" />
      <Flower className="home-flower" />

      <section className="home-card clay">
        <nav className="home-nav" aria-label="Quick links">
          <button onClick={() => onNav('desk')}>Notebook <span aria-hidden="true">📓</span></button>
          <button onClick={() => onNav('journal')}>Journal <span aria-hidden="true">📖</span></button>
          <button onClick={() => onNav('shop')}>Shop <span aria-hidden="true">🛍️</span></button>
        </nav>

        <div className="home-hero">
          <span className="heart-big" aria-hidden="true">♥</span>
          <h1 className="home-title"><span className="sparks" aria-hidden="true" />Hi, {profile.display_name}<span className="sparks flip" aria-hidden="true" /></h1>
          <p className="home-sub">Stories, moods, and cozy little days</p>
        </div>

        <div className="shelves">
          <div className="float-chips">
            {latest
              ? <button className="float-chip" onClick={() => onOpen(latest)}>Latest: {latest.title || typeById(latest.type).name}</button>
              : <button className="float-chip" onClick={() => onNav('desk')}>Write your first page</button>}
            <button className="float-chip" onClick={() => onNav('desk')}>🔥 {streak}-day streak</button>
            <button className="float-chip" onClick={() => onNav('shop')}>🪙 {profile.coins} coins to spend</button>
          </div>

          <div className="shelf-block">
            <SittingMascot className="home-mascot" />
            <div className="books">
              {shelf1.map((e) => <Book key={e.id} page={e} onOpen={onOpen} />)}
              <Ghosts n={Math.max(0, 7 - shelf1.length)} />
            </div>
            <div className="plank" />
          </div>

          <div className="shelf-block">
            <div className="books">
              {shelf2.map((e) => <Book key={e.id} page={e} onOpen={onOpen} />)}
              {shelf2.length === 0 && <Ghosts n={5} />}
              {decor.map((r) => <span key={r.id} className="decor-item" title={r.name}>{r.emoji}</span>)}
            </div>
            <div className="plank" />
          </div>

          <p className="shelf-note">
            {entries.length === 0
              ? 'Every page you write in your notebook becomes a book on this shelf.'
              : entries.length > PER_SHELF * 2
                ? <>Showing your newest {PER_SHELF * 2} books. <button className="link" onClick={() => onNav('journal')}>See all {entries.length}</button></>
                : `${entries.length} ${entries.length === 1 ? 'book' : 'books'} on your shelf. Tap one to read it.`}
          </p>
        </div>

        <footer className="home-foot">
          <p className="foot-q">How are you feeling today?</p>
          <div className="quick-moods">
            {MOODS.map((m) => (
              <button key={m.id} className="quick-mood" style={{ '--mood': m.color }} onClick={() => onQuickMood(m.id)} aria-label={`Write a ${m.label} diary page`} title={m.label}>
                <span aria-hidden="true">{m.emoji}</span>
              </button>
            ))}
          </div>
          <p className="copy">© {new Date().getFullYear()} CozyNotes</p>
        </footer>
      </section>
      </div>
      </div>

    </div>
  )
}
