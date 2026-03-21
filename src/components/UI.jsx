import React from 'react'
import { initials } from '../storage'

const s = {
  card: {
    background: '#fff',
    border: '0.5px solid #E0E0E0',
    borderRadius: 12,
    padding: '1.5rem',
  },
  btn: (variant = 'default') => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', border: '0.5px solid #C0C0C0',
    background: variant === 'primary' ? '#185FA5'
      : variant === 'danger' ? '#A32D2D'
      : variant === 'success' ? '#3B6D11'
      : variant === 'warning' ? '#854F0B'
      : 'transparent',
    color: variant === 'default' ? '#1A1A1A' : variant === 'primary' ? '#E6F1FB'
      : variant === 'danger' ? '#FCEBEB'
      : variant === 'success' ? '#EAF3DE'
      : '#FAEEDA',
    borderColor: variant === 'primary' ? '#185FA5'
      : variant === 'danger' ? '#A32D2D'
      : variant === 'success' ? '#3B6D11'
      : variant === 'warning' ? '#854F0B'
      : '#C0C0C0',
  }),
}

export function Card({ children, style, noPad }) {
  return <div style={{ ...s.card, ...(noPad ? { padding: 0 } : {}), ...style }}>{children}</div>
}

export function Btn({ children, variant = 'default', sm, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...s.btn(variant),
        ...(sm ? { padding: '4px 10px', fontSize: 12 } : {}),
        ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Avatar({ name, role }) {
  const bg = role === 'agent' ? '#C0DD97' : role === 'admin' ? '#F5C4B3' : '#B5D4F4'
  const color = role === 'agent' ? '#3B6D11' : role === 'admin' ? '#993C1D' : '#0C447C'
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', background: bg, color,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 500, flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  )
}

export function Badge({ children, variant = 'gray' }) {
  const styles = {
    green: { background: '#EAF3DE', color: '#3B6D11' },
    red: { background: '#FCEBEB', color: '#A32D2D' },
    gray: { background: '#F0F0F0', color: '#5E5E5E' },
    blue: { background: '#E6F1FB', color: '#185FA5' },
    amber: { background: '#FAEEDA', color: '#854F0B' },
    teal: { background: '#E1F5EE', color: '#0F6E56' },
  }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 99,
      fontSize: 12, fontWeight: 500, ...styles[variant],
    }}>
      {children}
    </span>
  )
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && <label style={{ fontSize: 13, color: '#5E5E5E', display: 'block', marginBottom: 5 }}>{label}</label>}
      {children}
    </div>
  )
}

export function Input({ type = 'text', value, onChange, placeholder, id }) {
  return (
    <input
      id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: '0.5px solid #C0C0C0', fontSize: 14, outline: 'none',
        background: '#fff', color: '#1A1A1A',
      }}
      onFocus={e => { e.target.style.borderColor = '#378ADD'; e.target.style.boxShadow = '0 0 0 2px rgba(55,138,221,.15)' }}
      onBlur={e => { e.target.style.borderColor = '#C0C0C0'; e.target.style.boxShadow = 'none' }}
    />
  )
}

export function Select({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange}
      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '0.5px solid #C0C0C0', fontSize: 14, outline: 'none', background: '#fff', color: '#1A1A1A' }}>
      {children}
    </select>
  )
}

export function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '0.5px solid #C0C0C0', fontSize: 14, outline: 'none', background: '#fff', color: '#1A1A1A', resize: 'vertical', fontFamily: 'inherit' }}
      onFocus={e => { e.target.style.borderColor = '#378ADD' }}
      onBlur={e => { e.target.style.borderColor = '#C0C0C0' }}
    />
  )
}

export function Alert({ children, variant = 'info' }) {
  const styles = {
    info: { background: '#E6F1FB', color: '#185FA5', border: '0.5px solid #85B7EB' },
    warning: { background: '#FAEEDA', color: '#854F0B', border: '0.5px solid #EF9F27' },
    success: { background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #97C459' },
    teal: { background: '#E1F5EE', color: '#0F6E56', border: '0.5px solid #5DCAA5' },
  }
  return (
    <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: '1rem', lineHeight: 1.6, ...styles[variant] }}>
      {children}
    </div>
  )
}

export function Divider() {
  return <div style={{ height: '0.5px', background: '#E0E0E0', margin: '1.5rem 0' }} />
}

export function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: '#F0F0F0', borderRadius: 8, padding: '1rem', flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 12, color: '#5E5E5E', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: color || '#1A1A1A' }}>{value}</div>
    </div>
  )
}

export function Modal({ children, onClose }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div style={{
        background: '#fff', border: '0.5px solid #E0E0E0', borderRadius: 12,
        padding: '1.5rem', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
      }}>
        {children}
      </div>
    </div>
  )
}

export function TopBar({ user, onLogout }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '0.5px solid #E0E0E0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={user.name} role={user.role} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: '#5E5E5E' }}>
            {{ agent: "Agent d'intégration", admin: 'Administrateur', eleve: 'Élève' }[user.role]}
          </div>
        </div>
      </div>
      <Btn sm onClick={onLogout}>Déconnexion</Btn>
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: '#F0F0F0', padding: 4, borderRadius: 8, flexWrap: 'wrap' }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          style={{
            flex: 1, minWidth: 70, padding: '7px', textAlign: 'center', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', borderRadius: 6, border: active === t.key ? '0.5px solid #E0E0E0' : 'none',
            background: active === t.key ? '#fff' : 'transparent',
            color: active === t.key ? '#1A1A1A' : '#5E5E5E',
          }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ value }) {
  return (
    <div style={{ height: 4, background: '#F0F0F0', borderRadius: 2, marginBottom: '1.5rem' }}>
      <div style={{ height: '100%', background: '#185FA5', borderRadius: 2, width: `${value}%`, transition: 'width .3s' }} />
    </div>
  )
}

export function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9E9E9E', marginBottom: 12 }}>{children}</div>
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9E9E9E', pointerEvents: 'none' }}>🔍</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Rechercher…'}
        style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 8, border: '0.5px solid #C0C0C0', fontSize: 14, outline: 'none' }}
      />
    </div>
  )
}

export function Table({ headers, rows, empty }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} onClick={h.onClick}
              style={{ textAlign: 'left', fontSize: 12, fontWeight: 500, color: '#5E5E5E', padding: '8px 12px', borderBottom: '0.5px solid #E0E0E0', cursor: h.onClick ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
              {h.label}{h.sort ? <span style={{ marginLeft: 4, opacity: h.active ? 1 : .4 }}>{h.sort}</span> : null}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={headers.length} style={{ textAlign: 'center', padding: '2rem', color: '#9E9E9E', fontSize: 14 }}>{empty || 'Aucun résultat'}</td></tr>
          : rows.map((row, i) => (
            <tr key={i} style={{ cursor: 'default' }}
              onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = '#F8F8F8')}
              onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = '')}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '10px 12px', borderBottom: i < rows.length - 1 ? '0.5px solid #E0E0E0' : 'none', verticalAlign: 'middle' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
      </tbody>
    </table>
  )
}
