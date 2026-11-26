'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import ModalBase, { FormGroup, inputSt, CurrencyToggle, BtnPrimary, BtnOutline, type Currency } from './ModalBase'

const CATEGORIES = ['طعام', 'مواصلات', 'فواتير', 'ملابس', 'صحة', 'ترفيه', 'تعليم', 'منزل', 'أخرى']

interface Props { onClose: () => void; onSaved: () => void }

export default function AddExpenseModal({ onClose, onSaved }: Props) {
  const [category, setCategory] = useState('')
  const [currency, setCurrency] = useState<Currency>('EGP')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!category) { setError('اختر الفئة'); return }
    if (!amount || isNaN(Number(amount))) { setError('أدخل المبلغ'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('غير مسجل'); setLoading(false); return }

    await supabase.from('mhfazte_expenses').insert({
      user_id: user.id, category, currency,
      amount: Number(amount), date, note: note || null,
    })

    // Record transaction
    await supabase.from('mhfazte_transactions').insert({
      user_id: user.id, type: 'expense',
      amount: Number(amount), currency, category,
      note: note || null, date,
    })

    setLoading(false); onSaved(); onClose()
  }

  return (
    <ModalBase title="إضافة مصروف" onClose={onClose}>
      <FormGroup label="الفئة">
        <div className="cat-grid">
          {CATEGORIES.map(c => (
            <button key={c} type="button" onClick={() => setCategory(c)}
              className={`cat-btn ${category === c ? 'active' : ''}`}>
              {c}
            </button>
          ))}
        </div>
      </FormGroup>

      <FormGroup label="العملة">
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </FormGroup>

      <FormGroup label="المبلغ">
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="0.00" inputMode="decimal" style={inputSt} />
      </FormGroup>

      <FormGroup label="التاريخ">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputSt} />
      </FormGroup>

      <FormGroup label="ملاحظة (اختياري)">
        <input type="text" value={note} onChange={e => setNote(e.target.value)}
          placeholder="وصف المصروف" style={inputSt} />
      </FormGroup>

      {error && <div style={{ color: '#f87171', fontSize: '.8rem', marginBottom: '.8rem' }}>{error}</div>}

      <BtnPrimary onClick={save} loading={loading}>حفظ المصروف</BtnPrimary>
      <BtnOutline onClick={onClose}>إلغاء</BtnOutline>
    </ModalBase>
  )
}
