import React, { useState, useEffect } from 'react'
import { getUsers, saveUsers } from '../storage'
import { Card, Field, Input, Btn, Alert } from './UI'

export default function ResetPassword({ onDone }) {
  const [state, setState] = useState('loading') // loading | valid | expired | invalid | success
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) { setState('invalid'); return }

    try {
      const decoded = JSON.parse(atob(token))
      const { userId, expires } = decoded
      if (Date.now() > expires) { setState('expired'); return }
      const user = getUsers().find(u => u.id === userId)
      if (!user) { setState('invalid'); return }
      setUserId(userId)
      setUserName(user.name)
      setState('valid')
    } catch {
      setState('invalid')
    }
  }, [])

  function submit() {
    if (!newPw) { setErr('Saisis un nouveau mot de passe.'); return }
    if (newPw.length < 6) { setErr('Le mot de passe doit faire au moins 6 caractères.'); return }
    if (newPw !== confirmPw) { setErr('Les mots de passe ne correspondent pas.'); return }
    const users = getUsers()
    const idx = users.findIndex(u => u.id === userId)
    if (idx < 0) { setErr('Utilisateur introuvable.'); return }
    users[idx].password = newPw
    saveUsers(users)
    // Nettoyer l'URL
    window.history.replaceState({}, '', window.location.pathname)
    setState('success')
  }

  const wrap = children => (
    <div style={{ maxWidth: 400, margin: '3rem auto', padding: '0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>EduCheck</div>
      </div>
      <Card>{children}</Card>
    </div>
  )

  if (state === 'loading') return wrap(<div style={{ textAlign: 'center', padding: '2rem', color: '#9E9E9E' }}>Vérification…</div>)

  if (state === 'expired') return wrap(
    <>
      <div style={{ fontSize: 36, textAlign: 'center', marginBottom: '1rem' }}>⏱️</div>
      <Alert variant="warning">Ce lien a expiré (valable 1 heure). Demande un nouveau lien depuis la page de connexion.</Alert>
      <Btn variant="primary" style={{ width: '100%' }} onClick={onDone}>Retour à la connexion</Btn>
    </>
  )

  if (state === 'invalid') return wrap(
    <>
      <div style={{ fontSize: 36, textAlign: 'center', marginBottom: '1rem' }}>❌</div>
      <Alert variant="warning">Lien invalide ou déjà utilisé.</Alert>
      <Btn variant="primary" style={{ width: '100%' }} onClick={onDone}>Retour à la connexion</Btn>
    </>
  )

  if (state === 'success') return wrap(
    <>
      <div style={{ fontSize: 36, textAlign: 'center', marginBottom: '1rem' }}>✅</div>
      <div style={{ fontSize: 16, fontWeight: 500, textAlign: 'center', marginBottom: 8 }}>Mot de passe modifié !</div>
      <div style={{ fontSize: 14, color: '#5E5E5E', textAlign: 'center', marginBottom: '1.5rem' }}>Tu peux maintenant te connecter avec ton nouveau mot de passe.</div>
      <Btn variant="primary" style={{ width: '100%' }} onClick={onDone}>Se connecter</Btn>
    </>
  )

  return wrap(
    <>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Nouveau mot de passe</div>
      <div style={{ fontSize: 14, color: '#5E5E5E', marginBottom: '1.5rem' }}>Bonjour {userName}, choisis ton nouveau mot de passe.</div>
      {err && <Alert variant="warning">{err}</Alert>}
      <Field label="Nouveau mot de passe">
        <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Au moins 6 caractères" />
      </Field>
      <Field label="Confirmer le mot de passe">
        <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••"
          onKeyDown={e => e.key === 'Enter' && submit()} />
      </Field>
      <Btn variant="primary" style={{ width: '100%', marginTop: 8 }} onClick={submit}>Enregistrer</Btn>
    </>
  )
}
