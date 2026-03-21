import React, { useState } from 'react'
import emailjs from '@emailjs/browser'
import { getUsers, getEjsConfig } from '../storage'
import { Card, Field, Input, Btn, Alert, Divider } from './UI'

export default function Login({ onLogin }) {
  const [view, setView] = useState('login') // login | forgot | sent
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [forgotErr, setForgotErr] = useState('')

  function doLogin() {
    const u = getUsers().find(u => u.id === id.trim() && u.password === pw)
    if (!u) { setErr('Identifiant ou mot de passe incorrect.'); return }
    onLogin(u)
  }

  async function sendReset() {
    setForgotErr('')
    const users = getUsers()
    const user = users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user) { setForgotErr("Aucun compte trouvé avec cette adresse email."); return }
    const ejsCfg = getEjsConfig()
    if (!ejsCfg.configured) {
      setForgotErr("EmailJS n'est pas encore configuré. Contacte ton agent ou administrateur.")
      return
    }
    setSending(true)
    try {
      const token = btoa(JSON.stringify({
        userId: user.id,
        expires: Date.now() + 60 * 60 * 1000,
        nonce: Math.random().toString(36).slice(2),
      }))
      const resetUrl = `${window.location.origin}${window.location.pathname}?token=${token}`
      await emailjs.send(
        ejsCfg.serviceId,
        ejsCfg.templateId,
        {
          to_email: user.email,
          to_name: user.name,
          from_name: 'EduCheck',
          subject: 'Réinitialisation de ton mot de passe — EduCheck',
          message: `Bonjour ${user.name},\n\nClique sur le lien ci-dessous pour réinitialiser ton mot de passe. Ce lien est valable 1 heure.\n\n${resetUrl}\n\nSi tu n'as pas demandé cette réinitialisation, ignore cet email.\n\nL'équipe EduCheck`,
        },
        ejsCfg.publicKey
      )
      setView('sent')
    } catch {
      setForgotErr("Erreur lors de l'envoi. Vérifie la configuration EmailJS.")
    }
    setSending(false)
  }

  if (view === 'login') return (
    <div style={{ maxWidth: 360, margin: '3rem auto', padding: '0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>EduCheck</div>
        <div style={{ fontSize: 14, color: '#5E5E5E' }}>Connectez-vous pour continuer</div>
      </div>
      <Card>
        {err && <Alert variant="warning">{err}</Alert>}
        <Field label="Identifiant">
          <Input value={id} onChange={e => setId(e.target.value)} placeholder="ex: eleve1" />
        </Field>
        <Field label="Mot de passe">
          <Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && doLogin()} />
        </Field>
        <Btn variant="primary" style={{ width: '100%', marginTop: 8 }} onClick={doLogin}>
          Se connecter
        </Btn>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button onClick={() => { setView('forgot'); setErr('') }}
            style={{ background: 'none', border: 'none', color: '#185FA5', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
            Mot de passe oublié ?
          </button>
        </div>
       </Card>
    </div>
  )

  if (view === 'forgot') return (
    <div style={{ maxWidth: 360, margin: '3rem auto', padding: '0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>EduCheck</div>
        <div style={{ fontSize: 14, color: '#5E5E5E' }}>Réinitialiser mon mot de passe</div>
      </div>
      <Card>
        <div style={{ fontSize: 14, color: '#5E5E5E', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Saisis l'adresse email associée à ton compte. Tu recevras un lien valable <strong>1 heure</strong>.
        </div>
        {forgotErr && <Alert variant="warning">{forgotErr}</Alert>}
        <Field label="Adresse email">
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ton.email@example.com"
            onKeyDown={e => e.key === 'Enter' && sendReset()} />
        </Field>
        <Btn variant="primary" style={{ width: '100%', marginTop: 8 }} disabled={sending} onClick={sendReset}>
          {sending ? 'Envoi en cours…' : 'Envoyer le lien'}
        </Btn>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button onClick={() => { setView('login'); setForgotErr('') }}
            style={{ background: 'none', border: 'none', color: '#185FA5', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
            ← Retour à la connexion
          </button>
        </div>
      </Card>
    </div>
  )

  return (
    <div style={{ maxWidth: 360, margin: '3rem auto', padding: '0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>EduCheck</div>
      </div>
      <Card style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: '1rem' }}>📧</div>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Email envoyé !</div>
        <div style={{ fontSize: 14, color: '#5E5E5E', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Un lien a été envoyé à <strong>{email}</strong>.<br />
          Vérifie aussi tes spams. Le lien expire dans 1 heure.
        </div>
        <Btn variant="primary" style={{ width: '100%' }} onClick={() => setView('login')}>
          Retour à la connexion
        </Btn>
      </Card>
    </div>
  )
}
