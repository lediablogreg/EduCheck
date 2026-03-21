import React, { useState } from 'react'
import { getUsers } from '../storage'
import { Card, Field, Input, Btn, Alert, Divider } from './UI'

export default function Login({ onLogin }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  function doLogin() {
    const u = getUsers().find(u => u.id === id.trim() && u.password === pw)
    if (!u) { setErr('Identifiant ou mot de passe incorrect.'); return }
    onLogin(u)
  }

  return (
    <div style={{ maxWidth: 360, margin: '3rem auto', padding: '0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>Suivi scolaire</div>
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
        <Divider />
        <div style={{ fontSize: 12, color: '#9E9E9E', lineHeight: 2 }}>
          <strong style={{ color: '#5E5E5E' }}>Comptes de démo</strong><br />
          Admin : <code>admin</code> / <code>admin123</code><br />
          Agent : <code>agent1</code> / <code>agent123</code><br />
          Élèves : <code>eleve1</code>/<code>lea123</code> · <code>eleve2</code>/<code>tom123</code>
        </div>
      </Card>
    </div>
  )
}
