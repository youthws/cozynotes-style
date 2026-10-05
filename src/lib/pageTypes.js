import { localDate } from './constants'

/* =====================================================================
   PAGE TYPES
   Each page type is a list of "blocks" (tools). Block kinds:
   mood, text, lines, checklist, table, sticky, stickies, habits,
   counter, weekgrid, monthgrid, select, summary
   `at` decides where a block sits: top | left | right | bottom
   ===================================================================== */
const DAYS7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = ['6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM']
const YELLOW = '#f6e58d'
const LIME = '#dcebb0'

export const PAGE_TYPES = [
  { id: 'diary', tab: 'Today', name: 'Daily Diary / Notes', emoji: '📔', color: '#ffd76a', hint: 'A slow Sunday', blocks: [
    { id: 'mood', kind: 'mood', title: 'Mood tracker', at: 'top' },
    { id: 'thoughts', kind: 'text', title: "Today's thoughts", at: 'left', rows: 14, placeholder: 'Write freely…' },
    { id: 'gratitude', kind: 'lines', title: 'Gratitude log: name 3 things', at: 'right', n: 3, numbered: true },
    { id: 'events', kind: 'table', title: 'Key events', at: 'right', cols: [{ label: 'Date', w: '30%' }, { label: 'Description' }], rows: 3, addRow: true },
    { id: 'notes', kind: 'text', title: 'Notes', at: 'right', rows: 5 },
  ] },
  { id: 'daily', tab: 'Daily', name: 'Daily Planner', emoji: '🗓️', color: '#cfe6a8', hint: 'Busy Tuesday', blocks: [
    { id: 'schedule', kind: 'table', title: 'Schedule', at: 'left', cols: [{ label: 'Time', w: '26%' }, { label: 'Plan' }], defaults: HOURS.map((h) => [h, '']), addRow: true },
    { id: 'priorities', kind: 'sticky', title: 'Top priorities', at: 'right', color: YELLOW, rows: 4 },
    { id: 'todo', kind: 'checklist', title: 'To-do list', at: 'right', n: 6 },
    { id: 'mood', kind: 'mood', title: 'My mood', at: 'right' },
    { id: 'water', kind: 'counter', title: 'Water intake', at: 'right', max: 8, icon: '💧' },
    { id: 'notes', kind: 'text', title: 'Notes', at: 'right', rows: 3 },
  ] },
  { id: 'weekly', tab: 'Weekly', name: 'Weekly Planner', emoji: '🗒️', color: '#b9d9f2', hint: 'Week 38', blocks: [
    { id: 'week', kind: 'weekgrid', title: 'This week', at: 'left' },
    { id: 'priorities', kind: 'sticky', title: 'Top priorities', at: 'right', color: YELLOW, rows: 4 },
    { id: 'focus', kind: 'sticky', title: 'This week I will…', at: 'right', color: LIME, rows: 4 },
    { id: 'tracker', kind: 'habits', title: 'Tracker', at: 'right', days: 7, labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], names: ['Exercise', 'Reading', 'Water'] },
  ] },
  { id: 'monthly', tab: 'Monthly', name: 'Monthly Planner', emoji: '📅', color: '#f5c6a5', hint: 'September plans', blocks: [
    { id: 'cal', kind: 'monthgrid', title: 'Calendar', at: 'top' },
    { id: 'goals', kind: 'checklist', title: 'Goals', at: 'left', n: 4 },
    { id: 'notes', kind: 'text', title: 'Notes', at: 'right', rows: 5 },
  ] },
  { id: 'tracker', tab: 'Habits', name: 'Habit Tracker', emoji: '🌱', color: '#bfe3c8', hint: 'September habits', blocks: [
    { id: 'habits', kind: 'habits', title: 'Activity', at: 'top', days: 31, names: ['Wake up early', 'Exercise', 'Read', 'Drink water', 'Journal', 'Sleep 8 hours'] },
    { id: 'notes', kind: 'text', title: 'Notes', at: 'top', rows: 4 },
  ] },
  { id: 'workout', tab: 'Workout', name: 'Workout Planner', emoji: '💪', color: '#f7b7c4', hint: 'Leg day plan', blocks: [
    { id: 'plan', kind: 'table', title: 'Exercise / workout', at: 'top',
      cols: [{ label: 'Day', w: '11%' }, { label: 'Exercise' }, { label: 'Sets', type: 'number', w: '9%' }, { label: 'Reps', type: 'number', w: '9%' }, { label: 'Weight', w: '13%' }, { label: 'Done', type: 'check', w: '9%' }],
      defaults: DAYS7.map((d) => [d, '', '', '', '', false]), addRow: true, progress: 5 },
    { id: 'notes', kind: 'text', title: 'Notes', at: 'left', rows: 4 },
    { id: 'water', kind: 'counter', title: 'Water', at: 'right', max: 8, icon: '💧' },
  ] },
  { id: 'meal', tab: 'Meals', name: 'Meal Planner', emoji: '🍽️', color: '#ffcf9f', hint: 'Meal prep week', split: '2.2fr 1fr', blocks: [
    { id: 'meals', kind: 'table', title: 'Meals', at: 'left', cols: [{ label: 'Day', w: '12%' }, { label: 'Breakfast' }, { label: 'Lunch' }, { label: 'Dinner' }, { label: 'Snacks' }], defaults: DAYS7.map((d) => [d, '', '', '', '']) },
    { id: 'groceries', kind: 'checklist', title: 'Groceries', at: 'right', n: 8 },
  ] },
  { id: 'budget', tab: 'Budget', name: 'Budget Planner', emoji: '💰', color: '#d8ccf5', hint: 'September budget', blocks: [
    { id: 'summary', kind: 'summary', title: 'Overview', at: 'top' },
    { id: 'income', kind: 'table', title: 'Income', at: 'left', cols: [{ label: 'Source' }, { label: 'Amount', type: 'number', w: '34%' }], rows: 3, addRow: true, totals: true },
    { id: 'expenses', kind: 'table', title: 'Expenses', at: 'right',
      cols: [{ label: 'Category' }, { label: 'Planned', type: 'number', w: '23%' }, { label: 'Actual', type: 'number', w: '23%' }, { label: 'Paid', type: 'check', w: '11%' }],
      defaults: [['Rent', '', '', false], ['Food', '', '', false], ['Transport', '', '', false], ['Bills', '', '', false], ['Savings', '', '', false], ['Fun', '', '', false]], addRow: true, totals: true },
    { id: 'notes', kind: 'text', title: 'Notes', at: 'bottom', rows: 3 },
  ] },
  { id: 'wishlist', tab: 'Wishes', name: 'Wish List', emoji: '🛍️', color: '#ffc2d4', hint: 'Birthday wishes', blocks: [
    { id: 'items', kind: 'table', title: 'Wish list', at: 'top',
      cols: [{ label: 'Item' }, { label: 'Price', type: 'number', w: '16%' }, { label: 'Where / link' }, { label: 'Got it', type: 'check', w: '10%' }],
      rows: 8, addRow: true, totals: true, progress: 3 },
  ] },
  { id: 'life', tab: 'Life', name: 'Life Planner', emoji: '🌈', color: '#e3c9f7', hint: 'Things I love', blocks: [
    { id: 'happy', kind: 'lines', title: 'Things that make me happy', at: 'left', n: 6 },
    { id: 'reflect', kind: 'text', title: 'Reflections', at: 'left', rows: 5 },
    { id: 'quote', kind: 'sticky', title: 'A quote I love', at: 'right', color: '#e8dcf7', rows: 4 },
    { id: 'dreams', kind: 'checklist', title: 'Things I want to do', at: 'right', n: 5 },
  ] },
  { id: 'goals', tab: 'Goals', name: 'Goals', emoji: '🎯', color: '#ffb9a3', hint: 'This year', blocks: [
    { id: 'goals', kind: 'table', title: 'My goals', at: 'top',
      cols: [{ label: 'Goal' }, { label: 'First step' }, { label: 'Deadline', w: '17%' }, { label: 'Done', type: 'check', w: '9%' }],
      rows: 6, addRow: true, progress: 3 },
    { id: 'why', kind: 'text', title: 'Why these goals matter to me', at: 'top', rows: 4 },
  ] },
  { id: 'projects', tab: 'Projects', name: 'Project Page', emoji: '🧩', color: '#a8d5e8', hint: 'Website redesign', blocks: [
    { id: 'status', kind: 'select', title: 'Status', at: 'left', options: ['Not started', 'In progress', 'On hold', 'Done'] },
    { id: 'desc', kind: 'text', title: 'What is it about?', at: 'left', rows: 6 },
    { id: 'tasks', kind: 'checklist', title: 'Tasks', at: 'right', n: 6 },
    { id: 'milestones', kind: 'table', title: 'Milestones', at: 'right', cols: [{ label: 'Milestone' }, { label: 'Due', w: '24%' }, { label: 'Done', type: 'check', w: '11%' }], rows: 3, addRow: true, progress: 2 },
  ] },
  { id: 'ideas', tab: 'Ideas', name: 'Ideas', emoji: '💡', color: '#fbe58a', hint: 'Brainstorm', blocks: [
    { id: 'stickies', kind: 'stickies', title: 'Idea board', at: 'top' },
    { id: 'dump', kind: 'text', title: 'Brain dump', at: 'top', rows: 6 },
  ] },
  { id: 'contacts', tab: 'Contacts', name: 'Contacts', emoji: '📇', color: '#c5d5f7', hint: 'Family & friends', blocks: [
    { id: 'people', kind: 'table', title: 'People', at: 'top', cols: [{ label: 'Name' }, { label: 'Phone', w: '20%' }, { label: 'Email' }, { label: 'Notes' }], rows: 6, addRow: true },
  ] },
]

