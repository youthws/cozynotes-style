/* =====================================================================
   Cute sounds, generated live with the Web Audio API (no audio files).
   - play('pop')  etc. can be called from anywhere
   - installSound() adds automatic sounds to every button, tab, tick-box,
     mood face and book on the whole site
   - the user can mute / change the volume (saved in this browser)
   ===================================================================== */
import { useSyncExternalStore } from 'react'

const KEY = 'cozynotes-sound'
const load = () => {
  try { return { on: true, vol: 0.6, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return { on: true, vol: 0.6 } }
}
let prefs = load()
const listeners = new Set()

export const getSoundPrefs = () => prefs
export const subscribeSound = (l) => { listeners.add(l); return () => listeners.delete(l) }
export const useSound = () => useSyncExternalStore(subscribeSound, getSoundPrefs)

export function setSoundPrefs(patch) {
  prefs = { ...prefs, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
  if (master) master.gain.value = prefs.vol
  listeners.forEach((l) => l())
}

/* ---------- audio plumbing ---------- */
let ctx = null
let master = null
let noiseBuf = null
let unlocked = false          // browsers only allow sound after a tap/click

function ensure() {
  if (!prefs.on || !unlocked) return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = prefs.vol
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function tone(c, { f, to, t = 0, d = 0.12, type = 'sine', g = 0.22, attack = 0.006 }) {
  const o = c.createOscillator()
  const a = c.createGain()
  const t0 = c.currentTime + t
  o.type = type
  o.frequency.setValueAtTime(f, t0)
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d)
  a.gain.setValueAtTime(0.0001, t0)
  a.gain.exponentialRampToValueAtTime(g, t0 + attack)
  a.gain.exponentialRampToValueAtTime(0.0001, t0 + d)
  o.connect(a); a.connect(master)
  o.start(t0); o.stop(t0 + d + 0.03)
}

// a soft music-box "ding": the note plus two quiet overtones
function bell(c, f, t = 0, d = 0.45, g = 0.2) {
  tone(c, { f, t, d, g })
  tone(c, { f: f * 2, t, d: d * 0.6, g: g * 0.3 })
  tone(c, { f: f * 3, t, d: d * 0.35, g: g * 0.12 })
}

// a paper "shff"
function swish(c, { t = 0, d = 0.16, f = 2200, g = 0.14 } = {}) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.3), c.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const src = c.createBufferSource(); src.buffer = noiseBuf
  const filt = c.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = f; filt.Q.value = 0.8
  const a = c.createGain()
  const t0 = c.currentTime + t
  a.gain.setValueAtTime(0.0001, t0)
  a.gain.exponentialRampToValueAtTime(g, t0 + 0.02)
  a.gain.exponentialRampToValueAtTime(0.0001, t0 + d)
  src.connect(filt); filt.connect(a); a.connect(master)
  src.start(t0); src.stop(t0 + d + 0.02)
}

const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5] // C D E G A C: always sounds happy

const SOUNDS = {
  pop:     (c) => tone(c, { f: 520, to: 840, d: 0.09, g: 0.2 }),
  tick:    (c, o) => tone(c, { f: o?.off ? 500 : 900, d: 0.06, type: 'triangle', g: 0.2 }),
  tab:     (c) => { tone(c, { f: 700, d: 0.07, g: 0.15 }); tone(c, { f: 990, t: 0.06, d: 0.09, g: 0.15 }) },
  mood:    (c, o) => bell(c, PENTA[(o?.i || 0) % PENTA.length], 0, 0.38, 0.22),
  page:    (c) => { swish(c); tone(c, { f: 300, d: 0.05, type: 'triangle', g: 0.08 }) },
  trash:   (c) => { tone(c, { f: 480, to: 170, d: 0.16, g: 0.18 }); swish(c, { d: 0.1, f: 900, g: 0.08 }) },
  chime:   (c) => { bell(c, 523.25, 0, 0.5); bell(c, 659.25, 0.1, 0.5); bell(c, 783.99, 0.2, 0.6) },
  coin:    (c) => { tone(c, { f: 988, d: 0.08, type: 'triangle', g: 0.2 }); bell(c, 1318.5, 0.07, 0.4, 0.22) },
  buy:     (c) => { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(c, f, i * 0.07, 0.35, 0.18)); bell(c, 1568, 0.32, 0.5, 0.14) },
  error:   (c) => { tone(c, { f: 330, to: 262, d: 0.18, type: 'triangle', g: 0.22 }); tone(c, { f: 262, to: 196, t: 0.16, d: 0.24, type: 'triangle', g: 0.22 }) },
  welcome: (c) => { bell(c, 784, 0, 0.5); bell(c, 1046.5, 0.12, 0.5); bell(c, 1318.5, 0.24, 0.7) },
  bye:     (c) => { bell(c, 1046.5, 0, 0.4); bell(c, 784, 0.12, 0.4); bell(c, 523.25, 0.24, 0.6) },
}

const lastPlayed = {}
export function play(name, opts) {
  const now = performance.now()
  if (now - (lastPlayed[name] || 0) < 40) return   // no machine-gun repeats
  lastPlayed[name] = now
  const c = ensure()
  if (!c || !SOUNDS[name]) return
  try { SOUNDS[name](c, opts) } catch { /* audio is a bonus, never break the app */ }
}

/* ---------- automatic sounds for the whole site ---------- */
let installed = false
export function installSound() {
  if (installed || typeof document === 'undefined') return
  installed = true

  const unlock = () => {
    unlocked = true
    ensure()
    ;['pointerdown', 'keydown', 'touchstart'].forEach((ev) => document.removeEventListener(ev, unlock, true))
  }
  ;['pointerdown', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, unlock, true))

  document.addEventListener('click', (e) => {
    const el = e.target.closest?.('button, [role="tab"], [role="radio"], input[type="checkbox"], a[href]')
    if (!el || el.disabled) return

    // any element can choose its own sound: data-sound="coin", or data-sound="none"
    const forced = el.closest('[data-sound]')?.dataset.sound
    if (forced) { if (forced !== 'none') play(forced); return }

    if (el.matches('input[type="checkbox"]')) return play('tick', { off: !el.checked })
    if (el.matches('.dot, .cup')) return play('tick', { off: el.classList.contains('on') })
    if (el.matches('.mood, .quick-mood')) return play('mood', { i: [...el.parentElement.children].indexOf(el) })
    if (el.matches('.book')) return play('page')
    if (el.matches('.dock-item, .nb-tab, .home-nav button, .filter, .pill, .float-chip')) return play('tab')
    if (el.matches('.danger, .x, .thumb-x, .tag-chip button')) return play('trash')
    play('pop')
  }, true)
}