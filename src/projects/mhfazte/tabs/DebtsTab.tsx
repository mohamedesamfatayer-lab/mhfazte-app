'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Debt {
  id: string; type: string; name: string; currency: string;
  amount: number; remaining: number; date: string | null; note: string | null;
}

export default function DebtsTab() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'له' | 'عليه'>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mhfazte_debts')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setDebts(data as Debt[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? debts : debts.filter(d => d.type === filter)

  return (
    <div style={{ padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'var(--a-text)', fontSize: 20, fontWeight: 800 }}>الديون</div>
        <button style={{
          background: 'var(--a-accent)', color: '#fff', border: 'none',
          borderRadius: 10, padding: '6px 16px', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          + إضافة
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        {(['all', 'له', 'عليه'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 20, border: 'none',
            background: filter === f ? 'var(--a-accent)' : 'var(--a-surface)',
            color: filter === f ? '#fff' : 'var(--a-dim)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {f === 'all' ? 'الكل' : f === 'له' ? 'له عليّ' : 'عليه لي'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--a-dim)', fontSize: 13 }}>جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--a-dim)', marginTop: '3rem', fontSize: 14 }}>
          لا توجد ديون
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(debt => (
            <div key={debt.id} style={{
              background: 'var(--a-surface)',
              border: '1px solid var(--a-line)',
              borderRadius: 14,
              padding: '1rem 1.1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--a-text)' }}>{debt.name}</div>
                <div style={{ fontSize: 12, color: 'var(--a-dim)', marginTop: 2 }}>
                  {debt.type === 'له' ? 'له عليّ' : 'عليه لي'} · {debt.date ?? '—'}
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: debt.type === 'له' ? '#f87171' : '#34d399' }}>
                  {Number(debt.remaining).toLocaleString('ar-EG')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--a-dim)' }}>{debt.currency}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
