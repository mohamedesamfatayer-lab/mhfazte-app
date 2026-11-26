'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PageHeader, Loading, Empty } from './CreditorSection'

interface Reminder {
  id: string; title: string; date: string | null; note: string | null; done: boolean;
}

export default function RemindersSection() {
  const [items, setItems] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mhfazte_reminders')
        .select('*')
        .order('date', { ascending: true })
      if (data) setItems(data as Reminder[])
      setLoading(false)
    }
    load()
  }, [])

  async function toggleDone(id: string, done: boolean) {
    const supabase = createClient()
    await supabase.from('mhfazte_reminders').update({ done: !done }).eq('id', id)
    setItems(prev => prev.map(r => r.id === id ? { ...r, done: !done } : r))
  }

  const pending = items.filter(r => !r.done)
  const done = items.filter(r => r.done)

  return (
    <div>
      <PageHeader title="🔔 التذكيرات" onAdd={() => {}} />
      <div style={{ padding: '.6rem .75rem' }}>
        {loading ? <Loading /> : items.length === 0 ? <Empty icon="fa-bell" text="لا توجد تذكيرات" /> : (
          <>
            {pending.map(r => <ReminderCard key={r.id} r={r} onToggle={toggleDone} />)}
            {done.length > 0 && (
              <>
                <div style={{ fontSize: '.72rem', color: '#64748b', margin: '.6rem 0 .3rem', fontWeight: 600 }}>✅ منتهية</div>
                {done.map(r => <ReminderCard key={r.id} r={r} onToggle={toggleDone} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ReminderCard({ r, onToggle }: { r: any; onToggle: (id: string, done: boolean) => void }) {
  return (
    <div style={{
      background: '#243044', borderRadius: 12, padding: '.8rem .9rem',
      marginBottom: '.45rem', display: 'flex', alignItems: 'center', gap: '.8rem',
      border: '1px solid rgba(255,255,255,.05)',
      opacity: r.done ? 0.5 : 1,
    }}>
      <button onClick={() => onToggle(r.id, r.done)} style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${r.done ? '#34d399' : '#475569'}`,
        background: r.done ? '#34d399' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {r.done && <i className="fas fa-check" style={{ color: '#fff', fontSize: '.6rem' }} />}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '.88rem', color: '#e2e8f0', textDecoration: r.done ? 'line-through' : 'none' }}>{r.title}</div>
        <div style={{ fontSize: '.7rem', color: '#64748b', marginTop: 2 }}>
          {r.date ?? '—'} {r.note ? `· ${r.note}` : ''}
        </div>
      </div>
    </div>
  )
}
