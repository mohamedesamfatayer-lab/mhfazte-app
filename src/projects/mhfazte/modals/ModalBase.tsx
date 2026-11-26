'use client'

import { ReactNode, useEffect } from 'react'

export default function ModalBase({ title, onClose, children }: {
  title: string; onClose: () => void; children: ReactNode
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.55)',
        zIndex: 500, display: 'flex',
        alignItems: 'flex-end',
        backdropFilter: 'blur(2px)',
        direction: 'rtl',
      }}
    >
      <div style={{
        background: '#1e2f45',
        borderRadius: '24px 24px 0 0',
        padding: '1.5rem',
        width: '100%', maxWidth: 430,
        margin: '0 auto',
        maxHeight: '88vh', overflowY: 'auto',
        animation: 'slideUp .25s ease',
      }}>
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,.15)', borderRadius: 4, margin: '0 auto 1.3rem' }} />
        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.2rem', color: '#e2e8f0' }}>{title}</div>
        {children}
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  )
}

export function FormGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

export const inputSt: React.CSSProperties = {
  width: '100%', background: '#131e2d',
  border: '1.5px solid rgba(255,255,255,.1)',
  borderRadius: 10, padding: '.72rem 1rem',
  color: '#e2e8f0', fontSize: '.9rem', outline: 'none',
  fontFamily: 'Cairo, sans-serif', direction: 'rtl',
  boxSizing: 'border-box',
}

export const CURRENCIES = ['EGP', 'SAR', 'USD'] as const
export type Currency = typeof CURRENCIES[number]

export function CurrencyToggle({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="curr-toggle">
      {CURRENCIES.map(c => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className={`curr-btn ${value === c ? 'active' : ''}`}>
          {c === 'EGP' ? 'ج.م (جنيه)' : c === 'SAR' ? 'ريال سعودي' : 'دولار'}
        </button>
      ))}
    </div>
  )
}

export function BtnPrimary({ children, onClick, loading }: { children: ReactNode; onClick: () => void; loading?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="btn btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>
      {loading ? 'جاري الحفظ...' : children}
    </button>
  )
}

export function BtnOutline({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-outline">
      {children}
    </button>
  )
}
