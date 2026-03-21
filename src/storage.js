const K = {
  users: 'sv_users',
  sessions: 'sv_sessions',
  responses: 'sv_responses',
  questions: 'sv_questions',
  notifs: 'sv_notifs',
  ejsConfig: 'sv_ejsConfig',
}

const DEFAULT_USERS = [
  { id: 'admin', name: 'Administrateur', role: 'admin', password: 'admin123' },
  { id: 'agent1', name: 'M. Dupont', role: 'agent', password: 'agent123' },
  { id: 'eleve1', name: 'Léa Martin', role: 'eleve', password: 'lea123', agentId: 'agent1', email: '', phone: '' },
  { id: 'eleve2', name: 'Tom Renard', role: 'eleve', password: 'tom123', agentId: 'agent1', email: '', phone: '' },
  { id: 'eleve3', name: 'Lucas Petit', role: 'eleve', password: 'lucas123', agentId: 'agent1', email: '', phone: '' },
]

const DEFAULT_QUESTIONS = [
  { id: 'q1', agentId: 'agent1', text: 'As-tu ton cours avec toi ?', type: 'oui_non', followup: { condition: 'oui', questionId: 'q2' }, assignedTo: [] },
  { id: 'q2', agentId: 'agent1', text: 'Ton cours est-il en ordre ? (feuilles présentes, notes prises, documents rangés)', type: 'oui_non', followup: null, assignedTo: [] },
]

function load(key, def) {
  try {
    const d = localStorage.getItem(key)
    return d ? JSON.parse(d) : def
  } catch { return def }
}
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const getUsers = () => load(K.users, DEFAULT_USERS)
export const saveUsers = v => save(K.users, v)

export const getSessions = () => load(K.sessions, [])
export const saveSessions = v => save(K.sessions, v)

export const getResponses = () => load(K.responses, [])
export const saveResponses = v => save(K.responses, v)

export const getAllQuestions = () => load(K.questions, DEFAULT_QUESTIONS)
export const saveAllQuestions = v => save(K.questions, v)
export const getAgentQuestions = agentId => getAllQuestions().filter(q => q.agentId === agentId)

export const getNotifs = () => load(K.notifs, [])
export const saveNotifs = v => save(K.notifs, v)

export const getEjsConfig = () => load(K.ejsConfig, { serviceId: '', templateId: '', publicKey: '', configured: false })
export const saveEjsConfig = v => save(K.ejsConfig, v)

export function getQuestionsForEleve(agentId, eleveId) {
  return getAgentQuestions(agentId).filter(q => !q.assignedTo?.length || q.assignedTo.includes(eleveId))
}

export function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function fmt(d) {
  return new Date(d).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtTime(d) {
  return new Date(d).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
}

export function fmtMonth(d) {
  return new Date(d).toLocaleDateString('fr-BE', { month: 'short', year: 'numeric' })
}
