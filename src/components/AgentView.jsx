import React, { useState } from 'react'
import emailjs from '@emailjs/browser'
import {
  getUsers, saveUsers, getSessions, saveSessions, getResponses,
  getAgentQuestions, getAllQuestions, saveAllQuestions,
  getNotifs, saveNotifs, getEjsConfig, saveEjsConfig,
  uid, initials, fmt, fmtTime, fmtMonth
} from '../storage'
import {
  Card, TopBar, Tabs, Btn, Badge, Avatar, Field, Input, Select, Textarea,
  Alert, Modal, MetricCard, SectionTitle, SearchInput, Table, ProgressBar, Divider
} from './UI'

export default function AgentView({ user, onLogout }) {
  const [tab, setTab] = useState('tableau')
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState({ tableau: '', questions: '', sessions: '' })
  const [sort, setSort] = useState({ col: 'name', dir: 1 })
  const [, refresh] = useState(0)
  const rerender = () => refresh(n => n + 1)
  const closeModal = () => setModal(null)

  const users = getUsers()
  const sessions = getSessions()
  const responses = getResponses()
  const myEleves = users.filter(u => u.role === 'eleve' && u.agentId === user.id)
  const today = new Date().toDateString()
  const todaySess = sessions.filter(s => s.agentId === user.id && new Date(s.date).toDateString() === today)
  const lastSess = todaySess[todaySess.length - 1]
  const todayResps = lastSess ? responses.filter(r => r.sessionId === lastSess.id) : []
  const myQuestions = getAgentQuestions(user.id)
  const notifs = getNotifs().filter(n => n.agentId === user.id)

  const TABS = [
    { key: 'tableau', label: 'Tableau' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'graphique', label: 'Graphique' },
    { key: 'questions', label: 'Questions' },
    { key: 'sessions', label: 'Sessions' },
  ]

  // ── TABLEAU ──
  function renderTableau() {
    let eleves = myEleves.filter(e => e.name.toLowerCase().includes(search.tableau.toLowerCase()))
    eleves = [...eleves].sort((a, b) => {
      const ra = todayResps.find(r => r.eleveId === a.id)
      const rb = todayResps.find(r => r.eleveId === b.id)
      if (sort.col === 'status') return sort.dir * ((ra ? 1 : 0) - (rb ? 1 : 0))
      return sort.dir * a.name.localeCompare(b.name)
    })
    const rows = eleves.map(e => {
      const rep = todayResps.find(r => r.eleveId === e.id)
      const sessQs = lastSess ? (lastSess.questions || []).filter(q => !q.assignedTo?.length || q.assignedTo.includes(e.id)) : []
      const cells = sessQs.slice(0, 2).map(q => {
        const a = rep?.answers?.[q.id]
        return <Badge key={q.id} variant={a === 'oui' ? 'green' : a === 'non' ? 'red' : 'gray'} style={{ marginRight: 3, fontSize: 11 }}>
          {q.text.split(' ').slice(0, 3).join(' ')}… : {a || '–'}
        </Badge>
      })
      return [
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={e.name} role="eleve" /><span>{e.name}</span>
        </div>,
        rep ? <Badge variant="green">Répondu</Badge> : <Badge variant="gray">En attente</Badge>,
        <div>{cells}</div>,
        <div style={{ display: 'flex', gap: 4 }}>
          <Btn sm onClick={() => setModal({ type: 'eleve_detail', eleveId: e.id })}>Détail</Btn>
          <Btn sm onClick={() => setModal({ type: 'notif', preselected: e.id })}>✉</Btn>
        </div>
      ]
    })
    const sortArrow = col => sort.col === col ? (sort.dir === 1 ? '↑' : '↓') : '↕'
    const toggleSort = col => setSort(s => ({ col, dir: s.col === col ? s.dir * -1 : 1 }))
    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <MetricCard label="Réponses aujourd'hui" value={todayResps.length} />
          <MetricCard label="Élèves" value={myEleves.length} />
          <MetricCard label="Sessions total" value={sessions.filter(s => s.agentId === user.id).length} />
        </div>
        {lastSess
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#5E5E5E' }}>Session active : <strong>{lastSess.matiere}</strong> — {fmt(lastSess.date)}</span>
              <Badge variant="green">{todayResps.length}/{myEleves.length} réponses</Badge>
            </div>
          : <div style={{ fontSize: 13, color: '#5E5E5E', marginBottom: '1rem' }}>Aucune session active aujourd'hui.</div>}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Btn variant="primary" onClick={() => setModal({ type: 'new_session' })}>+ Lancer une session</Btn>
          <div style={{ flex: 1, minWidth: 160 }}>
            <SearchInput value={search.tableau} onChange={v => setSearch(s => ({ ...s, tableau: v }))} placeholder="Rechercher un élève…" />
          </div>
        </div>
        <Card noPad>
          <Table
            headers={[
              { label: 'Élève', sort: sortArrow('name'), active: sort.col === 'name', onClick: () => toggleSort('name') },
              { label: 'Statut', sort: sortArrow('status'), active: sort.col === 'status', onClick: () => toggleSort('status') },
              { label: 'Aperçu' }, { label: '' }
            ]}
            rows={rows}
            empty="Aucun élève trouvé"
          />
        </Card>
      </div>
    )
  }

  // ── NOTIFICATIONS ──
  function renderNotifications() {
    const ejsCfg = getEjsConfig()
    const recentNotifs = notifs.slice().reverse().slice(0, 30)
    return (
      <div>
        {!ejsCfg.configured
          ? <Alert variant="info">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span>📧 Configurez EmailJS pour envoyer de vrais emails. Sans config, les envois sont simulés.</span>
                <Btn sm variant="primary" onClick={() => setModal({ type: 'ejs_config' })}>Configurer</Btn>
              </div>
            </Alert>
          : <Alert variant="success">✅ EmailJS configuré — les emails sont envoyés.</Alert>}
        <Alert variant="teal">📱 Les SMS sont simulés. Twilio sera branché lors du déploiement sur serveur.</Alert>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 14, color: '#5E5E5E' }}>{notifs.length} notification(s) envoyée(s)</div>
          <Btn variant="primary" onClick={() => setModal({ type: 'notif', preselected: null })}>+ Envoyer une notification</Btn>
        </div>
        <Card style={{ padding: '1rem' }}>
          {recentNotifs.length === 0
            ? <div style={{ textAlign: 'center', padding: '2rem', color: '#9E9E9E' }}>Aucune notification envoyée.</div>
            : recentNotifs.map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '0.5px solid #E0E0E0' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: n.type === 'email' ? '#E6F1FB' : '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  {n.type === 'email' ? '📧' : '📱'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{n.eleveName}</span>
                    <Badge variant={n.type === 'email' ? 'blue' : 'teal'}>{n.type === 'email' ? 'Email' : 'SMS'}</Badge>
                    {n.simulated ? <Badge variant="gray" style={{ fontSize: 10 }}>Simulé</Badge> : <Badge variant="green" style={{ fontSize: 10 }}>Envoyé</Badge>}
                  </div>
                  <div style={{ fontSize: 13, color: '#5E5E5E', marginBottom: 2 }}>{n.subject || n.message.slice(0, 60) + '…'}</div>
                  <div style={{ fontSize: 11, color: '#9E9E9E' }}>{fmt(n.date)} à {fmtTime(n.date)}</div>
                </div>
                <Btn sm onClick={() => setModal({ type: 'notif_detail', notif: n })}>Voir</Btn>
              </div>
            ))}
        </Card>
      </div>
    )
  }

  // ── GRAPHIQUE ──
  function renderGraphique() {
    const mySessions = sessions.filter(s => s.agentId === user.id)
    const monthMap = {}
    const eleveMap = {}
    myEleves.forEach(e => { eleveMap[e.id] = { name: e.name, count: 0 } })
    responses.filter(r => mySessions.find(s => s.id === r.sessionId)).forEach(r => {
      const sess = mySessions.find(s => s.id === r.sessionId)
      const fq = (sess?.questions || [])[0]
      if (!fq) return
      if (r.answers?.[fq.id] === 'non') {
        const mk = fmtMonth(r.date)
        monthMap[mk] = (monthMap[mk] || 0) + 1
        if (eleveMap[r.eleveId]) eleveMap[r.eleveId].count++
      }
    })
    const months = Object.entries(monthMap).sort((a, b) => new Date('1 ' + a[0]) - new Date('1 ' + b[0]))
    const maxM = Math.max(...months.map(m => m[1]), 1)
    const eleves = Object.values(eleveMap).sort((a, b) => b.count - a.count)
    const maxE = Math.max(...eleves.map(e => e.count), 1)
    const totalOublis = eleves.reduce((s, e) => s + e.count, 0)
    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <MetricCard label="Oublis total" value={totalOublis} color="#A32D2D" />
          <MetricCard label="Sessions" value={mySessions.length} />
          <MetricCard label="Taux d'oubli" value={mySessions.length ? Math.round((totalOublis / Math.max(mySessions.length * myEleves.length, 1)) * 100) + '%' : '–'} />
        </div>
        <SectionTitle>Oublis par mois</SectionTitle>
        {months.length === 0
          ? <div style={{ textAlign: 'center', padding: '1rem', color: '#9E9E9E', fontSize: 14 }}>Aucune donnée</div>
          : months.map(([m, v]) => (
            <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 72, fontSize: 12, color: '#5E5E5E', textAlign: 'right' }}>{m}</div>
              <div style={{ flex: 1, height: 14, background: '#F0F0F0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#378ADD', borderRadius: 4, width: `${Math.round((v / maxM) * 100)}%`, transition: 'width .6s' }} />
              </div>
              <div style={{ width: 24, fontSize: 12, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        <Divider />
        <SectionTitle>Oublis par élève</SectionTitle>
        {eleves.map(e => (
          <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 72, fontSize: 12, color: '#5E5E5E', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name.split(' ')[0]}</div>
            <div style={{ flex: 1, height: 14, background: '#F0F0F0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: e.count > 2 ? '#E24B4A' : '#EF9F27', borderRadius: 4, width: `${Math.round((e.count / maxE) * 100)}%`, transition: 'width .6s' }} />
            </div>
            <div style={{ width: 24, fontSize: 12, fontWeight: 500, color: e.count > 2 ? '#A32D2D' : '#1A1A1A' }}>{e.count}</div>
          </div>
        ))}
      </div>
    )
  }

  // ── QUESTIONS ──
  function renderQuestions() {
    const filtered = myQuestions.filter(q => q.text.toLowerCase().includes(search.questions.toLowerCase()))
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 14, color: '#5E5E5E' }}>{myQuestions.length} question(s)</div>
          <Btn variant="primary" onClick={() => setModal({ type: 'edit_question', questionId: null })}>+ Ajouter</Btn>
        </div>
        <SearchInput value={search.questions} onChange={v => setSearch(s => ({ ...s, questions: v }))} placeholder="Rechercher une question…" />
        {filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: '2rem', color: '#9E9E9E' }}>Aucune question.</div>
          : filtered.map(q => {
            const assigned = q.assignedTo?.length > 0
            const names = assigned ? q.assignedTo.map(id => users.find(x => x.id === id)?.name.split(' ')[0] || '?').join(', ') : null
            return (
              <div key={q.id} style={{ background: '#F8F8F8', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, marginBottom: 6, lineHeight: 1.5 }}>{q.text}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      <Badge variant="gray">{q.type === 'oui_non' ? 'Oui / Non' : 'Réponse libre'}</Badge>
                      {q.followup && <Badge variant="blue">Suivi si {q.followup.condition}</Badge>}
                      {assigned ? <Badge variant="amber">→ {names}</Badge> : <Badge variant="green">Tous</Badge>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Btn sm onClick={() => setModal({ type: 'edit_question', questionId: q.id })}>Modifier</Btn>
                    <Btn sm variant="danger" onClick={() => { saveAllQuestions(getAllQuestions().filter(x => x.id !== q.id)); rerender() }}>Suppr.</Btn>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    )
  }

  // ── SESSIONS ──
  function renderSessions() {
    const mySess = sessions.filter(s => s.agentId === user.id).slice().reverse()
      .filter(s => s.matiere.toLowerCase().includes(search.sessions.toLowerCase()))
    const rows = mySess.map(s => {
      const nb = responses.filter(r => r.sessionId === s.id).length
      const isToday = new Date(s.date).toDateString() === today
      return [
        <span>{fmt(s.date)}{isToday && <Badge variant="blue" style={{ fontSize: 10, marginLeft: 6 }}>Aujourd'hui</Badge>}</span>,
        <strong>{s.matiere}</strong>,
        (s.questions || []).length,
        nb,
        <Btn sm variant="danger" onClick={() => { saveSessions(getSessions().filter(x => x.id !== s.id)); rerender() }}>Suppr.</Btn>
      ]
    })
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 14, color: '#5E5E5E' }}>{mySess.length} session(s)</div>
          <Btn variant="primary" onClick={() => setModal({ type: 'new_session' })}>+ Lancer</Btn>
        </div>
        <SearchInput value={search.sessions} onChange={v => setSearch(s => ({ ...s, sessions: v }))} placeholder="Rechercher par matière…" />
        <Card noPad>
          <Table headers={[{ label: 'Date' }, { label: 'Matière' }, { label: 'Questions' }, { label: 'Réponses' }, { label: '' }]} rows={rows} empty="Aucune session" />
        </Card>
      </div>
    )
  }

  // ── MODALS ──
  function renderModal() {
    if (!modal) return null

    if (modal.type === 'eleve_detail') {
      const eleve = users.find(u => u.id === modal.eleveId)
      const eleveResps = responses.filter(r => r.eleveId === modal.eleveId).slice().reverse().slice(0, 8)
      return (
        <Modal onClose={closeModal}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
            <Avatar name={eleve?.name || '?'} role="eleve" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{eleve?.name}</div>
              <div style={{ fontSize: 12, color: '#5E5E5E' }}>{eleveResps.length} réponse(s)</div>
            </div>
            <Btn sm style={{ marginLeft: 'auto' }} onClick={() => setModal({ type: 'notif', preselected: modal.eleveId })}>✉ Notifier</Btn>
          </div>
          {eleveResps.length === 0
            ? <div style={{ textAlign: 'center', padding: '2rem', color: '#9E9E9E' }}>Aucune réponse.</div>
            : eleveResps.map(r => {
              const sess = sessions.find(s => s.id === r.sessionId) || {}
              const qs = (sess.questions || []).filter(q => r.answers?.[q.id] !== undefined)
              return (
                <div key={r.id} style={{ padding: '10px 0', borderBottom: '0.5px solid #E0E0E0' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{fmt(r.date)} — {sess.matiere || '?'}</div>
                  {qs.map(q => (
                    <div key={q.id} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span style={{ color: '#5E5E5E' }}>{q.text.slice(0, 45)}…</span>
                      <Badge variant={r.answers[q.id] === 'oui' ? 'green' : r.answers[q.id] === 'non' ? 'red' : 'gray'} style={{ fontSize: 11 }}>{r.answers[q.id]}</Badge>
                    </div>
                  ))}
                </div>
              )
            })}
          <div style={{ marginTop: '1rem', textAlign: 'right' }}><Btn onClick={closeModal}>Fermer</Btn></div>
        </Modal>
      )
    }

    if (modal.type === 'new_session') return <NewSessionModal user={user} onClose={closeModal} onCreated={() => { rerender(); closeModal() }} hasTodaySess={!!lastSess} lastSessName={lastSess?.matiere} />
    if (modal.type === 'edit_question') return <EditQuestionModal user={user} questionId={modal.questionId} onClose={closeModal} onSaved={() => { rerender(); closeModal() }} />
    if (modal.type === 'notif') return <NotifModal user={user} preselected={modal.preselected} onClose={closeModal} onSent={() => { rerender(); closeModal() }} />
    if (modal.type === 'notif_detail') {
      const n = modal.notif
      return (
        <Modal onClose={closeModal}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: n.type === 'email' ? '#E6F1FB' : '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n.type === 'email' ? '📧' : '📱'}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{n.eleveName}</div>
              <div style={{ fontSize: 12, color: '#5E5E5E' }}>{fmt(n.date)} à {fmtTime(n.date)} · {n.simulated ? 'Simulé' : 'Envoyé'}</div>
            </div>
          </div>
          {n.subject && <Field label="Sujet"><div style={{ fontSize: 14, fontWeight: 500 }}>{n.subject}</div></Field>}
          <Field label="Message">
            <div style={{ fontSize: 14, background: '#F8F8F8', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{n.message}</div>
          </Field>
          <div style={{ marginTop: '1rem', textAlign: 'right' }}><Btn onClick={closeModal}>Fermer</Btn></div>
        </Modal>
      )
    }
    if (modal.type === 'ejs_config') return <EjsConfigModal onClose={closeModal} onSaved={() => { rerender(); closeModal() }} />
    return null
  }

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <TopBar user={user} onLogout={onLogout} />
      <div style={{ marginTop: '1.5rem' }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'tableau' && renderTableau()}
        {tab === 'notifications' && renderNotifications()}
        {tab === 'graphique' && renderGraphique()}
        {tab === 'questions' && renderQuestions()}
        {tab === 'sessions' && renderSessions()}
      </div>
      {renderModal()}
    </div>
  )
}

// ── Modal : Nouvelle session ──
function NewSessionModal({ user, onClose, onCreated, hasTodaySess, lastSessName }) {
  const [matiere, setMatiere] = useState('')
  const qs = getAgentQuestions(user.id)
  const users = getUsers()
  const [checked, setChecked] = useState(() => new Set(qs.map(q => q.id)))
  const toggle = id => setChecked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  function create() {
    if (!matiere.trim()) return
    const selectedQs = qs.filter(q => checked.has(q.id))
    const s = { id: uid(), agentId: user.id, matiere: matiere.trim(), date: new Date().toISOString(), questions: selectedQs }
    const all = getSessions(); all.push(s); saveSessions(all)
    onCreated()
  }
  return (
    <Modal onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: '1.5rem' }}>Lancer une session</div>
      {hasTodaySess && <Alert variant="warning">⚠️ Une session est déjà active aujourd'hui (<strong>{lastSessName}</strong>). La nouvelle remplacera la session visible par les élèves.</Alert>}
      <Field label="Matière"><Input value={matiere} onChange={e => setMatiere(e.target.value)} placeholder="ex: mathématiques, français…" /></Field>
      <Field label="Questions à inclure">
        {qs.length === 0
          ? <Alert variant="info">Aucune question configurée.</Alert>
          : <div style={{ border: '0.5px solid #E0E0E0', borderRadius: 8, padding: 8 }}>
            {qs.map(q => {
              const assigned = q.assignedTo?.length > 0
              const names = assigned ? q.assignedTo.map(id => users.find(x => x.id === id)?.name.split(' ')[0] || '?').join(', ') : 'Tous'
              return (
                <label key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked.has(q.id)} onChange={() => toggle(q.id)} style={{ width: 'auto', marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13 }}>{q.text}</div>
                    <div style={{ fontSize: 11, color: '#9E9E9E', marginTop: 2 }}>→ {names}</div>
                  </div>
                </label>
              )
            })}
          </div>}
      </Field>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <Btn onClick={onClose}>Annuler</Btn>
        <Btn variant={hasTodaySess ? 'warning' : 'primary'} onClick={create}>{hasTodaySess ? 'Remplacer' : 'Lancer'}</Btn>
      </div>
    </Modal>
  )
}

// ── Modal : Éditer question ──
function EditQuestionModal({ user, questionId, onClose, onSaved }) {
  const allQs = getAllQuestions()
  const existing = questionId ? allQs.find(q => q.id === questionId) : null
  const users = getUsers()
  const myEleves = users.filter(u => u.role === 'eleve' && u.agentId === user.id)
  const agentQs = getAgentQuestions(user.id).filter(q => q.id !== questionId)
  const [text, setText] = useState(existing?.text || '')
  const [type, setType] = useState(existing?.type || 'oui_non')
  const [fuCond, setFuCond] = useState(existing?.followup?.condition || '')
  const [fuTarget, setFuTarget] = useState(existing?.followup?.questionId || '')
  const [assignAll, setAssignAll] = useState(!existing?.assignedTo?.length)
  const [assignedTo, setAssignedTo] = useState(new Set(existing?.assignedTo || []))
  const toggleEleve = id => setAssignedTo(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  function save() {
    if (!text.trim()) return
    const followup = (fuCond && fuTarget) ? { condition: fuCond, questionId: fuTarget } : null
    const assigned = assignAll ? [] : [...assignedTo]
    const all = getAllQuestions()
    if (questionId) {
      const idx = all.findIndex(q => q.id === questionId)
      if (idx > -1) all[idx] = { ...all[idx], text, type, followup, assignedTo: assigned }
    } else {
      all.push({ id: uid(), agentId: user.id, text, type, followup, assignedTo: assigned })
    }
    saveAllQuestions(all); onSaved()
  }
  return (
    <Modal onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: '1.5rem' }}>{existing ? 'Modifier la question' : 'Nouvelle question'}</div>
      <Field label="Texte"><Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Écris ta question…" /></Field>
      <Field label="Type de réponse">
        <Select value={type} onChange={e => setType(e.target.value)}>
          <option value="oui_non">Oui / Non</option>
          <option value="libre">Réponse libre</option>
        </Select>
      </Field>
      {type === 'oui_non' && agentQs.length > 0 && (
        <Field label="Question de suivi (optionnel)">
          <Select value={fuCond} onChange={e => setFuCond(e.target.value)} style={{ marginBottom: 8 }}>
            <option value="">Aucun</option>
            <option value="oui">Si réponse = Oui</option>
            <option value="non">Si réponse = Non</option>
          </Select>
          {fuCond && (
            <Select value={fuTarget} onChange={e => setFuTarget(e.target.value)}>
              <option value="">Choisir une question…</option>
              {agentQs.map(q => <option key={q.id} value={q.id}>{q.text.slice(0, 50)}</option>)}
            </Select>
          )}
        </Field>
      )}
      <Field label="Attribuer à">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Btn sm variant={assignAll ? 'primary' : 'default'} onClick={() => setAssignAll(true)}>Tous</Btn>
          <Btn sm variant={!assignAll ? 'primary' : 'default'} onClick={() => setAssignAll(false)}>Spécifiques</Btn>
        </div>
        {!assignAll && myEleves.map(e => (
          <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={assignedTo.has(e.id)} onChange={() => toggleEleve(e.id)} style={{ width: 'auto' }} />
            <Avatar name={e.name} role="eleve" style={{ width: 28, height: 28, fontSize: 11 }} />
            <span>{e.name}</span>
          </label>
        ))}
      </Field>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <Btn onClick={onClose}>Annuler</Btn>
        <Btn variant="primary" onClick={save}>Enregistrer</Btn>
      </div>
    </Modal>
  )
}

