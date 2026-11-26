'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function CategoriesSection({ showToast }: { showToast: (m: string) => void }) {
  const [cats, setCats]   = useState<any[]>([])
  const [name, setName]   = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving]   = useState(false)

  async function load() { const { data } = await createClient().from('maktaba_categories').select('*').order('name'); setCats(data ?? []) }
  useEffect(() => { load() }, [])

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const sb = createClient()
    if (editing) { await sb.from('maktaba_categories').update({ name }).eq('id', editing.id) }
    else { await sb.from('maktaba_categories').insert({ name }) }
    setSaving(false); setName(''); setEditing(null); showToast(editing ? '✅ تم التحديث' : '✅ تمت الإضافة'); load()
  }

  async function del(id: string) {
    if (!confirm('حذف الصنف؟')) return
    await createClient().from('maktaba_categories').delete().eq('id', id)
    showToast('🗑 تم الحذف'); load()
  }

  const inp = (style?: any) => ({ background: '#1a2535', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '.45rem .7rem', color: '#e2e8f0', fontSize: '.8rem', fontFamily: 'Cairo,sans-serif', direction: 'rtl' as const, ...style })

  return (
    <div style={{ padding: '.9rem', direction: 'rtl', maxWidth: 560 }}>
      <div style={{ background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '.85rem', marginBottom: '.7rem' }}>{editing ? 'تعديل صنف' : 'إضافة صنف جديد'}</div>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم الصنف..." style={{ ...inp(), flex: 1 }} onKeyDown={e => e.key === 'Enter' && save()} />
          {editing && <button onClick={() => { setEditing(null); setName('') }} style={{ ...inp(), cursor: 'pointer', color: '#94a3b8', padding: '.45rem .7rem' }}>إلغاء</button>}
          <button onClick={save} disabled={saving} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '.45rem 1rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
            {saving ? '...' : (editing ? 'تحديث' : 'إضافة')}
          </button>
        </div>
      </div>

      <div style={{ background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
        {cats.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.65rem 1rem', borderTop: i > 0 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button onClick={() => { setEditing(c); setName(c.name) }} style={{ background: 'rgba(96,165,250,.2)', color: '#60a5fa', border: 'none', borderRadius: 6, padding: '.22rem .5rem', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.7rem' }}>تعديل</button>
              <button onClick={() => del(c.id)} style={{ background: 'rgba(248,113,113,.2)', color: '#f87171', border: 'none', borderRadius: 6, padding: '.22rem .5rem', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.7rem' }}>حذف</button>
            </div>
            <span style={{ fontSize: '.82rem', color: '#e2e8f0' }}>{c.name}</span>
          </div>
        ))}
        {cats.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#374151', fontSize: '.8rem' }}>لا توجد أصناف بعد</div>}
      </div>
    </div>
  )
}

