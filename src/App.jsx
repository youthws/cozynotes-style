import { useEffect, useRef, useState } from 'react'
import { play } from './lib/sound'
import { supabase, isConfigured } from './lib/supabase'
import AuthScreen from './components/AuthScreen'
import Dashboard from './components/Dashboard'
import ResetPassword from './components/ResetPassword'
import SetupNotice from './components/SetupNotice'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isConfigured)
  const [recovery, setRecovery] = useState(false)
  const hadSession = useRef(false)

  // apply the saved theme before anything paints
  useEffect(() => {
    try { document.documentElement.dataset.theme = localStorage.getItem('cozynotes-theme') || 'lavender' } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => { hadSession.current = !!data.session; setSession(data.session); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'SIGNED_IN' && !hadSession.current) play('welcome')
      if (event === 'SIGNED_OUT' && hadSession.current) play('bye')
      hadSession.current = !!s
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (!isConfigured) return <SetupNotice />
  if (loading) return <div className="splash"><span className="splash-heart">♥</span></div>
  if (session && recovery) return <ResetPassword onDone={() => setRecovery(false)} />
  if (!session) return <AuthScreen />
  return <Dashboard user={session.user} />
}
