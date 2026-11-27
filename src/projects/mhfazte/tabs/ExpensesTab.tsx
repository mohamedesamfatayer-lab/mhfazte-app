'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Expense {
  id: string; category: string; amount: number; currency: string;
  note: string | null; date: string | null;
}

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mhfazte_expenses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setExpenses(data as Expense[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'var(--a-text)', fontSize: 20, fontWeight: 800 }}>المصروفات</div>
        <button style={{
          background: 'var(--a-accent)', color: '#fff', border: 'none',
          borderRadius: 10, padding: '6px 16px', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          + إضافة
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--a-dim)', fontSize: 13 }}>جاري التحميل...</div>
      ) : expenses.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--a-dim)', marginTop: '3rem', fontSize: 14 }}>
          لا توجد مصروفات
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {expenses.map(exp => (
            <div key={exp.id} style={{
              background: 'var(--a-surface)',
              border: '1px solid var(--a-line)',
              borderRadius: 14,
              padding: '0.9rem 1.1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--a-text)' }}>{exp.category}</div>
                <div style={{ fontSize: 11, color: 'var(--a-dim)', marginTop: 2 }}>
                  {exp.note ?? ''} {exp.date ? `· ${exp.date}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#f87171' }}>
                  -{String(Math.round(Number(exp.amount) || 0))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--a-dim)' }}>{exp.currency}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
