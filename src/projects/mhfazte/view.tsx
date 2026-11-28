'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import './mhfazte.css'
import HomeSection from './sections/HomeSection'
import CreditorSection from './sections/CreditorSection'
import DebtorSection from './sections/DebtorSection'
import ExpensesSection from './sections/ExpensesSection'
import HistorySection from './sections/HistorySection'
import ReportsSection from './sections/ReportsSection'
import BudgetSection from './sections/BudgetSection'
import RemindersSection from './sections/RemindersSection'
import RecurringSection from './sections/RecurringSection'
import DepositModal from './modals/DepositModal'
import AddExpenseModal from './modals/AddExpenseModal'
import AddDebtModal from './modals/AddDebtModal'
import PaymentModal from './modals/PaymentModal'
import SetBalanceModal from './modals/SetBalanceModal'

type Section = 'home' | 'creditor' | 'debtor' | 'expenses' | 'history' | 'reports' | 'budget' | 'reminders' | 'recurring'
type Modal = 'deposit' | 'expense' | 'debt-creditor' | 'debt-debtor' | 'set-balance' | null

interface DebtForPayment {
  id: string; name: string; remaining: number; amount: number; currency: string; subtype: string | null
}
interface User { name: string; avatar: string | null }

const NAV_SECTIONS = [
  {
    items: [
      { id: 'home',      label: 'الرئيسية',    icon: 'fa-house',               color: '#60a5fa' },
    ],
  },
  {
    title: 'الديون',
    items: [
      { id: 'creditor',  label: 'ليا دائن',    icon: 'fa-hand-holding-heart',  color: '#34d399' },
      { id: 'debtor',    label: 'عليا مدين',   icon: 'fa-hand-holding-dollar', color: '#f87171' },
      { id: 'expenses',  label: 'المصروفات',   icon: 'fa-receipt',             color: '#fbbf24' },
    ],
  },
  {
    title: 'السجلات',
    items: [
      { id: 'history',   label: 'المعاملات',   icon: 'fa-clock-rotate-left',   color: '#a78bfa' },
      { id: 'reports',   label: 'التقارير',    icon: 'fa-chart-bar',           color: '#a78bfa' },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { id: 'budget',    label: 'الميزانية',   icon: 'fa-bullseye',            color: '#fbbf24' },
      { id: 'reminders', label: 'التذكيرات',   icon: 'fa-bell',                color: '#34d399' },
      { id: 'recurring', label: 'متكرر',        icon: 'fa-rotate',              color: '#a78bfa' },
    ],
  },
]