export const typeById = (id) => PAGE_TYPES.find((t) => t.id === id) || PAGE_TYPES[0]

/* ---------- defaults ---------- */
export const blankRow = (cols) => cols.map((c) => (c.type === 'check' ? false : ''))

function defaultFor(b) {
  switch (b.kind) {
    case 'mood': case 'text': case 'sticky': return ''
    case 'lines': return Array(b.n).fill('')
    case 'checklist': return Array.from({ length: b.n }, () => ({ t: '', d: false }))
    case 'table': return b.defaults ? b.defaults.map((r) => [...r]) : Array.from({ length: b.rows || 3 }, () => blankRow(b.cols))
    case 'stickies': return [{ t: '', c: 0 }, { t: '', c: 1 }, { t: '', c: 2 }]
    case 'habits': return b.names.map((n) => ({ n, d: Array(b.days).fill(false) }))
    case 'counter': return 0
    case 'weekgrid': return Array(7).fill('')
    case 'monthgrid': return {}
    case 'select': return b.options[0]
    default: return null
  }
}

export function blankData(typeId) {
  const d = { photos: [] }
  typeById(typeId).blocks.forEach((b) => { if (b.kind !== 'summary') d[b.id] = defaultFor(b) })
  return d
}
export const withDefaults = (typeId, data) => ({ ...blankData(typeId), ...(data || {}) })

