'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function CustomersSection({ showToast }: { showToast: (m: string) => void }) {
  const [list, setList]     = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<any>(null)
  const [form, setForm]         = useState({ name: '', phone: '', address: '' })
  const [saving, setSaving]     = useState(false)

  async function load() { const { data } = await createClient().from('maktaba_customers').select('*').order('name'); setList(data ?? []) }
  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm({ name: '', phone: '', address: '' }); setShowForm(true) }
  function openEdit(r: any) { setEditing(r); setForm({ name: r.name, phone: r.phone ?? '', address: r.address ?? '' }); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return showToast('الاسم مطلوب')
    setSaving(true)
    const sb = createClient()
    if (editing) { await sb.from('maktaba_customers').update(form).eq('id', editing.id) }
    else { await sb.from('maktaba_customers').insert(form) }
    setSaving(false); setShowForm(false); showToast(editing ? '✅ تم التحديث' : '✅ تمت الإضافة'); load()
  }

  async function del(id: string) { if (!confirm('حذف العميل؟')) return; await createClient().from('maktaba_customers').delete().eq('id', id); showToast('🗑 تم الحذف'); load() }

  const inp = (style?: any) => ({ background: '#1a2535', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '.45rem .7rem', color: '#e2e8f0', fontSize: '.8rem', fontFamily: 'Cairo,sans-serif', direction: 'rtl' as const, ...style })
  const filtered = list.filter(r => !search || r.name.includes(search) || (r.phone ?? '').includes(search))

  return (
    <div style={{ padding: '.9rem', direction: 'rtl' }}>
      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '.9rem', alignItems: 'center' }}>
        <button onClick={openNew} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '.45rem 1rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
          <i className="fas fa-plus" style={{ marginLeft: '.35rem' }} />إضافة عميل
        </button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." style={{ ...inp(), flex: 1 }} />
      </div>

      <div style={{ background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
          <thead><tr style={{ background: 'rgba(255,255,255,.04)' }}>{['الاسم','الهاتف','العنوان','إجراءات'].map(h => <th key={h} style={{ padding: '.6rem .8rem', color: '#475569', textAlign: 'right' }}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                <td style={{ padding: '.55rem .8rem', color: '#e2e8f0', fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: '.55rem .8rem', color: '#94a3b8' }}>{r.phone || '—'}</td>
                <td style={{ padding: '.55rem .8rem', color: '#94a3b8' }}>{r.address || '—'}</td>
                <td style={{ padding: '.55rem .8rem' }}>
                  <div style={{ display: 'flex', gap: '.4rem' }}>
                    <button onClick={() => openEdit(r)} style={{ background: 'rgba(96,165,250,.2)', color: '#60a5fa', border: 'none', borderRadius: 6, padding: '.22rem .5rem', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.7rem' }}>تعديل</button>
                    <button onClick={() => del(r.id)} style={{ background: 'rgba(248,113,113,.2)', color: '#f87171', border: 'none', borderRadius: 6, padding: '.22rem .5rem', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.7rem' }}>حذف</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} style={{ padding: '2.5rem', textAlign: 'center', color: '#374151' }}>لا يوجد عملاء</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{ background: '#1e2d42', borderRadius: 14, padding: '1.4rem', width: '100%', maxWidth: 400, border: '1px solid rgba(255,255,255,.1)', direction: 'rtl' }}>
            <div style={{ fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>{editing ? 'تعديل عميل' : 'إضافة عميل جديد'}</div>
            {[{ label: 'الاسم *', key: 'name' }, { label: 'الهاتف', key: 'phone' }, { label: 'العنوان', key: 'address' }].map(f => (
              <div key={f.key} style={{ marginBottom: '.6rem' }}>
                <div style={{ fontSize: '.7rem', color: '#6b7280', marginBottom: '.25rem' }}>{f.label}</div>
                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem' }}>
              <button onClick={() => setShowForm(false)} style={{ ...inp(), cursor: 'pointer', padding: '.45rem 1rem' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '.45rem 1.2rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>{saving ? '...' : (editing ? 'تحديث' : 'حفظ')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

