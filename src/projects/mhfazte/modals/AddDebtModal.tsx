'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import ModalBase, { FormGroup, inputSt, CurrencyToggle, BtnPrimary, BtnOutline, type Currency } from './ModalBase'

interface Props { type: 'دائن' | 'مدين'; onClose: () => void; onSaved: () => void }

export default function AddDebtModal({ type, onClose, onSaved }: Props) {
  const [subtype, setSubtype] = useState<'سلفة' | 'أقساط'>('سلفة')
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<Currency>('EGP')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isDebtor = type === 'مدين'
  const title = isDebtor ? 'إضافة دين عليا (مدين)' : 'إضافة دين ليا (دائن)'

  async function save() {
    if (!name.trim()) { setError('أدخل اسم الشخص'); return }
    if (!amount || isNaN(Number(amount))) { setError('أدخل المبلغ'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('غير مسجل'); setLoading(false); return }

    const amt = Number(amount)
    await supabase.from('mhfazte_debts').insert({
      user_id: user.id,
      type,
      subtype: isDebtor ? subtype : null,
      name: name.trim(),
      currency, amount: amt, remaining: amt,
      date, note: note || null,
    })

    setLoading(false); onSaved(); onClose()
  }

  return (
    <ModalBase title={title} onClose={onClose}>
      {/* Sub-type (only for debtor) */}
      {isDebtor && (
        <FormGroup label="نوع الدين">
          <div className="type-toggle">
            {(['سلفة', 'أقساط'] as const).map(s => (
              <button key={s} type="button" onClick={() => setSubtype(s)}
                className={`type-btn ${subtype === s ? 'sel-active' : ''}`}>
                {s === 'سلفة' ? '💸 سلفة' : '📋 أقساط'}
              </button>
            ))}
          </div>
        </FormGroup>
      )}

      <FormGroup label="اسم الشخص / الجهة">
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="مثال: أحمد محمد" style={inputSt} />
      </FormGroup>

      <FormGroup label="العملة">
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </FormGroup>

      <FormGroup label="إجمالي المبلغ">
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="0.00" inputMode="decimal" style={inputSt} />
      </FormGroup>

      <FormGroup label="تاريخ الدين">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputSt} />
      </FormGroup>

      <FormGroup label="ملاحظة (اختياري)">
        <input type="text" value={note} onChange={e => setNote(e.target.value)}
          placeholder="وصف أو سبب الدين" style={inputSt} />
      </FormGroup>

      {error && <div style={{ color: '#f87171', fontSize: '.8rem', marginBottom: '.8rem' }}>{error}</div>}

      <BtnPrimary onClick={save} loading={loading}>حفظ الدين</BtnPrimary>
      <BtnOutline onClick={onClose}>إلغاء</BtnOutline>
    </ModalBase>
  )
}
