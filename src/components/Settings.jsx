import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import { play, setSoundPrefs, useSound } from '../lib/sound'

export default function Settings({ user, profile, pages, onReload }) {
  const toast = useToast()
  const snd = useSound()
  const [name, setName] = useState(profile.display_name)
  const [saving, setSaving] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function saveName(e) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return toast('Nickname cannot be empty.', 'error')
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ display_name: clean }).eq('id', user.id)
    setSaving(false)
    if (error) return toast('Could not save your nickname.', 'error')
    await onReload()
    toast('Nickname updated')
  }

  function exportData() {
    const payload = {
      exported_at: new Date().toISOString(),
      account: { email: user.email, nickname: profile.display_name },
      pages: pages.map(({ type, title, page_date, tags, data, created_at }) => ({ type, title, page_date, tags, data, created_at })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cozynotes-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Your diary was downloaded')
  }

  async function deleteAccount() {
    setDeleting(true)
    const { error } = await supabase.rpc('delete_my_account')
    if (error) { setDeleting(false); return toast('Could not delete your account. Please try again.', 'error') }
    await supabase.auth.signOut()
  }

  return (
    <div className="settings">
      <section className="hello"><h1>Settings</h1><p>Signed in as {user.email}</p></section>

      <form className="panel clay" onSubmit={saveName}>
        <h2>Nickname</h2>
        <input className="editor-title" value={name} maxLength={40} aria-label="Nickname" onChange={(e) => setName(e.target.value)} />
        <button className="btn-main compact" disabled={saving || name.trim() === profile.display_name}>{saving ? 'Saving…' : 'Save nickname'}</button>
      </form>

      <section className="panel clay">
        <h2>Sounds</h2>
        <label className="switch-row">
          <input type="checkbox" className="cb" data-sound="none" checked={snd.on}
            onChange={(e) => { setSoundPrefs({ on: e.target.checked }); if (e.target.checked) play('chime') }} />
          <span>Cute sounds</span>
        </label>
        <label className="range-row">
          <span>Volume</span>
          <input type="range" min="0" max="100" step="5" value={Math.round(snd.vol * 100)} disabled={!snd.on} aria-label="Volume"
            onChange={(e) => setSoundPrefs({ vol: Number(e.target.value) / 100 })}
            onPointerUp={() => play('pop')} onKeyUp={() => play('pop')} />
        </label>
        <button className="btn-soft" data-sound="coin" disabled={!snd.on}>Play a test sound</button>
      </section>

      <section className="panel clay">
        <h2>Your data</h2>
        <p>Download every notebook page you have written as a JSON file. Only you can read your entries.</p>
        <button className="btn-soft" onClick={exportData} disabled={pages.length === 0}>Download my diary</button>
      </section>

      <section className="panel clay">
        <h2>Sign out</h2>
        <button className="btn-soft" onClick={() => supabase.auth.signOut()}>Sign out of this device</button>
      </section>

      <section className="panel clay danger-zone">
        <h2>Delete account</h2>
        <p>This permanently deletes your account, entries, coins and rewards. It cannot be undone.</p>
        <input className="editor-title" placeholder="Type DELETE to confirm" aria-label="Type DELETE to confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        <button className="btn-soft danger" disabled={confirmText !== 'DELETE' || deleting} onClick={deleteAccount}>{deleting ? 'Deleting…' : 'Delete my account'}</button>
      </section>
    </div>
  )
}
