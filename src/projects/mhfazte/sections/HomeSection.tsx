'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Props {
  onDeposit: () => void
  onExpense: () => void
  onDebt: (type: 'creditor' | 'debtor') => void
}

const CUR_LABELS: Record<string, string> = { EGP: 'ج.م', SAR: 'ريال', USD: '$' }

type OpTab = 'deposit' | 'expense' | 'debt-creditor' | 'debt-debtor'

const OP_TABS: { key: OpTab; label: string; icon: string; color: string }[] = [
  { key: 'deposit',       label: 'إيداع',       icon: 'fa-arrow-down',         color: '#16a34a' },
  { key: 'expense',       label: 'مصروف',       icon: 'fa-arrow-up',           color: '#dc2626' },
  { key: 'debt-creditor', label: 'دين ليا (دائن)', icon: 'fa-hand-holding-heart', color: '#059669' },
  { key: 'debt-debtor',   label: 'دين عليا (مدين)', icon: 'fa-hand-holding-dollar', color: '#d97706' },
]

function todayAr(): string {
  const d = new Date()
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function HomeSection({ onDeposit, onExpense, onDebt }: Props) {
  const [balances, setBalances]         = useState<Record<string, number>>({})
  const [creditorTotal, setCreditorTotal] = useState<Record<string, number>>({})
  const [debtorTotal, setDebtorTotal]   = useState<Record<string, number>>({})
  const [txThisMonth, setTxThisMonth]   = useState(0)
  const [expThisMonth, setExpThisMonth] = useState<Record<string, number>>({})
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState<OpTab>('deposit')

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const monthStart = new Date().toISOString().slice(0, 7) + '-01'

      const [accRes, debtRes, txRes, expRes] = await Promise.all([
        sb.from('mhfazte_account').select('balances').eq('user_id', user.id).single(),
        sb.from('mhfazte_debts').select('type,remaining,currency'),
        sb.from('mhfazte_transactions').select('id', { count: 'exact', head: true }).gte('date', monthStart),
        sb.from('mhfazte_expenses').select('amount,currency').gte('date', monthStart),
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
      setTxThisMonth(txRes.count ?? 0)
      if (expRes.data) {
        const e: Record<string, number> = {}
        ;(expRes.data as { amount: number; currency: string }[]).forEach(r => {
          e[r.currency] = (e[r.currency] ?? 0) + Number(r.amount)
        })
        setExpThisMonth(e)
      }
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (n: number) => String(Math.round(Number(n) || 0))

  // Returns array of {amount, cur} for multi-currency display
  const toEntries = (m: Record<string, number>) =>
    Object.entries(m).filter(([, v]) => v > 0).map(([c, v]) => ({ amt: fmt(v), cur: CUR_LABELS[c] ?? c }))

  const netByCur: Record<string, number> = {}
  new Set([...Object.keys(creditorTotal), ...Object.keys(debtorTotal)]).forEach(c => {
    netByCur[c] = (creditorTotal[c] ?? 0) - (debtorTotal[c] ?? 0)
  })

  const credEntries  = toEntries(creditorTotal)
  const debtEntries  = toEntries(debtorTotal)
  const expEntries   = toEntries(expThisMonth)
  const netEntries   = Object.entries(netByCur).filter(([, v]) => v !== 0)
    .map(([c, v]) => ({ amt: fmt(Math.abs(v)), cur: CUR_LABELS[c] ?? c }))
  const balEntries   = Object.entries(balances).filter(([, v]) => v !== 0)
    .map(([c, v]) => ({ amt: fmt(v), cur: CUR_LABELS[c] ?? c }))

  // For large cards (string with line breaks retained)
  const totalCredStr = credEntries.length ? credEntries.map(e => `${e.amt} ${e.cur}`).join('\n') : '0'
  const balStr       = balEntries.length  ? balEntries.map(e => `${e.amt} ${e.cur}`).join('\n')  : '0'

  const handleOp = () => {
    if (activeTab === 'deposit')       onDeposit()
    if (activeTab === 'expense')       onExpense()
    if (activeTab === 'debt-creditor') onDebt('creditor')
    if (activeTab === 'debt-debtor')   onDebt('debtor')
  }

  // ── small stat cards (entries = [{amt, cur}] for inline display) ──
  const statCards = [
    { label: 'ليا دائن (الكلي)',   entries: credEntries, icon: 'fa-hand-holding-heart',  color: '#059669', bg: 'rgba(5,150,105,.18)' },
    { label: 'عليا مدين (الكلي)', entries: debtEntries, icon: 'fa-hand-holding-dollar', color: '#dc2626', bg: 'rgba(220,38,38,.15)' },
    { label: 'صافي الديون',        entries: netEntries,  icon: 'fa-scale-balanced',       color: '#2563eb', bg: 'rgba(37,99,235,.18)' },
    { label: 'مصروفات الشهر',      entries: expEntries,  icon: 'fa-receipt',              color: '#d97706', bg: 'rgba(217,119,6,.18)' },
    { label: 'معاملات الشهر',      entries: [{ amt: txThisMonth.toString(), cur: '' }], icon: 'fa-clock-rotate-left', color: '#7c3aed', bg: 'rgba(124,58,237,.18)' },
  ]

  // Shared design tokens (matches Kababji sidebar style)
  const CARD_BG = '#131f30'
  const BORDER  = '1px solid rgba(255,255,255,.06)'
  const SEC_TXT = '#8899aa'
  const DIM_TXT = '#4b5563'

  return (
    <div style={{ direction: 'rtl', minHeight: '100%', background: '#0f1a2e' }}>

      {/* ── Action bar ───────────────────────────────── */}
      <div style={{
        background: '#0d1521',
        borderBottom: BORDER,
        padding: '.55rem 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.82rem', color: '#3b82f6', fontWeight: 700, whiteSpace: 'nowrap' }}>محفظتي — الرئيسية</div>
          <div style={{ fontSize: '.63rem', color: DIM_TXT }}>إدارة المال والديون والمصروفات</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
          <span style={{ fontSize: '.68rem', color: SEC_TXT, whiteSpace: 'nowrap' }}>{todayAr()}</span>
          <button onClick={onDeposit} style={{
            background: '#15803d', color: '#fff', border: 'none',
            borderRadius: 8, padding: '.35rem .8rem',
            fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif',
            display: 'flex', alignItems: 'center', gap: '.35rem', whiteSpace: 'nowrap',
          }}>
            <i className="fas fa-plus" style={{ fontSize: '.65rem' }} />
            إجراءات
            <i className="fas fa-caret-down" style={{ fontSize: '.6rem' }} />
          </button>
        </div>
      </div>

      {/* ── Two large featured cards ─────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', margin: '.8rem .9rem .6rem' }}>

        {/* Green card – ليا دائن */}
        <div style={{
          flex: '1 1 180px',
          background: 'linear-gradient(135deg,#14532d,#16a34a)',
          borderRadius: 12, padding: '.85rem 1rem',
          boxShadow: '0 4px 20px rgba(22,163,74,.3)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: 'rgba(255,255,255,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fas fa-hand-holding-heart" style={{ color: '#fff', fontSize: '.9rem' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.7)', marginBottom: '.2rem' }}>ليا دائن (الكلي)</div>
              {loading ? <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>...</div>
                : credEntries.length === 0 ? <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>0</div>
                : credEntries.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '.25rem', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{e.amt}</span>
                    <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.8)', fontWeight: 700 }}>{e.cur}</span>
                  </div>
                ))
              }
            </div>
          </div>
          <div style={{ marginTop: '.5rem', fontSize: '.63rem', color: 'rgba(255,255,255,.55)' }}>
            إجمالي ما يستحق لك من الآخرين
          </div>
        </div>

        {/* Dark card – رصيد الحساب */}
        <div style={{
          flex: '2 1 240px',
          background: CARD_BG,
          borderRadius: 12, padding: '.85rem 1rem',
          border: BORDER,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: 'rgba(37,99,235,.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fas fa-vault" style={{ color: '#60a5fa', fontSize: '.9rem' }} />
            </div>
            <div style={{ textAlign: 'right', flex: 1 }}>
              <div style={{ fontSize: '.65rem', color: SEC_TXT, marginBottom: '.2rem' }}>رصيد الحساب الحالي</div>
              {loading ? <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>...</div>
                : balEntries.length === 0 ? <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>0</div>
                : (
                  /* all currencies on ONE line, separated by space */
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem 1rem', justifyContent: 'flex-end' }}>
                    {balEntries.map((e, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '.25rem' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{e.amt}</span>
                        <span style={{ fontSize: '.75rem', color: SEC_TXT, fontWeight: 700 }}>{e.cur}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
          <button onClick={onDeposit} style={{
            marginTop: '.7rem', background: 'rgba(255,255,255,.07)',
            border: BORDER, borderRadius: 8, padding: '.3rem .7rem',
            color: SEC_TXT, fontSize: '.68rem',
            cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            alignSelf: 'flex-start',
          }}>
            ضبط الرصيد
          </button>
        </div>
      </div>

      {/* ── Stat cards row ───────────────────────────── */}
      <div style={{ display: 'flex', gap: '.55rem', margin: '0 .9rem .8rem', overflowX: 'auto', paddingBottom: '.1rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            flex: '0 0 auto', minWidth: 150,
            background: CARD_BG,
            borderRadius: 10, padding: '.65rem .8rem',
            border: BORDER,
            display: 'flex', alignItems: 'center', gap: '.6rem',
            direction: 'rtl',
          }}>
            {/* Icon */}
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: '.78rem' }} />
            </div>
            {/* Text */}
            <div style={{ textAlign: 'right', minWidth: 0 }}>
              <div style={{ fontSize: '.63rem', color: DIM_TXT, marginBottom: '.15rem', whiteSpace: 'nowrap' }}>{s.label}</div>
              {loading ? (
                <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#fff' }}>...</div>
              ) : s.entries.length === 0 ? (
                <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#fff' }}>0</div>
              ) : s.entries.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '.25rem', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '.95rem', fontWeight: 800, color: '#fff' }}>{e.amt}</span>
                  {e.cur && <span style={{ fontSize: '.68rem', color: SEC_TXT, fontWeight: 600 }}>{e.cur}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Add new operation ────────────────────────── */}
      <div style={{ margin: '0 .9rem .9rem', background: CARD_BG, borderRadius: 12, border: BORDER }}>
        <div style={{
          padding: '.65rem 1rem', borderBottom: BORDER,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        }}>
          <span style={{ fontWeight: 700, fontSize: '.83rem', color: '#e2e8f0' }}>أضف عملية جديدة</span>
        </div>

        <div style={{ display: 'flex', gap: '.45rem', padding: '.65rem 1rem .45rem', flexWrap: 'wrap' }}>
          {OP_TABS.map(tab => {
            const active = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: '.4rem',
                padding: '.4rem .85rem', borderRadius: 8, border: 'none',
                background: active ? tab.color : 'rgba(255,255,255,.06)',
                color: active ? '#fff' : SEC_TXT,
                fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif',
                boxShadow: active ? `0 2px 8px ${tab.color}44` : 'none',
                transition: 'all .15s',
              }}>
                <i className={`fas ${tab.icon}`} style={{ fontSize: '.68rem' }} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div style={{
          padding: '.5rem 1rem .85rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '.75rem', color: DIM_TXT, flex: 1, minWidth: 120 }}>
            {activeTab === 'deposit'       && 'إضافة إيداع أو دخل جديد إلى حسابك'}
            {activeTab === 'expense'       && 'تسجيل مصروف أو نفقة جديدة'}
            {activeTab === 'debt-creditor' && 'تسجيل دين جديد ليك على شخص آخر'}
            {activeTab === 'debt-debtor'   && 'تسجيل دين جديد عليك لشخص آخر'}
          </div>
          <button onClick={handleOp} style={{
            background: OP_TABS.find(t => t.key === activeTab)?.color ?? '#2563eb',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '.5rem 1.3rem', fontSize: '.83rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            display: 'flex', alignItems: 'center', gap: '.4rem',
            whiteSpace: 'nowrap',
          }}>
            <i className="fas fa-plus" style={{ fontSize: '.72rem' }} />
            حفظ العملية
          </button>
        </div>
      </div>

    </div>
  )
}