// ── Modal : Notification ──
function NotifModal({ user, preselected, onClose, onSent }) {
  const users = getUsers()
  const myEleves = users.filter(u => u.role === 'eleve' && u.agentId === user.id)
  const sessions = getSessions()
  const today = new Date().toDateString()
  const lastSess = sessions.filter(s => s.agentId === user.id && new Date(s.date).toDateString() === today).slice(-1)[0]
  const [type, setType] = useState('email')
  const [selected, setSelected] = useState(new Set(preselected ? [preselected] : myEleves.map(e => e.id)))
  const [subject, setSubject] = useState('Rappel — Session active')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const toggleEleve = id => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const fillRappel = () => setMessage(lastSess ? `Une session est active pour le cours de ${lastSess.matiere}. Merci de te connecter sur l'application pour répondre aux questions.\n\nBonne journée !` : `Rappel de ton agent d'intégration. Merci de te connecter sur l'application.`)
  async function send() {
    if (!message.trim() || selected.size === 0) return
    setSending(true)
    const ejsCfg = getEjsConfig()
    const targets = myEleves.filter(e => selected.has(e.id))
    const logs = []
    for (const eleve of targets) {
      let sent = false, simulated = false
      if (type === 'email' && ejsCfg.configured && eleve.email) {
        try {
          await emailjs.send(ejsCfg.serviceId, ejsCfg.templateId, { to_email: eleve.email, to_name: eleve.name, from_name: user.name, subject, message }, ejsCfg.publicKey)
          sent = true
        } catch { simulated = true; sent = true }
      } else { simulated = true; sent = true }
      logs.push({ id: uid(), agentId: user.id, eleveId: eleve.id, eleveName: eleve.name, type, subject: type === 'email' ? subject : null, message, date: new Date().toISOString(), sent, simulated })
    }
    const all = getNotifs(); logs.forEach(n => all.push(n)); saveNotifs(all)
    setSending(false); onSent()
  }
  return (
    <Modal onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: '1.5rem' }}>Envoyer une notification</div>
      <Field label="Type">
        <div style={{ display: 'flex', border: '0.5px solid #C0C0C0', borderRadius: 8, overflow: 'hidden', marginBottom: '1rem' }}>
          {['email', 'sms'].map(t => (
            <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: 8, textAlign: 'center', fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: type === t ? '#185FA5' : 'transparent', color: type === t ? '#E6F1FB' : '#5E5E5E', transition: 'background .15s' }}>
              {t === 'email' ? '📧 Email' : '📱 SMS'}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Destinataires">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Btn sm onClick={() => setSelected(new Set(myEleves.map(e => e.id)))}>Tous</Btn>
          <Btn sm onClick={() => setSelected(new Set())}>Aucun</Btn>
        </div>
        <div style={{ border: '0.5px solid #E0E0E0', borderRadius: 8, padding: 4 }}>
          {myEleves.map(e => (
            <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleEleve(e.id)} style={{ width: 'auto' }} />
              <Avatar name={e.name} role="eleve" style={{ width: 28, height: 28, fontSize: 11 }} />
              <span style={{ flex: 1 }}>{e.name}</span>
              <span style={{ fontSize: 11, color: '#9E9E9E' }}>{e.email ? '📧' : ''} {e.phone ? '📱' : ''}</span>
            </label>
          ))}
        </div>
      </Field>
      {type === 'email' && <Field label="Sujet"><Input value={subject} onChange={e => setSubject(e.target.value)} /></Field>}
      <Field label="Message">
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <Btn sm onClick={fillRappel}>Rappel session</Btn>
          <Btn sm onClick={() => setMessage('')}>Effacer</Btn>
        </div>
        <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Écris ton message…" />
        {type === 'sms' && <div style={{ fontSize: 11, color: message.length > 160 ? '#A32D2D' : '#9E9E9E', marginTop: 4, textAlign: 'right' }}>{message.length} / 160 caractères</div>}
      </Field>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <Btn onClick={onClose}>Annuler</Btn>
        <Btn variant="primary" disabled={sending} onClick={send}>{sending ? 'Envoi…' : `Envoyer (${selected.size})`}</Btn>
      </div>
    </Modal>
  )
}

