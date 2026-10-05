// All dates are plain "YYYY-MM-DD" strings in the user's own calendar.
export const parseDate = (s) => {
  const [y, m, d] = String(s).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
export const fmtDate = (dt) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
export const addDays = (dt, n) => { const c = new Date(dt); c.setDate(c.getDate() + n); return c }
export const mondayOf = (s) => { const d = parseDate(s); return addDays(d, -((d.getDay() + 6) % 7)) }
export const shortDate = (s) => parseDate(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })