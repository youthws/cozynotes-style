export const MOODS = [
  { id: 'happy',   emoji: '😊', label: 'Happy',   color: '#ffd76a' },
  { id: 'calm',    emoji: '😌', label: 'Calm',    color: '#a9dcc3' },
  { id: 'excited', emoji: '🤩', label: 'Excited', color: '#ffb0c4' },
  { id: 'tired',   emoji: '😴', label: 'Tired',   color: '#b9c7f2' },
  { id: 'sad',     emoji: '😢', label: 'Sad',     color: '#9fc9ee' },
  { id: 'angry',   emoji: '😠', label: 'Angry',   color: '#ff9f8a' },
]
export const moodById = (id) => MOODS.find((m) => m.id === id) || MOODS[0]

export const PROMPTS = [
  'What made you smile today?',
  'Write about one small thing you are grateful for.',
  'What is one thing you want to remember about today?',
  'Describe your perfect cozy afternoon.',
  'Who did you think about today, and why?',
  'What did you learn this week?',
  'Write a kind note to your future self.',
  'What is one thing you are proud of lately?',
  'What is on your mind right now?',
  'Describe the best thing you ate today.',
]
export const todaysPrompt = () => {
  const day = Math.floor(Date.now() / 86400000)
  return PROMPTS[day % PROMPTS.length]
}

// YYYY-MM-DD in the user's own timezone
export const localDate = (d = new Date()) => d.toLocaleDateString('en-CA')

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
