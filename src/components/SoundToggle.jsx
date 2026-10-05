import { play, setSoundPrefs, useSound } from '../lib/sound'

export default function SoundToggle({ className = '' }) {
  const s = useSound()
  return (
    <button type="button" data-sound="none" className={`sound-toggle ${className}`} aria-pressed={s.on}
      aria-label={s.on ? 'Mute sounds' : 'Turn sounds on'} title={s.on ? 'Sounds on' : 'Sounds off'}
      onClick={() => { setSoundPrefs({ on: !s.on }); if (!s.on) play('pop') }}>
      <span aria-hidden="true">{s.on ? '🔊' : '🔇'}</span>
    </button>
  )
}