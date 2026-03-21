import React, { useState, useEffect } from 'react'
import { getSessions, getResponses, saveResponses, uid } from '../storage'
import { Card, TopBar, Badge, ProgressBar, Btn, Textarea } from './UI'

export default function EleveView({ user, onLogout }) {
  const [state, setState] = useState('loading') // loading | no_session | no_questions | questions | done
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [freeText, setFreeText] = useState('')
  const [doneResp, setDoneResp] = useState(null)

  useEffect(() => {
    const sessions = getSessions()
    const today = new Date().toDateString()
    const todaySess = sessions.filter(s => new Date(s.date).toDateString() === today)
    if (!todaySess.length) { setState('no_session'); return }
    const sess = todaySess[todaySess.length - 1]
    setSession(sess)
    const done = getResponses().find(r => r.sessionId === sess.id && r.eleveId === user.id)
    if (done) { setDoneResp(done); setState('done'); return }
    const myQs = (sess.questions || []).filter(q => !q.assignedTo?.length || q.assignedTo.includes(user.id))
    if (!myQs.length) { setState('no_questions'); return }
    setQuestions(myQs)
    setState('questions')
  }, [])

  function answer(val) {
    const q = questions[qIndex]
    const newAnswers = { ...answers, [q.id]: val }
    let newQs = [...questions]
    if (q.type === 'oui_non' && q.followup && val !== q.followup.condition) {
      newQs = newQs.filter(qq => qq.id !== q.followup.questionId)
    }
    if (qIndex + 1 >= newQs.length) {
      // submit
      const resp = { id: uid(), sessionId: session.id, eleveId: user.id, eleveName: user.name, answers: newAnswers, date: session.date }
      const all = getResponses(); all.push(resp); saveResponses(all)
      setDoneResp(resp); setState('done')
    } else {
      setAnswers(newAnswers); setQuestions(newQs); setQIndex(qIndex + 1); setFreeText('')
    }
  }

  const wrap = children => (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <TopBar user={user} onLogout={onLogout} />
      <div style={{ marginTop: '1rem' }}>{children}</div>
    </div>
  )

  if (state === 'loading') return wrap(<div />)

  if (state === 'no_session') return wrap(
    <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
      <div style={{ fontSize: 36, marginBottom: '1rem' }}>📋</div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Aucune session active</div>
      <div style={{ fontSize: 14, color: '#5E5E5E' }}>Ton agent n'a pas encore lancé de session aujourd'hui.</div>
    </Card>
  )

  if (state === 'no_questions') return wrap(
    <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
      <div style={{ fontSize: 36, marginBottom: '1rem' }}>✅</div>
      <div style={{ fontSize: 16, fontWeight: 500 }}>Aucune question pour toi aujourd'hui.</div>
    </Card>
  )

  if (state === 'done') {
    const sess = getSessions().find(s => s.id === doneResp.sessionId) || {}
    const qs = (sess.questions || []).filter(q => doneResp.answers?.[q.id] !== undefined)
    return wrap(
      <Card style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <div style={{ fontSize: 40, marginBottom: '1rem' }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Merci, {user.name.split(' ')[0]} !</div>
        <div style={{ fontSize: 14, color: '#5E5E5E', marginBottom: '1.5rem' }}>Tes réponses ont bien été enregistrées.</div>
        <div style={{ textAlign: 'left', background: '#F8F8F8', borderRadius: 8, padding: '1rem' }}>
          {qs.map(q => (
            <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #E0E0E0' }}>
              <span style={{ fontSize: 13, color: '#5E5E5E', flex: 1 }}>{q.text}</span>
              <Badge variant={doneResp.answers[q.id] === 'oui' ? 'green' : doneResp.answers[q.id] === 'non' ? 'red' : 'gray'}>
                {doneResp.answers[q.id]}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const q = questions[qIndex]
  const pct = Math.round((qIndex / questions.length) * 100)

  return wrap(
    <Card>
      <ProgressBar value={pct} />
      <div style={{ fontSize: 12, color: '#5E5E5E', marginBottom: '1.5rem' }}>
        Question {qIndex + 1} sur {questions.length}
      </div>
      <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
        <div style={{ fontSize: 19, fontWeight: 500, marginBottom: '1.5rem', lineHeight: 1.5 }}>{q.text}</div>
        {q.type === 'oui_non' ? (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn variant="success" style={{ padding: '10px 32px', fontSize: 15 }} onClick={() => answer('oui')}>Oui</Btn>
            <Btn variant="danger" style={{ padding: '10px 32px', fontSize: 15 }} onClick={() => answer('non')}>Non</Btn>
          </div>
        ) : (
          <div>
            <Textarea value={freeText} onChange={e => setFreeText(e.target.value)} placeholder="Ta réponse…" />
            <Btn variant="primary" style={{ marginTop: 12 }} onClick={() => answer(freeText || '(sans réponse)')}>Valider</Btn>
          </div>
        )}
      </div>
    </Card>
  )
}
