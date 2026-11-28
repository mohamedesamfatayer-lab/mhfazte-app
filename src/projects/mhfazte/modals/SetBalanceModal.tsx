'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import ModalBase, { BtnPrimary, BtnOutline } from './ModalBase'

const CURRENCIES = [
  { key: 'EGP', label: 'جنيه مصري', symbol: 'ج.م', color: '#2563eb' },
  { key: 'SAR', label: 'ريال سعودي', symbol: 'ر.س', color: '#059669' },
  { key: 'USD', label: 'دولار',       symbol: '$',   color: '#d97706' },
]

const inSt: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 10, padding: '.55rem .8rem', color: '#fff',
  fontSize: '1rem', fontFamily: 'Cairo, sans-serif', outline: 'none',
  boxSizing: 'border-box', textAlign: 'right',
}

interface Props { onClose: () => void; onSaved: () => void }

export default function SetBalanceModal({ onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>({ EGP: '', SAR: '', USD: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await sb.from('mhfazte_account').select('balances').eq('user_id', user.id).single()
      const bal: Record<string, number> = (data as any)?.balances ?? {}
      setValues({
        EGP: bal.EGP != null ? String(bal.EGP) : '',
        SAR: bal.SAR != null ? String(bal.SAR) : '',
        USD: bal.USD != null ? String(bal.USD) : '',
      })
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    setError('')
    for (const [k, v] of Object.entries(values)) {
      if (v !== '' && isNaN(Number(v))) { setError(`قيمة ${k} غير صحيحة`); return }
    }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setError('غير مسجل'); setSaving(false); return }

    const balances: Record<string, number> = {}
    for (const [k, v] of Object.entries(values)) {
      if (v !== '') balances[k] = Number(v)
    }

    await sb.from('mhfazte_account').upsert({ user_id: user.id, balances }, { onConflict: 'user_id' })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <ModalBase title="ضبط رصيد الحساب" onClose={onClose}>
      <p style={{ fontSize: '.75rem', color: '#8899aa', marginBottom: '1.1rem', marginTop: '-.3rem' }}>
        أدخل الرصيد الصحيح لكل عملة. اتركها فارغة لعدم التغيير.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#8899aa', padding: '1rem' }}>
          <i className="fas fa-spinner fa-spin" />
        </div>
      ) : (
        CURRENCIES.map(cur => (
          <div key={cur.key} style={{ marginBottom: '.9rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: `${cur.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '.75rem', fontWeight: 800, color: cur.color,
              }}>{cur.symbol}</div>
              <span style={{ fontSize: '.78rem', color: '#e2e8f0', fontWeight: 600 }}>{cur.label}</span>
              {values[cur.key] !== '' && (
                <span style={{ fontSize: '.68rem', color: '#4b5563', marginRight: 'auto' }}>
                  الرصيد الحالي: {values[cur.key]}
                </span>
              )}
            </div>
            <input
              type="number" inputMode="decimal"
              placeholder={`الرصيد الجديد بـ ${cur.label}`}
              value={values[cur.key]}
              onChange={e => setValues(v => ({ ...v, [cur.key]: e.target.value }))}
              style={inSt}
            />
          </div>
        ))
      )}

      {error && <div style={{ color: '#f87171', fontSize: '.8rem', marginBottom: '.8rem' }}>{error}</div>}

      <BtnPrimary onClick={save} loading={saving}>حفظ الرصيد</BtnPrimary>
      <BtnOutline onClick={onClose}>إلغاء</BtnOutline>
    </ModalBase>
  )
}
