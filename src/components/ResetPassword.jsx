import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import { LockIcon } from './Icons'
import { Cloud } from './Illustrations'

export default function ResetPassword({ onDone }) {
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Your password needs at least 8 characters.')
    if (password !== confirm) return setError('The two passwords do not match.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)
    toast('Password updated 🔐', 'chime')
    onDone()
  }

  return (
    <div className="auth-stage">
      <Cloud className="cloud-a" />
      <Cloud className="cloud-b" />
      <main className="auth-card clay small">
        <span className="heart" aria-hidden="true">♥</span>
        <h1 className="auth-title">New password</h1>
        <p className="auth-sub">Choose something only you would guess</p>
        <form className="auth-form clay flat" onSubmit={submit} noValidate>
          <label className="field-row"><span className="field-icon"><LockIcon /></span>
            <input className="field" type="password" placeholder="New password" aria-label="New password" autoComplete="new-password"
              value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <label className="field-row"><span className="field-icon"><LockIcon /></span>
            <input className="field" type="password" placeholder="Repeat password" aria-label="Repeat password" autoComplete="new-password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
          {error && <p className="msg msg-error" role="alert">{error}</p>}
          <button className="btn-main" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
        </form>
      </main>
    </div>
  )
}
