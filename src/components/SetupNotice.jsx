export default function SetupNotice() {
  return (
    <div className="auth-stage">
      <main className="auth-card clay small notice">
        <span className="heart" aria-hidden="true">♥</span>
        <h1 className="auth-title">Almost ready</h1>
        <p className="auth-sub">CozyNotes needs your Supabase keys.</p>
        <ol className="setup-list">
          <li>Create a file named <code>.env</code> in the project root (next to package.json).</li>
          <li>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> from Supabase → Project Settings → API.</li>
          <li>Stop the dev server and run <code>npm run dev</code> again.</li>
        </ol>
      </main>
    </div>
  )
}