// ── Modal : Config EmailJS ──
function EjsConfigModal({ onClose, onSaved }) {
  const cfg = getEjsConfig()
  const [serviceId, setServiceId] = useState(cfg.serviceId)
  const [templateId, setTemplateId] = useState(cfg.templateId)
  const [publicKey, setPublicKey] = useState(cfg.publicKey)
  function save() {
    if (!serviceId || !templateId || !publicKey) return
    saveEjsConfig({ serviceId, templateId, publicKey, configured: true }); onSaved()
  }
  return (
    <Modal onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: '1rem' }}>Configurer EmailJS</div>
      <Alert variant="info">
        1. Créez un compte sur <strong>emailjs.com</strong><br />
        2. Créez un <strong>Service</strong> (Gmail, Outlook…)<br />
        3. Créez un <strong>Template</strong> avec les variables : <code>to_email</code>, <code>to_name</code>, <code>from_name</code>, <code>subject</code>, <code>message</code><br />
        4. Copiez vos clés ci-dessous
      </Alert>
      <Field label="Service ID"><Input value={serviceId} onChange={e => setServiceId(e.target.value)} placeholder="service_xxxxxxx" /></Field>
      <Field label="Template ID"><Input value={templateId} onChange={e => setTemplateId(e.target.value)} placeholder="template_xxxxxxx" /></Field>
      <Field label="Public Key"><Input value={publicKey} onChange={e => setPublicKey(e.target.value)} placeholder="xxxxxxxxxxxxxxxxxxxx" /></Field>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <Btn onClick={onClose}>Annuler</Btn>
        {cfg.configured && <Btn variant="danger" onClick={() => { saveEjsConfig({ serviceId: '', templateId: '', publicKey: '', configured: false }); onSaved() }}>Réinitialiser</Btn>}
        <Btn variant="primary" onClick={save}>Enregistrer</Btn>
      </div>
    </Modal>
  )
}
