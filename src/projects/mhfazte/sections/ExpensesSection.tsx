'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Expense {
  id: string; category: string; amount: number; currency: string;
  note: string | null; date: string | null;
}

const CAT_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  'طعام':      { icon: 'fa-utensils',       bg: '#fef2f2', color: '#dc2626' },
  'مواصلات':   { icon: 'fa-car',            bg: '#eff6ff', color: '#2563eb' },
  'تسوق':      { icon: 'fa-bag-shopping',   bg: '#fdf4ff', color: '#9333ea' },
  'صحة':       { icon: 'fa-heart-pulse',    bg: '#f0fdf4', color: '#16a34a' },
  'ترفيه':     { icon: 'fa-gamepad',        bg: '#fff7ed', color: '#ea580c' },
  'فواتير':    { icon: 'fa-file-invoice',   bg: '#fefce8', color: '#ca8a04' },
  'تعليم':     { icon: 'fa-graduation-cap', bg: '#eff6ff', color: '#3b82f6' },
  'إيجار':     { icon: 'fa-house',          bg: '#f0fdf4', color: '#059669' },
  'أخرى':      { icon: 'fa-ellipsis',       bg: '#f8fafc', color: '#64748b' },
}

export default function ExpensesSection({ onAdd }: { onAdd?: () => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().slice(0, 10)
  const month = today.slice(0, 7)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mhfazte_expenses').select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200)
      if (data) setExpenses(data as Expense[])
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (n: number, cur: string) =>
    `${Number(n).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ${cur}`

  const todayByCur = expenses.filter(e => e.date === today)
    .reduce((acc, e) => { acc[e.currency] = (acc[e.currency] ?? 0) + Number(e.amount); return acc }, {} as Record<string, number>)

  const monthByCur = expenses.filter(e => e.date?.startsWith(month))
    .reduce((acc, e) => { acc[e.currency] = (acc[e.currency] ?? 0) + Number(e.amount); return acc }, {} as Record<string, number>)

  const statText = (obj: Record<string, number>) =>
    Object.entries(obj).map(([c, v]) => fmt(v, c)).join(' · ') || '0.00'

  async function deleteExpense(id: string) {
    await createClient().from('mhfazte_expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="section-anim">
      <div className="page-header">
        <span className="page-header-title">المصروفات</span>
        {onAdd && (
          <button className="page-header-btn" onClick={onAdd}>
            <i className="fas fa-plus" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '.6rem', padding: '.7rem .8rem 0' }}>
        <div className="stat-mini" style={{ background: '#fffbeb' }}>
          <div className="stat-mini-label">مصروف اليوم</div>
          <div style={{ color: '#d97706', lineHeight: 1.5, fontSize: '.85rem', fontWeight: 800 }}>{statText(todayByCur)}</div>
        </div>
        <div className="stat-mini" style={{ background: '#fef2f2' }}>
          <div className="stat-mini-label">مصروف الشهر</div>
          <div style={{ color: '#dc2626', lineHeight: 1.5, fontSize: '.85rem', fontWeight: 800 }}>{statText(monthByCur)}</div>
        </div>
      </div>

      {/* Expense list */}
      <div style={{ padding: '.6rem .8rem' }}>
        {loading ? (
          <div className="empty-state"><i className="fas fa-spinner fa-spin" /><p>جاري التحميل...</p></div>
        ) : expenses.length === 0 ? (
          <div className="empty-state"><i className="fas fa-receipt" /><p>لا توجد مصروفات</p></div>
        ) : (
          expenses.map(e => {
            const ci = CAT_ICONS[e.category] ?? CAT_ICONS['أخرى']
            return (
              <div key={e.id} className="expense-item">
                <div className="expense-cat-icon" style={{ background: ci.bg }}>
                  <i className={`fas ${ci.icon}`} style={{ color: ci.color }} />
                </div>
                <div className="expense-info">
                  <div className="expense-note">{e.note || e.category}</div>
                  <div className="expense-cat">{e.category} · {e.date ?? '—'}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div className="expense-amount">
                    {Number(e.amount).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '.65rem', color: '#64748b' }}>{e.currency}</div>
                </div>
                <button onClick={() => deleteExpense(e.id)} className="tx-act-btn del">
                  <i className="fas fa-trash-can" />
                </button>
              </div>
            )
          })
        )}
      </div>
      <div style={{ height: '1.5rem' }} />
    </div>
  )
}
