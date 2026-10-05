import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import { Cloud, Plant, Flower, Mascot } from './Illustrations'
import SoundToggle from './SoundToggle'
import { AppleIcon, EyeIcon, EyeOffIcon, FacebookIcon, GoogleIcon, LockIcon, MailIcon, UserIcon } from './Icons'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const COPY = {
  login:  { title: 'Welcome Back', sub: 'Log in to continue your journey', cta: 'Log in' },
  signup: { title: 'Join CozyNotes', sub: 'Create your tiny desk in a minute', cta: 'Create account' },
  forgot: { title: 'Forgot it?', sub: 'We will email you a reset link', cta: 'Send reset link' },
}

export default function AuthScreen() {
  const toast = useToast()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const fails = useRef({ count: 0, lockedUntil: 0 })

  const switchMode = (m) => { setMode(m); setError(''); setInfo(''); setPassword('') }

  async function submit(e) {
    e.preventDefault()
    setError(''); setInfo('')
    const cleanEmail = email.trim().toLowerCase()

    if (!EMAIL_RE.test(cleanEmail)) return setError('Please enter a valid email address.')
    if (mode !== 'forgot' && password.length < 8) return setError('Your password needs at least 8 characters.')
    if (mode === 'signup' && !name.trim()) return setError('Please tell us what to call you.')

    // tiny client-side brake against password guessing (the server also rate-limits)
    if (mode === 'login' && Date.now() < fails.current.lockedUntil) {
      const s = Math.ceil((fails.current.lockedUntil - Date.now()) / 1000)
      return setError(`Too many tries. Please wait ${s} seconds.`)
    }

    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        if (error) {
          if (/confirm/i.test(error.message)) return setError('Please confirm your email first. Check your inbox.')
          fails.current.count += 1
          if (fails.current.count >= 5) { fails.current = { count: 0, lockedUntil: Date.now() + 30000 } }
          return setError('Email or password is incorrect.')
        }
        fails.current.count = 0
      }

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { display_name: name.trim() }, emailRedirectTo: window.location.origin },
        })
        if (error) return setError(error.message)
        if (!data.session) {
          setInfo('Almost there! Check your email and tap the confirmation link.')
          toast('Confirmation email sent 💌', 'chime')
        }
      }

      if (mode === 'forgot') {
        await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: window.location.origin })
        // same message whether or not the account exists (prevents account probing)
        setInfo('If that email has an account, a reset link is on its way.')
      }
    } catch {
      setError('Something went wrong. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function social(provider) {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } })
    if (error) setError(`Could not start ${provider} sign-in. Is it enabled in Supabase?`)
  }

  const c = COPY[mode]

  return (
    <div className="auth-stage">
      <SoundToggle className="floating" />
      <Cloud className="cloud-a" />
      <Cloud className="cloud-b" />
      <Plant className="plant-l" />
      <Flower className="flower-r" />

      <main className="auth-card clay">
        <span className="heart" aria-hidden="true">♥</span>
        <h1 className="auth-title"><span className="sparks" aria-hidden="true" />{c.title}<span className="sparks flip" aria-hidden="true" /></h1>
        <p className="auth-sub">{c.sub}</p>

        <div className="mascot-wrap"><Mascot /></div>

        <form className="auth-form clay" onSubmit={submit} noValidate>
          {mode === 'signup' && (
            <label className="field-row">
              <span className="field-icon"><UserIcon /></span>
              <input className="field" placeholder="Your nickname" aria-label="Nickname" autoComplete="nickname" maxLength={40}
                value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}

          <label className="field-row">
            <span className="field-icon"><MailIcon /></span>
            <input className="field" type="email" placeholder="Email" aria-label="Email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          {mode !== 'forgot' && (
            <label className="field-row">
              <span className="field-icon"><LockIcon /></span>
              <input className="field has-eye" type={show ? 'text' : 'password'} placeholder="Password" aria-label="Password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </label>
          )}

          {mode === 'login' && (
            <button type="button" className="link right" onClick={() => switchMode('forgot')}>Forgot password?</button>
          )}

          {error && <p className="msg msg-error" role="alert">{error}</p>}
          {info && <p className="msg msg-info" role="status">{info}</p>}

          <button className="btn-main" disabled={busy}>{busy ? 'One moment…' : c.cta}</button>

          {mode !== 'forgot' && (
            <>
              <div className="or"><span>or continue with</span></div>
              <div className="socials">
                <button type="button" className="social" aria-label="Continue with Google" onClick={() => social('google')}><GoogleIcon /></button>
                <button type="button" className="social" aria-label="Continue with Apple" onClick={() => social('apple')}><AppleIcon /></button>
                <button type="button" className="social" aria-label="Continue with Facebook" onClick={() => social('facebook')}><FacebookIcon /></button>
              </div>
            </>
          )}

          <p className="switch">
            {mode === 'login' && <>Don't have an account? <button type="button" className="link" onClick={() => switchMode('signup')}>Sign up</button></>}
            {mode === 'signup' && <>Already have an account? <button type="button" className="link" onClick={() => switchMode('login')}>Log in</button></>}
            {mode === 'forgot' && <>Remembered it? <button type="button" className="link" onClick={() => switchMode('login')}>Back to log in</button></>}
          </p>
        </form>
      </main>
    </div>
  )
}
