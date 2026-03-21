import React, { useState, useEffect } from 'react'
import Login from './components/Login'
import EleveView from './components/EleveView'
import AgentView from './components/AgentView'
import AdminView from './components/AdminView'
import ResetPassword from './components/ResetPassword'

export default function App() {
  const [user, setUser] = useState(null)
  const [isReset, setIsReset] = useState(false)

  useEffect(() => {
    // Détecter un lien de réinitialisation (?token=...)
    const params = new URLSearchParams(window.location.search)
    if (params.get('token')) setIsReset(true)
  }, [])

  function handleLogin(u) { setUser(u) }
  function handleLogout() { setUser(null) }
  function handleResetDone() {
    setIsReset(false)
    window.history.replaceState({}, '', window.location.pathname)
  }

  if (isReset) return <ResetPassword onDone={handleResetDone} />
  if (!user) return <Login onLogin={handleLogin} />
  if (user.role === 'admin') return <AdminView user={user} onLogout={handleLogout} />
  if (user.role === 'agent') return <AgentView user={user} onLogout={handleLogout} />
  return <EleveView user={user} onLogout={handleLogout} />
}
