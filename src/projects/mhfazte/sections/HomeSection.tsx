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

  const fmt = (n: number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
        padding: '.6rem 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '.83rem', color: '#3b82f6', fontWeight: 700 }}>محفظتي — الرئيسية</div>
          <div style={{ fontSize: '.65rem', color: DIM_TXT }}>إدارة المال والديون والمصروفات</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontSize: '.7rem', color: SEC_TXT }}>{todayAr()}</span>
          <button onClick={onDeposit} style={{
            background: '#15803d', color: '#fff', border: 'none',
            borderRadius: 8, padding: '.38rem .85rem',
            fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif',
            display: 'flex', alignItems: 'center', gap: '.35rem',
          }}>
            <i className="fas fa-plus" style={{ fontSize: '.68rem' }} />
            إجراءات
            <i className="fas fa-caret-down" style={{ fontSize: '.63rem' }} />
          </button>
        </div>
      </div>

      {/* ── Two large featured cards ─────────────────── */}
      <div style={{ display: 'flex', gap: '.75rem', margin: '.8rem .9rem .6rem', alignItems: 'stretch' }}>

        {/* Green card – ليا دائن */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg,#14532d,#16a34a)',
          borderRadius: 12, padding: '1rem 1.1rem',
          boxShadow: '0 4px 20px rgba(22,163,74,.3)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(255,255,255,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fas fa-hand-holding-heart" style={{ color: '#fff', fontSize: '1rem' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.7)', marginBottom: '.25rem' }}>ليا دائن (الكلي)</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, whiteSpace: 'pre-line' }}>
                {loading ? '...' : totalCredStr}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '.6rem', fontSize: '.68rem', color: 'rgba(255,255,255,.6)' }}>
            إجمالي ما يستحق لك من الآخرين
          </div>
        </div>

        {/* Dark card – رصيد الحساب */}
        <div style={{
          flex: 1,
          background: CARD_BG,
          borderRadius: 12, padding: '1rem 1.1rem',
          border: BORDER,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(37,99,235,.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fas fa-vault" style={{ color: '#60a5fa', fontSize: '1rem' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.68rem', color: SEC_TXT, marginBottom: '.25rem' }}>رصيد الحساب الحالي</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, whiteSpace: 'pre-line' }}>
                {loading ? '...' : balStr}
              </div>
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
            flex: '0 0 135px',
            background: CARD_BG,
            borderRadius: 10, padding: '.7rem .8rem',
            border: BORDER,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '.65rem', left: '.65rem',
              width: 30, height: 30, borderRadius: 8,
              background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: '.75rem' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.68rem', color: SEC_TXT, marginBottom: '.3rem', paddingLeft: 36 }}>&nbsp;</div>
              <div style={{ fontSize: '.65rem', color: DIM_TXT, marginBottom: '.3rem' }}>{s.label}</div>
              <div style={{ fontSize: '.98rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, whiteSpace: 'pre-line' }}>
                {loading ? '...' : s.val}
              </div>
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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <div style={{ fontSize: '.75rem', color: DIM_TXT }}>
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
