import React, { useState } from 'react'
import Login from './components/Login'
import EleveView from './components/EleveView'
import AgentView from './components/AgentView'
import AdminView from './components/AdminView'

export default function App() {
  const [user, setUser] = useState(null)

  function handleLogin(u) { setUser(u) }
  function handleLogout() { setUser(null) }

  if (!user) return <Login onLogin={handleLogin} />
  if (user.role === 'admin') return <AdminView user={user} onLogout={handleLogout} />
  if (user.role === 'agent') return <AgentView user={user} onLogout={handleLogout} />
  return <EleveView user={user} onLogout={handleLogout} />
}
