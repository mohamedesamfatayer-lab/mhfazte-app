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

type Section = 'home' | 'creditor' | 'debtor' | 'expenses' | 'history' | 'reports' | 'budget' | 'reminders' | 'recurring'
type Modal = 'deposit' | 'expense' | 'debt-creditor' | 'debt-debtor' | null

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
      background: '#1a2535',
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

      {/* ══ Right Sidebar (kababji style) ══════════════ */}
      <aside style={{
        width: 220, minWidth: 220, height: '100%',
        background: '#141c2b',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0,
        borderLeft: '1px solid rgba(255,255,255,.07)',
        overflowY: 'auto',
        // Mobile: fixed overlay, hidden by default
        position: 'fixed' as const,
        top: 0, right: 0, bottom: 0,
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .25s ease',
      }}>

        {/* القائمة الرئيسية */}
        <a href="/" style={{
          display: 'flex', alignItems: 'center', gap: '.55rem',
          padding: '.6rem .9rem', margin: '.6rem .7rem',
          borderRadius: 9, textDecoration: 'none',
          color: '#60a5fa', fontSize: '.78rem', fontWeight: 700,
          background: 'rgba(37,99,235,.18)',
          border: '1px solid rgba(37,99,235,.35)',
        }}>
          <i className="fas fa-arrow-right" style={{ fontSize: '.72rem' }} />
          القائمة الرئيسية
        </a>

        {/* System header */}
        <div style={{ padding: '.9rem 1rem .6rem', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(37,99,235,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fas fa-wallet" style={{ color: '#60a5fa', fontSize: '.95rem' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '.92rem', color: '#fff' }}>محفظتي</div>
              <div style={{ fontSize: '.6rem', color: '#64748b' }}>إدارة المال والديون</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, paddingTop: '.4rem' }}>
          {NAV_SECTIONS.map((sec, si) => (
            <div key={si}>
              {sec.title && (
                <div style={{
                  fontSize: '.58rem', color: '#475569', fontWeight: 700,
                  padding: '.5rem 1rem .2rem', letterSpacing: .8, textTransform: 'uppercase',
                }}>
                  {sec.title}
                </div>
              )}
              {sec.items.map(item => {
                const isActive = active === item.id as Section
                return (
                  <button key={item.id} onClick={() => { setActive(item.id as Section); setSidebarOpen(false) }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '.6rem',
                    padding: '.55rem 1rem',
                    background: isActive ? 'rgba(37,99,235,.2)' : 'transparent',
                    borderRight: `3px solid ${isActive ? item.color : 'transparent'}`,
                    color: isActive ? '#fff' : '#94a3b8',
                    fontSize: '.8rem', fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                    textAlign: 'right', direction: 'rtl',
                    transition: 'all .15s',
                  }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.05)' }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <i className={`fas ${item.icon}`} style={{
                      fontSize: '.82rem', width: 16, textAlign: 'center',
                      color: isActive ? item.color : '#475569',
                    }} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ── إجراءات section ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingBottom: '.5rem' }}>
          <div style={{
            fontSize: '.58rem', color: '#475569', fontWeight: 700,
            padding: '.6rem 1rem .3rem', letterSpacing: .8,
          }}>
            إجراءات
          </div>
          {ACTIONS.map(a => (
            <button key={a.label} onClick={a.fn} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '.6rem',
              padding: '.5rem 1rem', background: 'transparent', border: 'none',
              color: '#94a3b8', fontSize: '.76rem', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
              textAlign: 'right', direction: 'rtl', transition: 'all .15s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,.05)'; el.style.color = '#fff' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = '#94a3b8' }}
            >
              <i className={`fas ${a.icon}`} style={{ fontSize: '.8rem', width: 16, textAlign: 'center', color: a.color }} />
              {a.label}
            </button>
          ))}
        </div>

        {/* User */}
        {user && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '.7rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
              {user.avatar ? (
                <img src={user.avatar} alt="" style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(37,99,235,.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.8rem', fontWeight: 800, color: '#fff',
                }}>{user.name[0]}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: '.58rem', color: '#64748b' }}>مدير الحساب</div>
              </div>
              <button onClick={() => createClient().auth.signOut().then(() => { window.location.href = '/login' })} style={{
                width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(220,38,38,.4)',
                background: 'rgba(220,38,38,.15)', color: '#f87171',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }} title="تسجيل الخروج">
                <i className="fas fa-right-from-bracket" style={{ fontSize: '.65rem' }} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ══ Main content ════════════════════════════════ */}
      <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          flexShrink: 0, height: 48,
          background: '#1e2d42',
          display: 'flex', alignItems: 'center',
          padding: '0 1rem',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          direction: 'rtl',
          gap: '.6rem',
        }}>
          <span style={{ fontWeight: 700, fontSize: '.82rem', color: '#2563eb' }}>محفظتي</span>
          <span style={{ color: 'rgba(255,255,255,.2)', margin: '0 .4rem' }}>/</span>
          <span style={{ fontSize: '.82rem', color: '#94a3b8', flex: 1 }}>{sectionLabel[active]}</span>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            background: 'rgba(255,255,255,.07)', border: 'none', borderRadius: 7,
            color: '#94a3b8', cursor: 'pointer', padding: '.3rem .5rem', fontSize: '1rem',
          }}>
            <i className="fas fa-bars" />
          </button>
        </div>

        {/* Section content */}
        <div style={{
          flex: 1, minHeight: 0,
          overflowY: 'auto', overflowX: 'hidden',
          background: '#1a2535',
          direction: 'rtl',
        }}>
          {active === 'home'      && <HomeSection key={refresh} onDeposit={() => setModal('deposit')} onExpense={() => setModal('expense')} onDebt={(t) => setModal(t === 'creditor' ? 'debt-creditor' : 'debt-debtor')} />}
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
      {modal === 'deposit' && <DepositModal onClose={() => setModal(null)} onSaved={onSaved} />}
      {modal === 'expense' && <AddExpenseModal onClose={() => setModal(null)} onSaved={onSaved} />}
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
