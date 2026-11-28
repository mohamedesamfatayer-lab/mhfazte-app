'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import ModalBase, { CurrencyToggle, BtnPrimary, BtnOutline, type Currency } from './ModalBase'
import { loadCategoriesFromDB, DEFAULT_EXPENSE_CATS } from './ManageCategoriesModal'
import ManageCategoriesModal from './ManageCategoriesModal'

const inp: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,.07)',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 9, padding: '.45rem .75rem',
  color: '#e2e8f0', fontSize: '.85rem', outline: 'none',
  fontFamily: 'Cairo, sans-serif', direction: 'rtl',
  boxSizing: 'border-box',
}

const lbl: React.CSSProperties = {
  fontSize: '.68rem', color: '#8899aa', marginBottom: '.25rem', display: 'block',
}

interface Props { onClose: () => void; onSaved: () => void }

export default function AddExpenseModal({ onClose, onSaved }: Props) {
  const [categories, setCategories] = useState<string[]>(DEFAULT_EXPENSE_CATS)

  useEffect(() => {
    loadCategoriesFromDB().then(setCategories)
  }, [])
  const [category, setCategory]     = useState('')
  const [currency, setCurrency]     = useState<Currency>('EGP')
  const [amount, setAmount]         = useState('')
  const [date, setDate]             = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote]             = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [showManage, setShowManage] = useState(false)

  async function save() {
    if (!category) { setError('اختر الفئة'); return }
    if (!amount || isNaN(Number(amount))) { setError('أدخل المبلغ'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('غير مسجل'); setLoading(false); return }

    const amt = Number(amount)

    await supabase.from('mhfazte_expenses').insert({
      user_id: user.id, category, currency, amount: amt, date, note: note || null,
    })

    const { data: acc } = await supabase.from('mhfazte_account').select('balances').eq('user_id', user.id).single()
    const balances: Record<string, number> = (acc as any)?.balances ?? {}
    balances[currency] = (balances[currency] ?? 0) - amt
    await supabase.from('mhfazte_account').upsert({ user_id: user.id, balances }, { onConflict: 'user_id' })

    await supabase.from('mhfazte_transactions').insert({
      user_id: user.id, type: 'expense', amount: amt, currency, category, note: note || null, date,
    })

    setLoading(false); onSaved(); onClose()
  }

  if (showManage) {
    return (
      <ManageCategoriesModal
        onClose={() => setShowManage(false)}
        onSaved={() => { loadCategoriesFromDB().then(setCategories); setShowManage(false) }}
      />
    )
  }

  return (
    <ModalBase title="إضافة مصروف" onClose={onClose}>

      {/* ── الفئة ── */}
      <div style={{ marginBottom: '.7rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.35rem' }}>
          <span style={lbl}>الفئة</span>
          <button onClick={() => setShowManage(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#fbbf24', fontSize: '.68rem', fontFamily: 'Cairo, sans-serif',
            display: 'flex', alignItems: 'center', gap: '.25rem', padding: 0,
          }}>
            <i className="fas fa-tags" style={{ fontSize: '.6rem' }} />
            إدارة الفئات
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: '.28rem .65rem', borderRadius: 20, border: 'none',
              background: category === c ? '#dc2626' : 'rgba(255,255,255,.08)',
              color: category === c ? '#fff' : '#94a3b8',
              fontSize: '.75rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Cairo, sans-serif', transition: 'all .12s',
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* ── العملة + المبلغ ── */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.7rem' }}>
        <div style={{ flex: 1 }}>
          <span style={lbl}>العملة</span>
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={lbl}>المبلغ</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0" inputMode="decimal" style={inp} />
        </div>
      </div>

      {/* ── التاريخ + الملاحظة ── */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem' }}>
        <div style={{ flex: 1 }}>
          <span style={lbl}>التاريخ</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={lbl}>ملاحظة</span>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="اختياري" style={inp} />
        </div>
      </div>

      {error && <div style={{ color: '#f87171', fontSize: '.78rem', marginBottom: '.6rem' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '.5rem' }}>
        <BtnPrimary onClick={save} loading={loading}>حفظ المصروف</BtnPrimary>
        <BtnOutline onClick={onClose}>إلغاء</BtnOutline>
      </div>
    </ModalBase>
  )
}
