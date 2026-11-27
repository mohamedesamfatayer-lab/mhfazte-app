'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Account { balances: Record<string, number> }

export default function HomeTab() {
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('mhfazte_account')
        .select('balances')
        .eq('user_id', user.id)
        .single()

      if (data) setBalances((data as Account).balances ?? {})
      setLoading(false)
    }
    load()
  }, [])

  const currencies = Object.keys(balances).length > 0
    ? Object.entries(balances)
    : [['EGP', 0], ['SAR', 0]]

  return (
    <div style={{ padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ color: 'var(--a-dim)', fontSize: 13, marginBottom: 4 }}>محفظتي</div>
        <div style={{ color: 'var(--a-text)', fontSize: 22, fontWeight: 800 }}>الرئيسية</div>
      </div>

      {/* Balance cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem' }}>
        {loading ? (
          <div style={{ color: 'var(--a-dim)', fontSize: 13 }}>جاري التحميل...</div>
        ) : currencies.map(([cur, amt]) => (
          <div key={cur} style={{
            background: 'var(--a-surface)',
            border: '1px solid var(--a-line)',
            borderRadius: 16,
            padding: '1.1rem 1.2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ color: 'var(--a-dim)', fontSize: 12, marginBottom: 4 }}>الرصيد</div>
              <div style={{ color: 'var(--a-text)', fontSize: 24, fontWeight: 800 }}>
                {String(Math.round(Number(amt) || 0))}
              </div>
            </div>
            <div style={{
              background: 'var(--a-accent)',
              color: '#fff',
              borderRadius: 10,
              padding: '4px 14px',
              fontWeight: 700,
              fontSize: 14,
            }}>
              {String(cur)}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ color: 'var(--a-dim)', fontSize: 12, marginBottom: 10, fontWeight: 600 }}>
        إجراءات سريعة
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'إضافة دين',       icon: '🤝' },
          { label: 'إضافة معاملة',    icon: '💸' },
          { label: 'إضافة مصروف',    icon: '📊' },
          { label: 'إضافة تذكير',    icon: '🔔' },
        ].map(action => (
          <button key={action.label} style={{
            background: 'var(--a-surface)',
            border: '1px solid var(--a-line)',
            borderRadius: 12,
            padding: '0.9rem',
            color: 'var(--a-text)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