export default function MhfazteView() {
  const [active, setActive] = useState<Section>('home')
  const [modal, setModal] = useState<Modal>(null)
  const [paymentDebt, setPaymentDebt] = useState<DebtForPayment | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [toast, setToast] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [monthExpenses, setMonthExpenses] = useState<Record<string, number>>({})
  const [monthTxCount, setMonthTxCount] = useState(0)

  const month = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          name: data.user.user_metadata?.full_name ?? data.user.email ?? '',
          avatar: data.user.user_metadata?.avatar_url ?? null,
        })
      }
    })
  }, [])

  useEffect(() => {
    async function loadStats() {
      const sb = createClient()
      const { data: { user: u } } = await sb.auth.getUser()
      if (!u) return
      const [expRes, txRes] = await Promise.all([
        sb.from('mhfazte_expenses').select('amount,currency').eq('user_id', u.id).gte('date', `${month}-01`),
        sb.from('mhfazte_transactions').select('id', { count: 'exact', head: true }).eq('user_id', u.id).gte('date', `${month}-01`),
      ])
      if (expRes.data) {
        const totals: Record<string, number> = {}
        for (const r of expRes.data as { amount: number; currency: string }[]) {
          totals[r.currency] = (totals[r.currency] ?? 0) + Number(r.amount)
        }
        setMonthExpenses(totals)
      }
      setMonthTxCount((txRes as any).count ?? 0)
    }
    loadStats()
  }, [refresh, month])

  const onSaved = () => setRefresh(r => r + 1)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function exportBackup() {
    const sb = createClient()
    const { data: { user: u } } = await sb.auth.getUser()
    if (!u) return
    const [debts, txs, expenses, reminders] = await Promise.all([
      sb.from('mhfazte_debts').select('*'),
      sb.from('mhfazte_transactions').select('*'),
      sb.from('mhfazte_expenses').select('*'),
      sb.from('mhfazte_reminders').select('*'),
    ])
    const backup = {
      exported_at: new Date().toISOString(),
      debts: debts.data, transactions: txs.data,
      expenses: expenses.data, reminders: reminders.data,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `mhfazte-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    showToast('✅ تم تصدير النسخة الاحتياطية')
  }

  async function exportExcel() {
    const sb = createClient()
    const { data: { user: u } } = await sb.auth.getUser()
    if (!u) return
    const { data } = await sb.from('mhfazte_debts').select('*').order('created_at', { ascending: false })
    if (!data?.length) { showToast('لا توجد بيانات للتصدير'); return }

    const header = ['م', 'الاسم', 'النوع', 'الفئة', 'العملة', 'المبلغ', 'الباقي', 'التاريخ', 'الملاحظة']
    const rows = (data as any[]).map((d, i) => [
      i + 1, d.name, d.type, d.subtype ?? '', d.currency, d.amount, d.remaining, d.date ?? '', d.note ?? ''
    ])
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `mhfazte-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    showToast('✅ تم تصدير ملف Excel')
  }

  const ACTIONS = [
    { label: 'رفع إلى السحابة',    icon: 'fa-cloud-arrow-up',   color: '#2563eb', fn: () => showToast('⏳ ميزة السحابة قريباً') },
    { label: 'تحميل من السحابة',   icon: 'fa-cloud-arrow-down', color: '#059669', fn: () => showToast('⏳ ميزة السحابة قريباً') },
    { label: 'تصدير Excel',        icon: 'fa-file-excel',       color: '#16a34a', fn: exportExcel },
    { label: 'نسخة احتياطية',      icon: 'fa-database',         color: '#7c3aed', fn: exportBackup },
  ]

  const sectionLabel: Record<Section, string> = {
    home: 'الرئيسية', creditor: 'ليا دائن', debtor: 'عليا مدين',
    expenses: 'المصروفات', history: 'المعاملات', reports: 'التقارير',
    budget: 'الميزانية', reminders: 'التذكيرات', recurring: 'متكرر',
  }

  return (
    <div className="mhfazte-root" style={{
      display: 'flex', flexDirection: 'row',
      width: '100%', height: '100dvh', overflow: 'hidden',
      background: '#0f1a2e',
      fontFamily: "'Cairo', sans-serif",
      color: '#e2e8f0',
      direction: 'rtl',
    }}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 40,
        }} />
      )}

      {/* ══ Right Sidebar ══════════════════════════════ */}
      <aside style={{
        width: 240, minWidth: 240, height: '100%',
        background: '#0d1521',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0,
        borderLeft: '1px solid rgba(255,255,255,.06)',
        overflowY: 'auto',
        position: 'fixed' as const,
        top: 0, right: 0, bottom: 0,
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .25s ease',
      }}>

        {/* Brand header */}
        <div style={{ padding: '1rem 1rem .8rem', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.8rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              background: 'linear-gradient(135deg,#1d4ed8,#2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,.4)',
            }}>
              <i className="fas fa-wallet" style={{ color: '#fff', fontSize: '1rem' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', lineHeight: 1.2 }}>محفظتي</div>
              <div style={{ fontSize: '.65rem', color: '#4b5563', marginTop: 2 }}>إدارة المال والديون</div>
            </div>
          </div>
          <a href="/" style={{
            display: 'flex', alignItems: 'center', gap: '.5rem',
            padding: '.5rem .75rem', borderRadius: 8, textDecoration: 'none',
            color: '#60a5fa', fontSize: '.78rem', fontWeight: 600,
            background: 'rgba(37,99,235,.12)', border: '1px solid rgba(37,99,235,.25)',
            transition: 'all .15s',
          }}>
            <i className="fas fa-arrow-right" style={{ fontSize: '.68rem' }} />
            القائمة الرئيسية
          </a>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '.5rem 0' }}>
          {NAV_SECTIONS.map((sec, si) => (
            <div key={si}>
              {sec.title && (
                <div style={{
                  fontSize: '.62rem', color: '#4b5563', fontWeight: 700,
                  padding: '.7rem 1rem .25rem', letterSpacing: 1,
                }}>
                  {sec.title}
                </div>
              )}
              {sec.items.map(item => {
                const isActive = active === item.id as Section
                return (
                  <button key={item.id} onClick={() => { setActive(item.id as Section); setSidebarOpen(false) }} style={{
                    display: 'flex', alignItems: 'center', gap: '.65rem',
                    padding: '.6rem .75rem',
                    margin: '1px .5rem', width: 'calc(100% - 1rem)',
                    background: isActive ? 'rgba(255,255,255,.08)' : 'transparent',
                    border: 'none', borderRadius: 8,
                    color: isActive ? '#fff' : '#8899aa',
                    fontSize: '.83rem', fontWeight: isActive ? 700 : 400,
                    cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                    textAlign: 'right', direction: 'rtl',
                    transition: 'all .15s',
                  }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)' }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <i className={`fas ${item.icon}`} style={{
                      fontSize: '.85rem', width: 18, textAlign: 'center',
                      color: isActive ? item.color : '#4b5563',
                    }} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ── إحصائيات الشهر ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '.6rem .75rem' }}>
          <div style={{ fontSize: '.62rem', color: '#4b5563', fontWeight: 700, marginBottom: '.4rem', letterSpacing: 1 }}>
            إحصائيات الشهر
          </div>
          <div style={{ display: 'flex', gap: '.4rem' }}>
            <div style={{
              flex: 1, background: 'rgba(220,38,38,.1)', borderRadius: 8,
              padding: '.45rem .5rem', border: '1px solid rgba(220,38,38,.18)',
            }}>
              <div style={{ fontSize: '.6rem', color: '#f87171', marginBottom: 2 }}>مصروفات الشهر</div>
              <div style={{ fontSize: '.78rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                {Object.entries(monthExpenses).length === 0
                  ? '0'
                  : Object.entries(monthExpenses).map(([c, v]) => {
                      const lbl: Record<string,string> = { EGP: 'ج.م', SAR: 'ريال', USD: '$' }
                      const fv = v % 1 === 0 ? String(v) : String(parseFloat(v.toFixed(2)))
                      return `${fv} ${lbl[c] ?? c}`
                    }).join(' · ')
                }
              </div>
            </div>
            <div style={{
              flex: 1, background: 'rgba(139,92,246,.1)', borderRadius: 8,
              padding: '.45rem .5rem', border: '1px solid rgba(139,92,246,.18)',
            }}>
              <div style={{ fontSize: '.6rem', color: '#a78bfa', marginBottom: 2 }}>معاملات الشهر</div>
              <div style={{ fontSize: '.78rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                {monthTxCount}
              </div>
            </div>
          </div>
        </div>

        {/* ── إجراءات section ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '.5rem 0' }}>
          <div style={{
            fontSize: '.62rem', color: '#4b5563', fontWeight: 700,
            padding: '.5rem 1rem .25rem', letterSpacing: 1,
          }}>
            إجراءات
          </div>
          {ACTIONS.map(a => (
            <button key={a.label} onClick={a.fn} style={{
              width: 'calc(100% - 1rem)', display: 'flex', alignItems: 'center', gap: '.65rem',
              padding: '.55rem .75rem', margin: '1px .5rem',
              background: 'transparent', border: 'none', borderRadius: 8,
              color: '#8899aa', fontSize: '.83rem', fontWeight: 400,
              cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
              textAlign: 'right', direction: 'rtl', transition: 'all .15s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,.04)'; el.style.color = '#fff' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = '#8899aa' }}
            >
              <i className={`fas ${a.icon}`} style={{ fontSize: '.85rem', width: 18, textAlign: 'center', color: a.color }} />
              {a.label}
            </button>
          ))}
        </div>

        {/* ── روابط سريعة ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '.6rem .75rem' }}>
          <div style={{ fontSize: '.62rem', color: '#4b5563', fontWeight: 700, marginBottom: '.4rem', letterSpacing: 1 }}>
            روابط سريعة
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.35rem' }}>
            {[
              { label: 'GitHub',   href: 'https://github.com/mohamedesamfatayer-lab/mhfazte-app', bg: 'rgba(255,255,255,.06)', border: 'rgba(255,255,255,.1)',  icon: 'fa-brands fa-github',  color: '#e2e8f0' },
              { label: 'Vercel',   href: 'https://vercel.com/dashboard',                           bg: 'rgba(0,0,0,.3)',        border: 'rgba(255,255,255,.1)',  icon: 'fa-solid fa-triangle-exclamation', color: '#fff' },
              { label: 'Supabase', href: 'https://supabase.com/dashboard',                         bg: 'rgba(62,207,142,.08)', border: 'rgba(62,207,142,.2)',  icon: 'fa-solid fa-database', color: '#3ecf8e' },
              { label: 'Firebase', href: 'https://console.firebase.google.com',                    bg: 'rgba(255,160,0,.08)',  border: 'rgba(255,160,0,.2)',   icon: 'fa-solid fa-fire',     color: '#ffa000' },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.25rem',
                padding: '.45rem .3rem', borderRadius: 8, textDecoration: 'none',
                background: l.bg, border: `1px solid ${l.border}`,
                transition: 'opacity .15s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '.75'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              >
                <i className={l.icon} style={{ fontSize: '.95rem', color: l.color }} />
                <span style={{ fontSize: '.6rem', color: '#8899aa', fontWeight: 600 }}>{l.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* User */}
        {user && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '.75rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              {user.avatar ? (
                <img src={user.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#15803d,#22c55e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.88rem', fontWeight: 800, color: '#fff',
                }}>{user.name[0]}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: '.63rem', color: '#4b5563' }}>مدير الحساب</div>
              </div>
              <button onClick={() => createClient().auth.signOut().then(() => { window.location.href = '/login' })} style={{
                width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(220,38,38,.35)',
                background: 'rgba(220,38,38,.12)', color: '#f87171',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }} title="تسجيل الخروج">
                <i className="fas fa-right-from-bracket" style={{ fontSize: '.68rem' }} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ══ Main content ════════════════════════════════ */}
      <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          flexShrink: 0, height: 50,
          background: '#0d1521',
          display: 'flex', alignItems: 'center',
          padding: '0 1rem',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          direction: 'rtl',
          gap: '.6rem',
        }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 7,
            color: '#e2e8f0', cursor: 'pointer', padding: '.3rem .55rem', fontSize: '.9rem',
            fontFamily: 'Cairo, sans-serif',
          }}>
            <i className="fas fa-bars" />
          </button>
          <span style={{ fontSize: '.85rem', fontWeight: 600, color: '#e2e8f0', flex: 1, fontFamily: 'Cairo, sans-serif' }}>
            {sectionLabel[active]}
            {active === 'home' && (
              <span style={{ fontSize: '.75rem', fontWeight: 400, color: '#8899aa', marginRight: '.5rem' }}>إدارة المال والديون والمصروفات</span>
            )}
          </span>
          {active !== 'home' && (
            <button onClick={() => setActive('home')} style={{
              background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 7,
              color: '#e2e8f0', cursor: 'pointer', padding: '.3rem .6rem', fontSize: '.8rem',
              display: 'flex', alignItems: 'center', gap: '.3rem', fontFamily: 'Cairo, sans-serif',
              flexShrink: 0, fontWeight: 600,
            }}>
              <i className="fas fa-arrow-right" style={{ fontSize: '.72rem' }} />
              رجوع
            </button>
          )}
        </div>

        {/* Section content */}
        <div style={{
          flex: 1, minHeight: 0,
          overflowY: 'auto', overflowX: 'hidden',
          background: '#0f1a2e',
          direction: 'rtl',
        }}>
          {active === 'home'      && <HomeSection key={refresh} onDeposit={() => setModal('deposit')} onExpense={() => setModal('expense')} onDebt={(t) => setModal(t === 'creditor' ? 'debt-creditor' : 'debt-debtor')} onSetBalance={() => setModal('set-balance')} />}
          {active === 'creditor'  && <CreditorSection key={refresh} onAdd={() => setModal('debt-creditor')} onPayment={d => setPaymentDebt(d)} />}
          {active === 'debtor'    && <DebtorSection key={refresh} onAdd={() => setModal('debt-debtor')} onPayment={d => setPaymentDebt(d)} />}
          {active === 'expenses'  && <ExpensesSection key={refresh} onAdd={() => setModal('expense')} />}
          {active === 'history'   && <HistorySection key={refresh} />}
          {active === 'reports'   && <ReportsSection key={refresh} />}
          {active === 'budget'    && <BudgetSection key={refresh} />}
          {active === 'reminders' && <RemindersSection key={refresh} />}
          {active === 'recurring' && <RecurringSection key={refresh} />}
        </div>
      </div>

      {/* Modals */}
      {modal === 'deposit'      && <DepositModal onClose={() => setModal(null)} onSaved={onSaved} />}
      {modal === 'expense'      && <AddExpenseModal onClose={() => setModal(null)} onSaved={onSaved} />}
      {modal === 'set-balance'  && <SetBalanceModal onClose={() => setModal(null)} onSaved={onSaved} />}
      {(modal === 'debt-creditor' || modal === 'debt-debtor') && (
        <AddDebtModal type={modal === 'debt-creditor' ? 'دائن' : 'مدين'} onClose={() => setModal(null)} onSaved={onSaved} />
      )}
      {paymentDebt && (
        <PaymentModal debt={paymentDebt} onClose={() => setPaymentDebt(null)} onSaved={onSaved} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: '#1e2d42', border: '1px solid rgba(255,255,255,.12)',
          color: '#e2e8f0', borderRadius: 10, padding: '.6rem 1.2rem',
          fontSize: '.82rem', fontWeight: 600, zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,.4)',
          fontFamily: 'Cairo, sans-serif',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
