import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { localDate } from '../lib/constants'
import { useToast } from './Toast'
import Home from './Home'
import Notebook from './Notebook'
import Journal from './Journal'
import Shop from './Shop'
import Settings from './Settings'
import { Cloud } from './Illustrations'
import SoundToggle from './SoundToggle'

const TABS = [
  { id: 'home',     emoji: '🏠', label: 'Home' },
  { id: 'desk',     emoji: '📓', label: 'Notebook' },
  { id: 'journal',  emoji: '📖', label: 'Journal' },
  { id: 'shop',     emoji: '🛍️', label: 'Shop' },
  { id: 'settings', emoji: '⚙️', label: 'Settings' },
]

// A streak only counts if you wrote today or yesterday
function liveStreak(p) {
  if (!p?.last_entry_date) return 0
  const today = localDate()
  const yesterday = localDate(new Date(Date.now() - 864e5))
  return p.last_entry_date === today || p.last_entry_date === yesterday ? p.current_streak : 0
}

export default function Dashboard({ user }) {
  const toast = useToast()
  const [tab, setTab] = useState('home')
  const [profile, setProfile] = useState(null)
  const profileRef = useRef(null)
  const [pages, setPages] = useState([])
  const [rewards, setRewards] = useState([])
  const [owned, setOwned] = useState([])
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [request, setRequest] = useState(null)
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem('cozynotes-theme') || 'lavender' } catch { return 'lavender' }
  })

  useEffect(() => { profileRef.current = profile }, [profile])

  const load = useCallback(async () => {
    const [p, e, r, o] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('pages').select('*').order('page_date', { ascending: false }).order('created_at', { ascending: false }).limit(300),
      supabase.from('rewards').select('*').order('cost'),
      supabase.from('user_rewards').select('reward_id'),
    ])
    const err = p.error || e.error || r.error || o.error
    if (err) { setLoadError(err.message); return null }
    if (!p.data) { setLoadError('Your profile is missing. Run supabase/schema.sql (including the backfill at the bottom).'); return null }
    setLoadError('')
    setProfile(p.data)
    setPages(e.data)
    setRewards(r.data)
    setOwned(o.data.map((x) => x.reward_id))
    return p.data
  }, [user.id])

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (data) setProfile(data)
    return data
  }, [user.id])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const p = await load()
      if (!alive) return
      setReady(true)
      // remember the user's timezone so streaks roll over at *their* midnight
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (p && tz && p.timezone !== tz) await supabase.from('profiles').update({ timezone: tz }).eq('id', user.id)
    })()
    return () => { alive = false }
  }, [load, user.id])

  // drop a saved theme the user no longer owns
  useEffect(() => {
    if (!ready) return
    if (theme !== 'lavender' && !owned.includes(`theme-${theme}`)) applyTheme('lavender')
  }, [ready, owned]) // eslint-disable-line react-hooks/exhaustive-deps

  function applyTheme(id) {
    setThemeState(id)
    document.documentElement.dataset.theme = id
    try { localStorage.setItem('cozynotes-theme', id) } catch { /* ignore */ }
  }

  /* ---------- pages ---------- */
  // Called by the notebook's autosave. Returns the saved row, or null on failure.
  const savePage = useCallback(async (draft) => {
    const fields = { title: draft.title, page_date: draft.page_date, tags: draft.tags, data: draft.data }
    if (draft.id) {
      const { data, error } = await supabase.from('pages').update(fields).eq('id', draft.id).select().single()
      if (error) return null
      setPages((list) => list.map((p) => (p.id === data.id ? data : p)))
      return data
    }
    const { data, error } = await supabase.from('pages').insert({ type: draft.type, ...fields }).select().single()
    if (error) return null
    setPages((list) => [data, ...list])
    const before = profileRef.current?.coins ?? 0
    const p = await refreshProfile()
    const gained = p ? p.coins - before : 0
    if (gained > 0) toast(`New page saved! +${gained} coins 🪙`, 'coin')
    return data
  }, [refreshProfile, toast])

  const deletePage = useCallback(async (id) => {
    const { error } = await supabase.from('pages').delete().eq('id', id)
    if (error) { toast('Could not delete that page.', 'error'); return false }
    setPages((list) => list.filter((p) => p.id !== id))
    toast('Page deleted')
    return true
  }, [toast])

  const openPage = (page) => { setRequest({ id: page.id, n: Date.now() }); setTab('desk') }
  const newPage = (type, preset) => { setRequest({ newType: type, preset, n: Date.now() }); setTab('desk') }

  async function buy(reward) {
    const { error } = await supabase.rpc('buy_reward', { p_reward_id: reward.id })
    if (error) return toast(error.message, 'error')
    await load()
    toast(`${reward.emoji} ${reward.name} added to your room!`)
  }

  if (loadError) {
    return (
      <div className="auth-stage">
        <main className="auth-card clay small notice">
          <h1 className="auth-title">Hmm…</h1>
          <p className="auth-sub">{loadError}</p>
          <button className="btn-main" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </main>
      </div>
    )
  }
  if (!ready || !profile) return <div className="splash"><span className="splash-heart">♥</span></div>

  const streak = liveStreak(profile)
  const pageClass = tab === 'home' ? 'wide' : tab === 'desk' ? 'roomy' : ''

  return (
    <div className="app">
      <Cloud className="cloud-a" />
      <Cloud className="cloud-b" />

      <header className="topbar">
        <div className="brand"><span className="brand-heart">♥</span> CozyNotes</div>
        <div className="chips">
          <span className="chip" title="Coins">🪙 {profile.coins}</span>
          <span className="chip" title="Day streak">🔥 {streak}</span>
          <SoundToggle />
        </div>
      </header>

      <main className={`page ${pageClass}`}>
        {tab === 'home' && (
          <Home profile={profile} pages={pages} rewards={rewards} owned={owned} streak={streak}
            onNav={setTab} onOpen={openPage} onQuickMood={(id) => newPage('diary', { mood: id })} />
        )}
        {/* the notebook stays mounted so unsaved work and autosave survive tab changes */}
        <div hidden={tab !== 'desk'}>
          <Notebook pages={pages} savePage={savePage} deletePage={deletePage} request={request} />
        </div>
        {tab === 'journal' && <Journal pages={pages} onOpen={openPage} onDelete={deletePage} onNew={newPage} />}
        {tab === 'shop' && (
          <Shop rewards={rewards} owned={owned} coins={profile.coins} theme={theme} onBuy={buy} onTheme={applyTheme} />
        )}
        {tab === 'settings' && <Settings user={user} profile={profile} pages={pages} onReload={load} />}
      </main>

      <nav className="dock" aria-label="Main">
        {TABS.map((t) => (
          <button key={t.id} className={`dock-item ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
            <span className="dock-emoji" aria-hidden="true">{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
