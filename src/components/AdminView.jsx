import React, { useState } from 'react'
import emailjs from '@emailjs/browser'
import { getUsers, saveUsers, getSessions, getResponses, getNotifs, getEjsConfig, uid, initials, fmt } from '../storage'
import { Card, TopBar, Tabs, Btn, Badge, Avatar, Field, Input, Select, Alert, Modal, MetricCard, SectionTitle, SearchInput, Table, Divider, Textarea } from './UI'

export default function AdminView({ user, onLogout }) {
  const [tab, setTab] = useState('comptes')
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ col: 'role', dir: 1 })
  const [, refresh] = useState(0)
  const rerender = () => refresh(n => n + 1)
  const closeModal = () => setModal(null)

  const TABS = [
    { key: 'comptes', label: 'Gestion des comptes' },
    { key: 'stats', label: "Vue d'ensemble" },
  ]

  const roleOrder = { admin: 0, agent: 1, eleve: 2 }
  const roleBadge = { admin: 'amber', agent: 'blue', eleve: 'gray' }
  const roleLabel = { admin: 'Admin', agent: 'Agent', eleve: 'Élève' }

  function renderComptes() {
    const users = getUsers()
    let filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase()))
    filtered = [...filtered].sort((a, b) => {
      if (sort.col === 'role') return sort.dir * (roleOrder[a.role] - roleOrder[b.role])
      return sort.dir * a.name.localeCompare(b.name)
    })
    const sortArrow = col => sort.col === col ? (sort.dir === 1 ? '↑' : '↓') : '↕'
    const toggleSort = col => setSort(s => ({ col, dir: s.col === col ? s.dir * -1 : 1 }))
    const rows = filtered.map(u => [
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={u.name} role={u.role} />
        <span>{u.name}</span>
      </div>,
      <code style={{ fontSize: 13 }}>{u.id}</code>,
      <Badge variant={roleBadge[u.role]}>{roleLabel[u.role]}</Badge>,
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Btn sm onClick={() => setModal({ type: 'edit', userId: u.id })}>Modifier</Btn>
        {u.email && <Btn sm onClick={() => setModal({ type: 'send_message', user: u, channel: 'email' })} title={`Email à ${u.name}`}>✉</Btn>}
        {u.phone && <Btn sm onClick={() => setModal({ type: 'send_message', user: u, channel: 'sms' })} title={`SMS à ${u.name}`}>📱</Btn>}
        {u.id !== 'admin' && <Btn sm variant="danger" onClick={() => setModal({ type: 'delete', userId: u.id })}>Suppr.</Btn>}
      </div>
    ])
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 14, color: '#5E5E5E' }}>{users.length} compte(s)</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Btn variant="primary" onClick={() => setModal({ type: 'create', role: 'eleve' })}>+ Élève</Btn>
            <Btn variant="success" onClick={() => setModal({ type: 'create', role: 'agent' })}>+ Agent</Btn>
            <Btn variant="warning" onClick={() => setModal({ type: 'create', role: 'admin' })}>+ Admin</Btn>
          </div>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par nom ou identifiant…" />
        <Card noPad>
          <Table
            headers={[
              { label: 'Nom', sort: sortArrow('name'), active: sort.col === 'name', onClick: () => toggleSort('name') },
              { label: 'Identifiant' },
              { label: 'Rôle', sort: sortArrow('role'), active: sort.col === 'role', onClick: () => toggleSort('role') },
              { label: 'Actions' },
            ]}
            rows={rows}
            empty="Aucun résultat"
          />
        </Card>
      </div>
    )
  }

  function renderStats() {
    const users = getUsers()
    const sessions = getSessions()
    const responses = getResponses()
    const notifs = getNotifs()
    const agents = users.filter(u => u.role === 'agent')
    const eleves = users.filter(u => u.role === 'eleve')
    const totalOublis = responses.filter(r => {
      const sess = sessions.find(s => s.id === r.sessionId)
      const fq = (sess?.questions || [])[0]
      return fq && r.answers?.[fq.id] === 'non'
    }).length
    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <MetricCard label="Comptes total" value={users.length} />
          <MetricCard label="Agents" value={agents.length} />
          <MetricCard label="Élèves" value={eleves.length} />
          <MetricCard label="Sessions" value={sessions.length} />
          <MetricCard label="Oublis total" value={totalOublis} color="#A32D2D" />
          <MetricCard label="Notifications" value={notifs.length} />
        </div>
        <SectionTitle>Par agent</SectionTitle>
        {agents.length === 0
          ? <div style={{ textAlign: 'center', padding: '2rem', color: '#9E9E9E' }}>Aucun agent.</div>
          : agents.map(a => {
            const aSess = sessions.filter(s => s.agentId === a.id).length
            const aEl = users.filter(u => u.role === 'eleve' && u.agentId === a.id).length
            const aNotifs = notifs.filter(n => n.agentId === a.id).length
            return (
              <div key={a.id} style={{ padding: '12px 0', borderBottom: '0.5px solid #E0E0E0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={a.name} role="agent" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: '#5E5E5E' }}>{aEl} élève(s) · {aSess} session(s) · {aNotifs} notif(s)</div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    )
  }

  function renderModal() {
    if (!modal) return null
    if (modal.type === 'send_message') return <SendMessageModal user={modal.user} defaultChannel={modal.channel} onClose={closeModal} />
    if (modal.type === 'create') return <CreateUserModal role={modal.role} onClose={closeModal} onCreated={() => { rerender(); closeModal() }} />
    if (modal.type === 'edit') return <EditUserModal userId={modal.userId} onClose={closeModal} onSaved={() => { rerender(); closeModal() }} />
    if (modal.type === 'delete') {
      const u = getUsers().find(x => x.id === modal.userId)
      return (
        <Modal onClose={closeModal}>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Confirmer la suppression</div>
          <div style={{ fontSize: 14, color: '#5E5E5E', marginBottom: '1.5rem' }}>
            Supprimer <strong>{u?.name}</strong> ? Cette action est irréversible.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn onClick={closeModal}>Annuler</Btn>
            <Btn variant="danger" onClick={() => { saveUsers(getUsers().filter(x => x.id !== modal.userId)); rerender(); closeModal() }}>Supprimer</Btn>
          </div>
        </Modal>
      )
    }
    return null
  }

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <TopBar user={user} onLogout={onLogout} />
      <div style={{ marginTop: '1.5rem' }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'comptes' && renderComptes()}
        {tab === 'stats' && renderStats()}
      </div>
      {renderModal()}
    </div>
  )
}

function CreateUserModal({ role, onClose, onCreated }) {
  const rl = { admin: 'Admin', agent: 'Agent', eleve: 'Élève' }[role]
  const agents = getUsers().filter(u => u.role === 'agent')
  const [name, setName] = useState('')
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [agentId, setAgentId] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState('')
  function create() {
    if (!name || !id || !pw) { setErr('Remplis tous les champs obligatoires.'); return }
    const users = getUsers()
    if (users.find(u => u.id === id)) { setErr('Cet identifiant existe déjà.'); return }
    const nu = { id, name, role, password: pw }
    if (agentId) nu.agentId = agentId
    if (email) nu.email = email
    if (phone) nu.phone = phone
    users.push(nu); saveUsers(users); onCreated()
  }
  return (
    <Modal onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: '1.5rem' }}>Créer un compte {rl}</div>
      {err && <Alert variant="warning">{err}</Alert>}
      <Field label="Nom complet *"><Input value={name} onChange={e => setName(e.target.value)} placeholder="ex: Sophie Dumont" /></Field>
      <Field label="Identifiant *"><Input value={id} onChange={e => setId(e.target.value)} placeholder="ex: sophie1" /></Field>
      <Field label="Mot de passe *"><Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" /></Field>
      {role === 'eleve' && <>
        <Field label="Agent référent">
          <Select value={agentId} onChange={e => setAgentId(e.target.value)}>
            <option value="">Aucun</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        <Field label="Email (pour notifications)"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="eleve@example.com" /></Field>
        <Field label="Téléphone (pour SMS)"><Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+32470000000" /></Field>
      </>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <Btn onClick={onClose}>Annuler</Btn>
        <Btn variant="primary" onClick={create}>Créer</Btn>
      </div>
    </Modal>
  )
}

function EditUserModal({ userId, onClose, onSaved }) {
  const users = getUsers()
  const u = users.find(x => x.id === userId)
  const agents = users.filter(x => x.role === 'agent')
  const [name, setName] = useState(u?.name || '')
  const [pw, setPw] = useState('')
  const [agentId, setAgentId] = useState(u?.agentId || '')
  const [email, setEmail] = useState(u?.email || '')
  const [phone, setPhone] = useState(u?.phone || '')
  function save() {
    const all = getUsers()
    const idx = all.findIndex(x => x.id === userId)
    if (idx < 0) return
    if (name) all[idx].name = name
    if (pw) all[idx].password = pw
    all[idx].email = email
    all[idx].phone = phone
    if (u?.role === 'eleve') all[idx].agentId = agentId
    saveUsers(all); onSaved()
  }
  return (
    <Modal onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: '1.5rem' }}>Modifier : {u?.name}</div>
      <Field label="Nom complet"><Input value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label={<span>Nouveau mot de passe <span style={{ fontWeight: 400, color: '#9E9E9E' }}>(vide = inchangé)</span></span>}>
        <Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" />
      </Field>
      <Field label="Email (pour réinitialisation du mot de passe)">
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="exemple@email.com" />
      </Field>
      <Field label="Téléphone (pour SMS)">
        <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+32470000000" />
      </Field>
      {u?.role === 'eleve' && <>
        <Field label="Agent référent">
          <Select value={agentId} onChange={e => setAgentId(e.target.value)}>
            <option value="">Aucun</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
      </>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <Btn onClick={onClose}>Annuler</Btn>
        <Btn variant="primary" onClick={save}>Enregistrer</Btn>
      </div>
    </Modal>
  )
}

function SendMessageModal({ user, defaultChannel, onClose }) {
  const [channel, setChannel] = useState(defaultChannel || 'email')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null) // null | success | error

  async function send() {
    if (!message.trim()) return
    setSending(true)
    const ejsCfg = getEjsConfig()

    if (channel === 'email') {
      if (!ejsCfg.configured) {
        setStatus({ type: 'error', text: "EmailJS n'est pas configuré. Configure-le depuis l'interface agent → Notifications." })
        setSending(false); return
      }
      try {
        await emailjs.send(
          ejsCfg.serviceId, ejsCfg.templateId,
          { to_email: user.email, to_name: user.name, from_name: 'EduCheck', subject: subject || 'Message de EduCheck', message },
          ejsCfg.publicKey
        )
        setStatus({ type: 'success', text: `Email envoyé à ${user.email} !` })
      } catch {
        setStatus({ type: 'error', text: "Erreur lors de l'envoi. Vérifie la configuration EmailJS." })
      }
    } else {
      // SMS simulé
      setStatus({ type: 'success', text: `SMS simulé envoyé à ${user.phone}. (Twilio requis pour l'envoi réel)` })
    }
    setSending(false)
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <Avatar name={user.name} role={user.role} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: '#9E9E9E' }}>
            {user.email && `📧 ${user.email}`}{user.email && user.phone && ' · '}{user.phone && `📱 ${user.phone}`}
          </div>
        </div>
      </div>

      {status && (
        <Alert variant={status.type === 'success' ? 'success' : 'warning'}>{status.text}</Alert>
      )}

      {!status && <>
        <Field label="Canal">
          <div style={{ display: 'flex', border: '0.5px solid #C0C0C0', borderRadius: 8, overflow: 'hidden', marginBottom: '1rem' }}>
            {user.email && (
              <button onClick={() => setChannel('email')} style={{ flex: 1, padding: 8, textAlign: 'center', fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: channel === 'email' ? '#185FA5' : 'transparent', color: channel === 'email' ? '#E6F1FB' : '#5E5E5E', transition: 'background .15s' }}>
                📧 Email
              </button>
            )}
            {user.phone && (
              <button onClick={() => setChannel('sms')} style={{ flex: 1, padding: 8, textAlign: 'center', fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: channel === 'sms' ? '#185FA5' : 'transparent', color: channel === 'sms' ? '#E6F1FB' : '#5E5E5E', transition: 'background .15s' }}>
                📱 SMS
              </button>
            )}
          </div>
        </Field>
        {channel === 'email' && (
          <Field label="Sujet">
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="ex: Informations importantes" />
          </Field>
        )}
        <Field label="Message">
          <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Écris ton message…" />
          {channel === 'sms' && (
            <div style={{ fontSize: 11, color: message.length > 160 ? '#A32D2D' : '#9E9E9E', marginTop: 4, textAlign: 'right' }}>
              {message.length} / 160 caractères
            </div>
          )}
        </Field>
        {channel === 'sms' && <Alert variant="teal">📱 Les SMS sont simulés sans backend Twilio.</Alert>}
      </>}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <Btn onClick={onClose}>Fermer</Btn>
        {!status && <Btn variant="primary" disabled={sending} onClick={send}>{sending ? 'Envoi…' : 'Envoyer'}</Btn>}
      </div>
    </Modal>
  )
}