const makeUid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `u${Date.now()}${Math.random()}`)

export const blankPage = (typeId, preset = {}) => ({
  uid: makeUid(), id: null, type: typeId, title: '', page_date: localDate(), tags: [],
  data: { ...blankData(typeId), ...preset },
})
export const pageFromRow = (row) => ({
  uid: row.id, id: row.id, type: row.type, title: row.title, page_date: row.page_date,
  tags: row.tags || [], data: withDefaults(row.type, row.data),
})
export const sortPages = (list) =>
  [...list].sort((a, b) => (b.page_date.localeCompare(a.page_date)) || (b.created_at || '').localeCompare(a.created_at || ''))

/* first bit of writing on a page, for the journal cards */
export function pageSnippet(page) {
  const t = typeById(page.type)
  const data = page.data || {}
  for (const b of t.blocks) {
    const v = data[b.id]
    if ((b.kind === 'text' || b.kind === 'sticky') && typeof v === 'string' && v.trim()) return v.trim().slice(0, 160)
    if (b.kind === 'lines' && Array.isArray(v)) { const s = v.filter(Boolean).join(' · '); if (s) return s.slice(0, 160) }
    if (b.kind === 'checklist' && Array.isArray(v)) { const items = v.filter((x) => x.t); if (items.length) return `${items.filter((x) => x.d).length}/${items.length} done: ${items[0].t}`.slice(0, 160) }
  }
  return ''
}