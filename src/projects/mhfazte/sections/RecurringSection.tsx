'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PageHeader, Loading, Empty } from './CreditorSection'

interface Recurring {
  id: string; name: string; type: string; currency: string;
  amount: number; day: number | null; last_run: string | null;
}

export default function RecurringSection() {
  const [items, setItems] = useState<Recurring[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mhfazte_recurring')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setItems(data as Recurring[])
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (n: number) => Number(n).toLocaleString('ar-EG', { minimumFractionDigits: 2 })

  return (
    <div>
      <PageHeader title="🔄 المتكررة الشهرية" onAdd={() => {}} />
      <div style={{ padding: '.6rem .75rem' }}>
        {loading ? <Loading /> : items.length === 0 ? <Empty icon="fa-rotate" text="لا توجد مدفوعات متكررة" /> : (
          items.map(r => (
            <div key={r.id} style={{
              background: '#243044', borderRadius: 12, padding: '.8rem .9rem',
              marginBottom: '.45rem', display: 'flex', alignItems: 'center', gap: '.8rem',
              border: '1px solid rgba(255,255,255,.05)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(167,139,250,.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="fas fa-rotate" style={{ color: '#a78bfa', fontSize: '.85rem' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '.88rem', color: '#e2e8f0' }}>{r.name}</div>
                <div style={{ fontSize: '.7rem', color: '#64748b', marginTop: 2 }}>
                  {r.type} · يوم {r.day ?? '—'} من كل شهر
                  {r.last_run ? ` · آخر تشغيل: ${r.last_run}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#a78bfa' }}>{fmt(r.amount)}</div>
                <div style={{ fontSize: '.65rem', color: '#64748b' }}>{r.currency}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
