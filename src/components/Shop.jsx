import { useState } from 'react'

export default function Shop({ rewards, owned, coins, theme, onBuy, onTheme }) {
  const [busyId, setBusyId] = useState(null)

  async function buy(r) {
    setBusyId(r.id)
    await onBuy(r)
    setBusyId(null)
  }

  const groups = [
    { title: 'Room decor', items: rewards.filter((r) => r.kind === 'decor') },
    { title: 'Room themes', items: rewards.filter((r) => r.kind === 'theme') },
  ]

  return (
    <div className="shop">
      <section className="hello">
        <h1>Shop</h1>
        <p>You have <strong>{coins} coins</strong>. Earn 10 for each of your first 3 entries every day, plus bonuses at 3, 7 and 30-day streaks.</p>
      </section>

      <div className="theme-current clay">
        <span>Current theme</span>
        <button className={`pill ${theme === 'lavender' ? 'on' : ''}`} onClick={() => onTheme('lavender')}>💜 Lavender (free)</button>
        {rewards.filter((r) => r.kind === 'theme' && owned.includes(r.id)).map((r) => {
          const key = r.id.replace('theme-', '')
          return <button key={r.id} className={`pill ${theme === key ? 'on' : ''}`} onClick={() => onTheme(key)}>{r.emoji} {r.name}</button>
        })}
      </div>

      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="group-title">{g.title}</h2>
          <div className="shop-grid">
            {g.items.map((r) => {
              const has = owned.includes(r.id)
              const can = coins >= r.cost
              return (
                <div key={r.id} className={`item clay ${has ? 'owned' : ''}`}>
                  <span className="item-emoji" aria-hidden="true">{r.emoji}</span>
                  <h3>{r.name}</h3>
                  {has ? <span className="tag">Owned</span> : (
                    <button className="btn-main compact" data-sound="buy" disabled={!can || busyId === r.id} onClick={() => buy(r)}>
                      {can ? `Buy · ${r.cost} 🪙` : `${r.cost - coins} more coins`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
