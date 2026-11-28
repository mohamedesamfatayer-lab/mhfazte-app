'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Props {
  onDeposit: () => void
  onExpense: () => void
  onDebt: (type: 'creditor' | 'debtor') => void
  onSetBalance: () => void
}

const CUR_LABELS: Record<string, string> = { EGP: 'ج.م', SAR: 'ريال', USD: '$' }

const ACTIONS: { key: string; label: string; icon: string; color: string }[] = [
  { key: 'deposit',       label: 'إضافة رصيد',      icon: 'fa-plus-circle',         color: '#16a34a' },
  { key: 'expense',       label: 'مصروف',            icon: 'fa-receipt',             color: '#dc2626' },
  { key: 'debt-creditor', label: 'دين ليا (دائن)',   icon: 'fa-hand-holding-heart',  color: '#059669' },
  { key: 'debt-debtor',   label: 'دين عليا (مدين)',  icon: 'fa-hand-holding-dollar', color: '#d97706' },
]

function todayAr(): string {
  const d = new Date()
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const fmt = (n: number) => {
  const v = Number(n) || 0
  return v % 1 === 0 ? String(v) : String(parseFloat(v.toFixed(2)))
}

export default function HomeSection({ onDeposit, onExpense, onDebt, onSetBalance }: Props) {
  const [balances, setBalances]           = useState<Record<string, number>>({})
  const [creditorTotal, setCreditorTotal] = useState<Record<string, number>>({})
  const [debtorTotal, setDebtorTotal]     = useState<Record<string, number>>({})
  const [loading, setLoading]             = useState(true)
  const [menuOpen, setMenuOpen]           = useState(false)
  const [hidden, setHidden] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('mhfazte_hidden_cards')
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>()
    } catch { return new Set<string>() }
  })

  useEffect(() => {
    localStorage.setItem('mhfazte_hidden_cards', JSON.stringify([...hidden]))
  }, [hidden])

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const [accRes, debtRes] = await Promise.all([
        sb.from('mhfazte_account').select('balances').eq('user_id', user.id).single(),
        sb.from('mhfazte_debts').select('type,remaining,currency'),
      ])
      if (accRes.data) setBalances((accRes.data as any).balances ?? {})
      if (debtRes.data) {
        const rows = debtRes.data as { type: string; remaining: number; currency: string }[]
        const c: Record<string, number> = {}
        const d: Record<string, number> = {}
        rows.forEach(r => {
          if (r.type === 'دائن') c[r.currency] = (c[r.currency] ?? 0) + Number(r.remaining)
          if (r.type === 'مدين') d[r.currency] = (d[r.currency] ?? 0) + Number(r.remaining)
        })
        setCreditorTotal(c)
        setDebtorTotal(d)
      }
      setLoading(false)
    }
    load()
  }, [])

  function toggleHide(id: string) {
    setHidden(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toEntries = (m: Record<string, number>) =>
    Object.entries(m).filter(([, v]) => v !== 0).map(([c, v]) => ({ amt: fmt(Math.abs(v)), cur: CUR_LABELS[c] ?? c, neg: v < 0 }))

  const balEntries  = toEntries(balances)
  const credEntries = toEntries(creditorTotal)
  const debtEntries = toEntries(debtorTotal)

  const netByCur: Record<string, number> = {}
  new Set([...Object.keys(creditorTotal), ...Object.keys(debtorTotal)]).forEach(c => {
    netByCur[c] = (creditorTotal[c] ?? 0) - (debtorTotal[c] ?? 0)
  })
  const netEntries = Object.entries(netByCur).filter(([, v]) => v !== 0)
    .map(([c, v]) => ({ amt: fmt(Math.abs(v)), cur: CUR_LABELS[c] ?? c, neg: v < 0 }))

  const BORDER  = '1px solid rgba(255,255,255,.06)'
  const DIM_TXT = '#4b5563'

  function handleAction(key: string) {
    setMenuOpen(false)
    if (key === 'deposit')       onDeposit()
    if (key === 'expense')       onExpense()
    if (key === 'debt-creditor') onDebt('creditor')
    if (key === 'debt-debtor')   onDebt('debtor')
  }

  // ── Shared card renderer ──────────────────────────────────────────
  function Card({
    id, label, sub, icon, grad, shadow, entries, footer,
  }: {
    id: string; label: string; sub?: string; icon: string
    grad: string; shadow: string
    entries: { amt: string; cur: string; neg?: boolean }[]
    footer?: React.ReactNode
  }) {
    const isHidden = hidden.has(id)
    return (
      <div style={{
        background: grad, borderRadius: 14, padding: '.9rem 1rem',
        boxShadow: `0 4px 20px ${shadow}`, marginBottom: '.65rem',
        direction: 'rtl',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: 'rgba(255,255,255,.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`fas ${icon}`} style={{ color: '#fff', fontSize: '.9rem' }} />
            </div>
            <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>{label}</span>
          </div>
          <button onClick={() => toggleHide(id)} style={{
            background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 7,
            color: '#fff', cursor: 'pointer', padding: '.3rem .45rem', fontSize: '.78rem',
          }}>
            <i className={`fas ${isHidden ? 'fa-eye-slash' : 'fa-eye'}`} />
          </button>
        </div>

        {/* Amounts */}
        {loading ? (
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>...</div>
        ) : isHidden ? (
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'rgba(255,255,255,.5)', letterSpacing: 4 }}>••••</div>
        ) : entries.length === 0 ? (
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>0</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem .9rem' }}>
            {entries.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '.25rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{e.amt}</span>
                <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.8)', fontWeight: 700 }}>{e.cur}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sub label */}
        {sub && <div style={{ fontSize: '.63rem', color: 'rgba(255,255,255,.5)', marginTop: '.35rem' }}>{sub}</div>}

        {/* Footer */}
        {footer}
      </div>
    )
  }

  return (
    <div style={{ direction: 'rtl', minHeight: '100%', background: '#0f1a2e' }}>

      {/* ── Action bar ───────────────────────────────── */}
      <div style={{
        background: '#0d1521', borderBottom: BORDER,
        padding: '.6rem 1rem', display: 'flex', alignItems: 'center',
      }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(o => !o)} style={{
              background: '#15803d', color: '#fff', border: 'none',
              borderRadius: 8, padding: '.35rem .8rem',
              fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Cairo, sans-serif',
              display: 'flex', alignItems: 'center', gap: '.35rem', whiteSpace: 'nowrap',
            }}>
              <i className="fas fa-plus" style={{ fontSize: '.65rem' }} />
              إجراءات
              <i className={`fas fa-caret-${menuOpen ? 'up' : 'down'}`} style={{ fontSize: '.6rem' }} />
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + .4rem)', right: 0,
                  background: '#1a2d44', border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 10, padding: '.35rem', zIndex: 100, minWidth: 180,
                  boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                }}>
                  {ACTIONS.map(a => (
                    <button key={a.key} onClick={() => handleAction(a.key)} style={{
                      display: 'flex', alignItems: 'center', gap: '.55rem',
                      width: '100%', padding: '.5rem .75rem', borderRadius: 7,
                      border: 'none', background: 'transparent',
                      color: '#e2e8f0', fontSize: '.82rem', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                      textAlign: 'right', direction: 'rtl',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.07)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <i className={`fas ${a.icon}`} style={{ color: a.color, fontSize: '.8rem', width: 16, textAlign: 'center' }} />
                      {a.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, margin: '0 1rem' }}>
          <div style={{ fontSize: '.85rem', color: '#3b82f6', fontWeight: 700 }}>محفظتي — الرئيسية</div>
          <div style={{ fontSize: '.63rem', color: DIM_TXT, marginTop: '.15rem' }}>{todayAr()}</div>
        </div>
        <div style={{ flex: 1 }} />
      </div>

      {/* ── Cards ────────────────────────────────────── */}
      <div style={{ padding: '.8rem .9rem 1rem' }}>

        <Card
          id="balance"
          label="رصيد الحساب الحالي"
          icon="fa-vault"
          grad="linear-gradient(135deg,#1e3a5f,#1d4ed8)"
          shadow="rgba(29,78,216,.35)"
          entries={balEntries}
          footer={
            <button onClick={onSetBalance} style={{
              marginTop: '.55rem', background: 'rgba(255,255,255,.15)',
              border: 'none', borderRadius: 8, padding: '.28rem .7rem',
              color: '#fff', fontSize: '.68rem', cursor: 'pointer',
              fontFamily: 'Cairo, sans-serif',
              display: 'flex', alignItems: 'center', gap: '.3rem',
            }}>
              <i className="fas fa-pen-to-square" style={{ fontSize: '.6rem' }} />
              ضبط الرصيد
            </button>
          }
        />

        <Card
          id="creditor"
          label="ليا دائن (الكلي)"
          sub="إجمالي ما يستحق لك من الآخرين"
          icon="fa-hand-holding-heart"
          grad="linear-gradient(135deg,#14532d,#16a34a)"
          shadow="rgba(22,163,74,.3)"
          entries={credEntries}
        />

        <Card
          id="debtor"
          label="عليا مدين (الكلي)"
          sub="إجمالي ما عليك للآخرين"
          icon="fa-hand-holding-dollar"
          grad="linear-gradient(135deg,#7f1d1d,#dc2626)"
          shadow="rgba(220,38,38,.3)"
          entries={debtEntries}
        />

        <Card
          id="net"
          label="صافي الديون"
          sub={netEntries.length === 0 ? '' : netEntries[0]?.neg ? 'الميزان عليك' : 'الميزان لصالحك'}
          icon="fa-scale-balanced"
          grad="linear-gradient(135deg,#1e1b4b,#4338ca)"
          shadow="rgba(67,56,202,.3)"
          entries={netEntries}
        />

      </div>
    </div>
  )
}
