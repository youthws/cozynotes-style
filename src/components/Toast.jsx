import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { play } from '../lib/sound'

const ToastContext = createContext(() => {})
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const idRef = useRef(0)

  const toast = useCallback((message, kind = 'ok') => {
    const id = ++idRef.current
    if (kind === 'error' || kind === 'coin' || kind === 'chime') play(kind)   // 'ok' stays quiet
    setItems((list) => [...list, { id, message, kind }])
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4200)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
