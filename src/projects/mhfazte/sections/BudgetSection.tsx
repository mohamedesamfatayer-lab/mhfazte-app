'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PageHeader, Loading, Empty } from './CreditorSection'

interface Budget { category: string; egp: number; sar: number }

export default function BudgetSection() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('mhfazte_budgets').select('*')
      if (data) setBudgets(data as Budget[])
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (n: number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })

  return (
    <div>
      <PageHeader title="الميزانية" onAdd={() => {}} />
      <div style={{ padding: '.6rem .75rem' }}>
        {loading ? <Loading /> : budgets.length === 0 ? <Empty icon="fa-bullseye" text="لا توجد ميزانية محددة" /> : (
          budgets.map(b => (
            <div key={b.category} style={{
              background: '#243044', borderRadius: 12, padding: '.8rem .9rem',
              marginBottom: '.45rem', border: '1px solid rgba(255,255,255,.05)',
            }}>
              <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#e2e8f0', marginBottom: '.4rem' }}>{b.category}</div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.05)', borderRadius: 8, padding: '.35rem .5rem' }}>
                  <div style={{ fontSize: '.6rem', color: '#64748b' }}>EGP</div>
                  <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#fbbf24' }}>{fmt(b.egp)}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.05)', borderRadius: 8, padding: '.35rem .5rem' }}>
                  <div style={{ fontSize: '.6rem', color: '#64748b' }}>SAR</div>
                  <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#fbbf24' }}>{fmt(b.sar)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
