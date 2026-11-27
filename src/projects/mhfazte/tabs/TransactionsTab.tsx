'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Tx {
  id: string; type: string; amount: number; currency: string;
  note: string | null; date: string | null; category: string | null;
}

export default function TransactionsTab() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mhfazte_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setTxs(data as Tx[])
      setLoading(false)
    }
    load()
  }, [])

  const typeColor = (t: string) =>
    t === 'income' ? '#34d399' : t === 'expense' ? '#f87171' : '#60a5fa'
  const typeLabel = (t: string) =>
    t === 'income' ? 'دخل' : t === 'expense' ? 'مصروف' : 'تحويل'

  return (
    <div style={{ padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'var(--a-text)', fontSize: 20, fontWeight: 800 }}>المعاملات</div>
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
      ) : txs.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--a-dim)', marginTop: '3rem', fontSize: 14 }}>
          لا توجد معاملات
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {txs.map(tx => (
            <div key={tx.id} style={{
              background: 'var(--a-surface)',
              border: '1px solid var(--a-line)',
              borderRadius: 14,
              padding: '0.9rem 1.1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--a-text)' }}>
                  {tx.note ?? tx.category ?? '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--a-dim)', marginTop: 2 }}>
                  {typeLabel(tx.type)} · {tx.date ?? '—'}
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: typeColor(tx.type) }}>
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                  {Number(tx.amount).toLocaleString('en-US')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--a-dim)' }}>{tx.currency}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
