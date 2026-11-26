'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Product { id: string; sku: string; name: string; author: string; qty: number; min_stock: number; cost: number; price: number; category_id: string; category_name?: string }
interface Category { id: string; name: string }

export default function ProductsSection({ showToast }: { showToast: (m: string) => void }) {
  const [products, setProducts]   = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Product | null>(null)
  const [form, setForm]           = useState({ sku: '', name: '', author: '', category_id: '', qty: '0', min_stock: '5', cost: '0', price: '0', description: '' })
  const [saving, setSaving]       = useState(false)

  async function load() {
    const sb = createClient()
    const [pRes, cRes] = await Promise.all([
      sb.from('maktaba_products').select('*').order('name'),
      sb.from('maktaba_categories').select('*').order('name'),
    ])
    const cats: Category[] = cRes.data ?? []
    setCategories(cats)
    const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]))
    setProducts((pRes.data ?? []).map((p: any) => ({ ...p, category_name: catMap[p.category_id] ?? '' })))
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm({ sku: '', name: '', author: '', category_id: '', qty: '0', min_stock: '5', cost: '0', price: '0', description: '' }); setShowForm(true) }
  function openEdit(p: Product) { setEditing(p); setForm({ sku: p.sku ?? '', name: p.name, author: p.author ?? '', category_id: p.category_id ?? '', qty: String(p.qty), min_stock: String(p.min_stock), cost: String(p.cost), price: String(p.price), description: '' }); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return showToast('اسم المنتج مطلوب')
    setSaving(true)
    const sb = createClient()
    const payload = { ...form, qty: Number(form.qty), min_stock: Number(form.min_stock), cost: Number(form.cost), price: Number(form.price) }
    if (editing) {
      await sb.from('maktaba_products').update(payload).eq('id', editing.id)
    } else {
      await sb.from('maktaba_products').insert(payload)
    }
    setSaving(false); setShowForm(false); showToast(editing ? '✅ تم التحديث' : '✅ تمت الإضافة'); load()
  }

  async function del(id: string) {
    if (!confirm('حذف المنتج؟')) return
    await createClient().from('maktaba_products').delete().eq('id', id)
    showToast('🗑 تم الحذف'); load()
  }

  const filtered = products.filter(p =>
    (!search || p.name.includes(search) || (p.sku ?? '').includes(search)) &&
    (!catFilter || p.category_id === catFilter)
  )

  const inp = (style?: any) => ({
    background: '#1a2535', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8,
    padding: '.45rem .7rem', color: '#e2e8f0', fontSize: '.8rem',
    fontFamily: 'Cairo,sans-serif', direction: 'rtl' as const, ...style,
  })

  return (
    <div style={{ padding: '.9rem', direction: 'rtl' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={openNew} style={{
          background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8,
          padding: '.45rem 1rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo,sans-serif',
          display: 'flex', alignItems: 'center', gap: '.4rem',
        }}>
          <i className="fas fa-plus" /> إضافة منتج
        </button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." style={{ ...inp(), flex: 1, minWidth: 160 }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={inp()}>
          <option value="">كل الأصناف</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,.04)' }}>
              {['الكود','الاسم','المؤلف','الصنف','المخزون','سعر التكلفة','سعر البيع','إجراءات'].map(h => (
                <th key={h} style={{ padding: '.6rem .8rem', color: '#475569', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                <td style={{ padding: '.55rem .8rem', color: '#475569' }}>{p.sku || '—'}</td>
                <td style={{ padding: '.55rem .8rem', color: '#e2e8f0', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '.55rem .8rem', color: '#94a3b8' }}>{p.author || '—'}</td>
                <td style={{ padding: '.55rem .8rem', color: '#a3e635' }}>{p.category_name || '—'}</td>
                <td style={{ padding: '.55rem .8rem' }}>
                  <span style={{ color: Number(p.qty) <= Number(p.min_stock) ? '#f87171' : '#22c55e', fontWeight: 700 }}>{p.qty}</span>
                </td>
                <td style={{ padding: '.55rem .8rem', color: '#94a3b8' }}>{Number(p.cost).toFixed(2)}</td>
                <td style={{ padding: '.55rem .8rem', color: '#bbf7d0', fontWeight: 700 }}>{Number(p.price).toFixed(2)}</td>
                <td style={{ padding: '.55rem .8rem' }}>
                  <div style={{ display: 'flex', gap: '.4rem' }}>
                    <button onClick={() => openEdit(p)} style={{ background: 'rgba(96,165,250,.2)', color: '#60a5fa', border: 'none', borderRadius: 6, padding: '.25rem .5rem', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.7rem' }}>تعديل</button>
                    <button onClick={() => del(p.id)} style={{ background: 'rgba(248,113,113,.2)', color: '#f87171', border: 'none', borderRadius: 6, padding: '.25rem .5rem', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.7rem' }}>حذف</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#374151' }}>لا توجد منتجات</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{ background: '#1e2d42', borderRadius: 14, padding: '1.4rem', width: '100%', maxWidth: 520, border: '1px solid rgba(255,255,255,.1)', direction: 'rtl' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', marginBottom: '1rem' }}>{editing ? 'تعديل منتج' : 'إضافة منتج جديد'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '.6rem' }}>
              {[
                { label: 'الاسم *', key: 'name' }, { label: 'المؤلف', key: 'author' },
                { label: 'الكود SKU', key: 'sku' }, { label: 'الباركود', key: 'barcode' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: '.7rem', color: '#6b7280', marginBottom: '.3rem' }}>{f.label}</div>
                  <input value={(form as any)[f.key] ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '.6rem' }}>
              <div style={{ fontSize: '.7rem', color: '#6b7280', marginBottom: '.3rem' }}>الصنف</div>
              <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} style={{ ...inp(), width: '100%' }}>
                <option value="">— بدون صنف —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '.6rem', marginBottom: '1rem' }}>
              {[
                { label: 'الكمية', key: 'qty' }, { label: 'الحد الأدنى', key: 'min_stock' },
                { label: 'سعر التكلفة', key: 'cost' }, { label: 'سعر البيع', key: 'price' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: '.7rem', color: '#6b7280', marginBottom: '.3rem' }}>{f.label}</div>
                  <input type="number" value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-start' }}>
              <button onClick={() => setShowForm(false)} style={{ ...inp(), cursor: 'pointer', padding: '.45rem 1rem' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '.45rem 1.2rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
                {saving ? '...' : (editing ? 'تحديث' : 'حفظ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

