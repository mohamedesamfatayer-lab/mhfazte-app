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

  const fmt = (n: number) => Number(n).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fmtMap = (m: Record<string, number>) =>
    Object.entries(m).filter(([, v]) => v > 0).map(([c, v]) => `${fmt(v)} ${CUR_LABELS[c] ?? c}`).join('\n') || '0.00'

  const netByCur: Record<string, number> = {}
  new Set([...Object.keys(creditorTotal), ...Object.keys(debtorTotal)]).forEach(c => {
    netByCur[c] = (creditorTotal[c] ?? 0) - (debtorTotal[c] ?? 0)
  })
  const netStr = Object.entries(netByCur).filter(([, v]) => v !== 0)
    .map(([c, v]) => `${fmt(Math.abs(v))} ${CUR_LABELS[c] ?? c}`).join('\n') || '0.00'

  const totalCredStr = fmtMap(creditorTotal)
  const totalDebtStr = fmtMap(debtorTotal)
  const expStr = fmtMap(expThisMonth)
  const balStr = Object.entries(balances).filter(([, v]) => v !== 0)
    .map(([c, v]) => `${fmt(v)} ${CUR_LABELS[c] ?? c}`).join('\n') || '0.00'

  const handleOp = () => {
    if (activeTab === 'deposit')       onDeposit()
    if (activeTab === 'expense')       onExpense()
    if (activeTab === 'debt-creditor') onDebt('creditor')
    if (activeTab === 'debt-debtor')   onDebt('debtor')
  }

  // ── small stat cards ──────────────────────────────
  const statCards = [
    { label: 'ليا دائن (الكلي)', val: totalCredStr, icon: 'fa-hand-holding-heart', color: '#059669', bg: 'rgba(5,150,105,.18)' },
    { label: 'عليا مدين (الكلي)', val: totalDebtStr, icon: 'fa-hand-holding-dollar', color: '#dc2626', bg: 'rgba(220,38,38,.15)' },
    { label: 'صافي الديون', val: netStr, icon: 'fa-scale-balanced', color: '#2563eb', bg: 'rgba(37,99,235,.18)' },
    { label: 'مصروفات الشهر', val: expStr, icon: 'fa-receipt', color: '#d97706', bg: 'rgba(217,119,6,.18)' },
    { label: 'معاملات الشهر', val: txThisMonth.toString(), icon: 'fa-clock-rotate-left', color: '#7c3aed', bg: 'rgba(124,58,237,.18)' },
  ]

  return (
    <div style={{ direction: 'rtl', minHeight: '100%' }}>

      {/* ── Action bar ───────────────────────────────── */}
      <div style={{
        background: '#1e2d42',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        padding: '.55rem .9rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* left: title + user hint */}
        <div>
          <div style={{ fontSize: '.72rem', color: '#2563eb', fontWeight: 700 }}>محفظتي — الرئيسية</div>
          <div style={{ fontSize: '.6rem', color: '#64748b' }}>إدارة المال والديون والمصروفات</div>
        </div>
        {/* right: date + actions button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontSize: '.68rem', color: '#94a3b8' }}>{todayAr()}</span>
          <button onClick={onDeposit} style={{
            background: '#16a34a', color: '#fff', border: 'none',
            borderRadius: 7, padding: '.3rem .75rem',
            fontSize: '.72rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif',
            display: 'flex', alignItems: 'center', gap: '.3rem',
          }}>
            <i className="fas fa-plus" style={{ fontSize: '.65rem' }} />
            إجراءات
            <i className="fas fa-caret-down" style={{ fontSize: '.6rem' }} />
          </button>
        </div>
      </div>

      {/* ── Two large featured cards ─────────────────── */}
      <div style={{ display: 'flex', gap: '.7rem', margin: '.75rem .8rem .5rem', alignItems: 'stretch' }}>

        {/* Green card – ليا دائن */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg,#14532d,#16a34a)',
          borderRadius: 12, padding: '1rem 1.1rem',
          boxShadow: '0 4px 20px rgba(22,163,74,.35)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fas fa-hand-holding-heart" style={{ color: '#fff', fontSize: '.95rem' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.75)', marginBottom: '.2rem' }}>ليا دائن (الكلي)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, whiteSpace: 'pre-line' }}>
                {loading ? '...' : totalCredStr}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '.6rem', fontSize: '.65rem', color: 'rgba(255,255,255,.65)' }}>
            إجمالي ما يستحق لك من الآخرين
          </div>
        </div>

        {/* Dark card – رصيد الحساب */}
        <div style={{
          flex: 1,
          background: '#1e2d42',
          borderRadius: 12, padding: '1rem 1.1rem',
          border: '1px solid rgba(255,255,255,.08)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(37,99,235,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fas fa-vault" style={{ color: '#60a5fa', fontSize: '.95rem' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.65rem', color: '#94a3b8', marginBottom: '.2rem' }}>رصيد الحساب الحالي</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, whiteSpace: 'pre-line' }}>
                {loading ? '...' : balStr}
              </div>
            </div>
          </div>
          <button onClick={onDeposit} style={{
            marginTop: '.7rem', background: 'rgba(255,255,255,.08)',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 7, padding: '.25rem .6rem',
            color: 'rgba(255,255,255,.65)', fontSize: '.62rem',
            cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            alignSelf: 'flex-start',
          }}>
            ضبط الرصيد
          </button>
        </div>
      </div>

      {/* ── Stat cards row ───────────────────────────── */}
      <div style={{ display: 'flex', gap: '.5rem', margin: '0 .8rem .75rem', overflowX: 'auto', paddingBottom: '.1rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            flex: '0 0 130px',
            background: '#1e2d42',
            borderRadius: 10, padding: '.65rem .75rem',
            border: '1px solid rgba(255,255,255,.06)',
            position: 'relative',
          }}>
            {/* Icon top-left */}
            <div style={{
              position: 'absolute', top: '.6rem', left: '.6rem',
              width: 28, height: 28, borderRadius: 7,
              background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: '.72rem' }} />
            </div>
            {/* Content right-aligned */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.6rem', color: '#64748b', marginBottom: '.25rem', paddingLeft: 34 }}>&nbsp;</div>
              <div style={{ fontSize: '.6rem', color: '#94a3b8', marginBottom: '.3rem' }}>{s.label}</div>
              <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, whiteSpace: 'pre-line' }}>
                {loading ? '...' : s.val}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add new operation ────────────────────────── */}
      <div style={{ margin: '0 .8rem .9rem', background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)' }}>
        {/* Section title */}
        <div style={{
          padding: '.6rem .9rem', borderBottom: '1px solid rgba(255,255,255,.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        }}>
          <span style={{ fontWeight: 700, fontSize: '.82rem', color: '#e2e8f0' }}>أضف عملية جديدة</span>
        </div>

        {/* Operation type tabs */}
        <div style={{ display: 'flex', gap: '.4rem', padding: '.6rem .9rem .4rem', flexWrap: 'wrap' }}>
          {OP_TABS.map(tab => {
            const active = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: '.35rem',
                padding: '.35rem .75rem', borderRadius: 7, border: 'none',
                background: active ? tab.color : 'rgba(255,255,255,.07)',
                color: active ? '#fff' : '#94a3b8',
                fontSize: '.72rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif',
                boxShadow: active ? `0 2px 8px ${tab.color}55` : 'none',
                transition: 'all .15s',
              }}>
                <i className={`fas ${tab.icon}`} style={{ fontSize: '.65rem' }} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Action description + button */}
        <div style={{
          padding: '.5rem .9rem .8rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <div style={{ fontSize: '.72rem', color: '#64748b' }}>
            {activeTab === 'deposit'       && 'إضافة إيداع أو دخل جديد إلى حسابك'}
            {activeTab === 'expense'       && 'تسجيل مصروف أو نفقة جديدة'}
            {activeTab === 'debt-creditor' && 'تسجيل دين جديد ليك على شخص آخر'}
            {activeTab === 'debt-debtor'   && 'تسجيل دين جديد عليك لشخص آخر'}
          </div>
          <button onClick={handleOp} style={{
            background: OP_TABS.find(t => t.key === activeTab)?.color ?? '#2563eb',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '.5rem 1.2rem', fontSize: '.78rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            display: 'flex', alignItems: 'center', gap: '.4rem',
            whiteSpace: 'nowrap',
          }}>
            <i className="fas fa-plus" style={{ fontSize: '.7rem' }} />
            حفظ العملية
          </button>
        </div>
      </div>

    </div>
  )
}
