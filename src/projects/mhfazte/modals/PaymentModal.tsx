'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { inputSt, BtnPrimary } from './ModalBase'
import { printDebtStatement } from '../lib/printStatement'

interface DebtInfo {
  id: string
  name: string
  remaining: number
  amount: number
  currency: string
  subtype: string | null
  note?: string | null
  type?: string
}

interface Payment {
  id: string; amount: number; date: string | null; note: string | null
}

interface Props {
  debt: DebtInfo
  onClose: () => void
  onSaved: () => void
}

const CUR_LABEL: Record<string, string> = {
  EGP: 'ج.م (جنيه)', SAR: 'ريال سعودي (ر.س)', USD: 'دولار ($)',
}
const CUR_SHORT: Record<string, string> = { EGP: 'ج.م', SAR: 'ر.س', USD: '$' }

export default function PaymentModal({ debt, onClose, onSaved }: Props) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loadingPay, setLoadingPay] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [currentRemaining, setCurrentRemaining] = useState(debt.remaining)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mhfazte_payments')
        .select('*')
        .eq('debt_id', debt.id)
        .order('date', { ascending: false })
      if (data) setPayments(data as Payment[])
      setLoadingPay(false)
    }
    load()
  }, [debt.id])

  const paid = debt.amount - currentRemaining
  const fmt = (n: number) => String(Math.round(Number(n) || 0))
  const cur = CUR_SHORT[debt.currency] ?? debt.currency
  const isDebtor = debt.type !== 'دائن'

  async function save() {
    const val = parseFloat(payAmount)
    if (!val || val <= 0) { setErr('أدخل مبلغ صحيح'); return }
    setSaving(true); setErr('')
    const supabase = createClient()

    const { error: payErr } = await supabase.from('mhfazte_payments').insert({
      debt_id: debt.id, amount: val, date, note: note || null,
    })
    if (payErr) { setErr(payErr.message); setSaving(false); return }

    const newRemaining = Math.max(0, currentRemaining - val)
    await supabase.from('mhfazte_debts').update({ remaining: newRemaining }).eq('id', debt.id)
    setCurrentRemaining(newRemaining)

    setPayments(prev => [{ id: Date.now().toString(), amount: val, date, note: note || null }, ...prev])
    setShowForm(false)
    setPayAmount(''); setNote('')
    onSaved()
    setSaving(false)
  }

  async function deletePayment(payId: string, amount: number) {
    const supabase = createClient()
    await supabase.from('mhfazte_payments').delete().eq('id', payId)
    const newRemaining = Math.min(debt.amount, currentRemaining + amount)
    await supabase.from('mhfazte_debts').update({ remaining: newRemaining }).eq('id', debt.id)
    setCurrentRemaining(newRemaining)
    setPayments(prev => prev.filter(p => p.id !== payId))
    onSaved()
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.6)',
        zIndex: 500, display: 'flex',
        alignItems: 'flex-end',
        backdropFilter: 'blur(3px)',
        direction: 'rtl',
      }}
    >
      <div style={{
        background: '#1a2535',
        borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 440,
        margin: '0 auto',
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'slideUp .25s ease',
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,.18)', borderRadius: 4, margin: '10px auto 0' }} />

        {/* Top action row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem 1rem .4rem' }}>
          {/* Left: delete + edit icons */}
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button style={{
              width: 40, height: 40, borderRadius: 10, border: 'none',
              background: 'rgba(248,113,113,.2)', color: '#f87171',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <i className="fas fa-trash-can" style={{ fontSize: '.9rem' }} />
            </button>
            <button style={{
              width: 40, height: 40, borderRadius: 10, border: 'none',
              background: 'rgba(96,165,250,.2)', color: '#60a5fa',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <i className="fas fa-pen" style={{ fontSize: '.9rem' }} />
            </button>
          </div>

          {/* Right: name */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e2e8f0' }}>{debt.name}</div>
          </div>
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '.4rem', padding: '0 1rem .3rem' }}>
          <div style={{
            background: isDebtor ? 'rgba(248,113,113,.15)' : 'rgba(52,211,153,.15)',
            border: `1px solid ${isDebtor ? 'rgba(248,113,113,.35)' : 'rgba(52,211,153,.35)'}`,
            color: isDebtor ? '#f87171' : '#34d399',
            borderRadius: 20, padding: '.2rem .65rem', fontSize: '.72rem', fontWeight: 700,
          }}>
            {isDebtor ? '❤️ عليا (مدين)' : '💚 ليا (دائن)'}
          </div>
          <div style={{
            background: '#243044', borderRadius: 20,
            padding: '.2rem .65rem', fontSize: '.72rem', color: '#94a3b8', fontWeight: 600,
            border: '1px solid rgba(255,255,255,.1)',
          }}>
            {debt.currency} {CUR_LABEL[debt.currency] ?? debt.currency}
          </div>
        </div>

        {/* Note */}
        {debt.note && (
          <div style={{ padding: '.1rem 1rem .4rem', fontSize: '.78rem', color: '#64748b', textAlign: 'right' }}>
            {debt.note}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem', padding: '.5rem 1rem .8rem' }}>
          {[
            { label: 'الباقي', val: `${cur} ${fmt(currentRemaining)}`, bg: 'rgba(248,113,113,.12)', border: 'rgba(248,113,113,.25)', color: '#f87171' },
            { label: 'مدفوع', val: `${cur} ${fmt(paid)}`, bg: 'rgba(52,211,153,.12)', border: 'rgba(52,211,153,.25)', color: '#34d399' },
            { label: 'إجمالي', val: `${cur} ${fmt(debt.amount)}`, bg: '#243044', border: 'rgba(255,255,255,.1)', color: '#e2e8f0' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: 12, padding: '.6rem .4rem',
              textAlign: 'center', border: `1px solid ${s.border}`,
            }}>
              <div style={{ fontSize: '.6rem', color: '#94a3b8', marginBottom: '.25rem' }}>{s.label}</div>
              <div style={{ fontSize: '.8rem', fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Add payment button */}
        {currentRemaining > 0 && !showForm && (
          <div style={{ padding: '0 1rem .7rem' }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: '100%', padding: '.8rem', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#059669,#10b981)',
                color: '#fff', fontSize: '.95rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                boxShadow: '0 4px 15px rgba(16,185,129,.3)',
              }}
            >
              <i className="fas fa-plus" style={{ marginLeft: '.4rem' }} />
              إضافة دفعة (سداد)
            </button>
          </div>
        )}

        {/* Inline form */}
        {showForm && (
          <div style={{ margin: '0 1rem .7rem', background: '#243044', borderRadius: 14, padding: '.8rem', border: '1px solid rgba(16,185,129,.25)' }}>
            <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#34d399', marginBottom: '.6rem' }}>
              <i className="fas fa-plus-circle" style={{ marginLeft: '.3rem' }} />
              إضافة دفعة سداد
            </div>
            <div style={{ marginBottom: '.5rem' }}>
              <label style={{ fontSize: '.72rem', color: '#94a3b8', display: 'block', marginBottom: '.25rem' }}>المبلغ</label>
              <input
                style={{ ...inputSt, fontSize: '.85rem' }}
                type="number" placeholder="0.00"
                value={payAmount} onChange={e => setPayAmount(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '.5rem' }}>
              <label style={{ fontSize: '.72rem', color: '#94a3b8', display: 'block', marginBottom: '.25rem' }}>التاريخ</label>
              <input style={{ ...inputSt, fontSize: '.85rem', direction: 'ltr' }} type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div style={{ marginBottom: '.6rem' }}>
              <label style={{ fontSize: '.72rem', color: '#94a3b8', display: 'block', marginBottom: '.25rem' }}>ملاحظة</label>
              <input style={{ ...inputSt, fontSize: '.85rem' }} placeholder="اختياري..." value={note} onChange={e => setNote(e.target.value)} />
            </div>
            {err && <div style={{ color: '#f87171', fontSize: '.75rem', marginBottom: '.4rem' }}>{err}</div>}
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button onClick={save} disabled={saving} style={{
                flex: 1, padding: '.6rem', borderRadius: 10, border: 'none',
                background: '#059669', color: '#fff', fontSize: '.85rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Cairo, sans-serif', opacity: saving ? .7 : 1,
              }}>
                {saving ? 'جاري الحفظ...' : '✓ حفظ الدفعة'}
              </button>
              <button onClick={() => { setShowForm(false); setErr('') }} style={{
                flex: 1, padding: '.6rem', borderRadius: 10,
                border: '1px solid rgba(255,255,255,.12)', background: 'transparent',
                color: '#94a3b8', fontSize: '.85rem', cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
              }}>
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Payment history */}
        <div style={{ padding: '0 1rem .4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
            <button onClick={() => printDebtStatement(
              { ...debt, type: isDebtor ? 'مدين' : 'دائن', remaining: currentRemaining },
              payments
            )} style={{
              background: '#243044', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 8, padding: '.3rem .6rem', color: '#94a3b8',
              fontSize: '.7rem', cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
              display: 'flex', alignItems: 'center', gap: '.3rem',
            }}>
              <i className="fas fa-print" />
              كشف حساب
            </button>
            <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#94a3b8' }}>سجل الدفعات</span>
          </div>

          {loadingPay ? (
            <div style={{ color: '#64748b', fontSize: '.8rem', textAlign: 'center', padding: '.5rem' }}>جاري التحميل...</div>
          ) : payments.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '.8rem', textAlign: 'center', padding: '.8rem' }}>لا توجد دفعات بعد</div>
          ) : (
            payments.map(p => (
              <div key={p.id} style={{
                background: '#243044', borderRadius: 10, padding: '.55rem .7rem',
                marginBottom: '.35rem', display: 'flex', alignItems: 'center', gap: '.6rem',
                border: '1px solid rgba(255,255,255,.05)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(52,211,153,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="fas fa-coins" style={{ color: '#34d399', fontSize: '.75rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#34d399' }}>
                    {fmt(p.amount)} {cur}
                  </div>
                  {p.note && <div style={{ fontSize: '.67rem', color: '#64748b' }}>{p.note}</div>}
                </div>
                <div style={{ fontSize: '.67rem', color: '#64748b', flexShrink: 0 }}>{p.date ?? '—'}</div>
                <button onClick={() => deletePayment(p.id, p.amount)} style={{
                  width: 26, height: 26, borderRadius: '50%', border: 'none',
                  background: 'rgba(248,113,113,.15)', color: '#f87171',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                }}>
                  <i className="fas fa-trash-can" style={{ fontSize: '.6rem' }} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Close */}
        <div style={{ padding: '.5rem 1rem 1.5rem' }}>
          <button onClick={onClose} style={{
            width: '100%', padding: '.75rem', borderRadius: 14,
            border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)',
            color: '#94a3b8', fontSize: '.9rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
          }}>
            إغلاق
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  )
}
