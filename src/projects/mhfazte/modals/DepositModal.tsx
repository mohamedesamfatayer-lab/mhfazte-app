'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import ModalBase, { FormGroup, inputSt, CurrencyToggle, BtnPrimary, BtnOutline, type Currency } from './ModalBase'

interface Props { onClose: () => void; onSaved: () => void }

export default function DepositModal({ onClose, onSaved }: Props) {
  const [currency, setCurrency] = useState<Currency>('EGP')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!amount || isNaN(Number(amount))) { setError('أدخل المبلغ'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('غير مسجل'); setLoading(false); return }

    const amt = Number(amount)

    // Update balance
    const { data: acc } = await supabase.from('mhfazte_account').select('balances').eq('user_id', user.id).single()
    const balances: Record<string, number> = (acc as any)?.balances ?? {}
    const current = balances[currency] ?? 0
    balances[currency] = current + amt

    await supabase.from('mhfazte_account').upsert({ user_id: user.id, balances }, { onConflict: 'user_id' })

    // Record transaction
    await supabase.from('mhfazte_transactions').insert({
      user_id: user.id,
      type: 'deposit',
      amount: amt,
      currency,
      note: note || null,
      date,
    })

    setLoading(false)
    onSaved()
    onClose()
  }

  return (
    <ModalBase title="إضافة رصيد" onClose={onClose}>
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
          placeholder="" style={inputSt} />
      </FormGroup>

      {error && <div style={{ color: '#f87171', fontSize: '.8rem', marginBottom: '.8rem' }}>{error}</div>}

      <BtnPrimary onClick={save} loading={loading}>إضافة رصيد</BtnPrimary>
      <BtnOutline onClick={onClose}>إلغاء</BtnOutline>
    </ModalBase>
  )
}
