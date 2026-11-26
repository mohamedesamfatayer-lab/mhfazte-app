'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import ModalBase, { FormGroup, inputSt, CurrencyToggle, BtnPrimary, BtnOutline, type Currency } from './ModalBase'

interface Props { onClose: () => void; onSaved: () => void }

type OpType = 'deposit' | 'withdraw'

export default function DepositModal({ onClose, onSaved }: Props) {
  const [op, setOp] = useState<OpType>('deposit')
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
    balances[currency] = op === 'deposit' ? current + amt : current - amt

    await supabase.from('mhfazte_account').upsert({ user_id: user.id, balances }, { onConflict: 'user_id' })

    // Record transaction
    await supabase.from('mhfazte_transactions').insert({
      user_id: user.id,
      type: op,
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
    <ModalBase title={op === 'deposit' ? 'إيداع رصيد' : 'سحب رصيد'} onClose={onClose}>
      {/* Op toggle */}
      <FormGroup label="نوع العملية">
        <div style={{ display: 'flex', gap: '.4rem' }}>
          {(['deposit', 'withdraw'] as OpType[]).map(o => (
            <button key={o} type="button" onClick={() => setOp(o)} style={{
              flex: 1, padding: '.45rem', borderRadius: 10, border: 'none',
              background: op === o ? (o === 'deposit' ? 'rgba(5,150,105,.3)' : 'rgba(220,38,38,.3)') : 'rgba(255,255,255,.07)',
              color: op === o ? (o === 'deposit' ? '#34d399' : '#f87171') : '#94a3b8',
              fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            }}>
              <i className={`fas ${o === 'deposit' ? 'fa-arrow-down' : 'fa-arrow-up'}`} style={{ marginLeft: '.4rem' }} />
              {o === 'deposit' ? 'إيداع' : 'سحب'}
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
          placeholder="" style={inputSt} />
      </FormGroup>

      {error && <div style={{ color: '#f87171', fontSize: '.8rem', marginBottom: '.8rem' }}>{error}</div>}

      <BtnPrimary onClick={save} loading={loading}>{op === 'deposit' ? 'إيداع' : 'سحب'}</BtnPrimary>
      <BtnOutline onClick={onClose}>إلغاء</BtnOutline>
    </ModalBase>
  )
}
