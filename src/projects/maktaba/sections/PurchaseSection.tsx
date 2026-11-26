'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Product { id: string; name: string; price: number; cost: number; qty: number }
interface Supplier { id: string; name: string }
interface LineItem { product_id: string; product_name: string; qty: number; price: number; cost: number; total: number }

const PAY_TYPES = [{ v: 'cash', l: 'نقدي' }, { v: 'credit', l: 'آجل' }, { v: 'transfer', l: 'تحويل' }]

export default function PurchaseSection({ showToast }: { showToast: (m: string) => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplier, setSupplier] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [payType, setPayType] = useState('cash')
  const [applyVat, setApplyVat] = useState(false)
  const [vatPct, setVatPct] = useState(15)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const sb = createClient()
    Promise.all([
      sb.from('maktaba_products').select('id,name,price,cost,qty').order('name'),
      sb.from('maktaba_suppliers').select('id,name').order('name'),
      sb.from('maktaba_settings').select('vat_pct').eq('id', 1).single(),
    ]).then(([p, s, st]) => {
      setProducts(p.data ?? [])
      setSuppliers(s.data ?? [])
      setVatPct(Number((st.data as any)?.vat_pct ?? 15))
    })
  }, [])

  function addProduct(p: Product) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.product_id === p.id)
      if (idx >= 0) {
        const u = [...prev]; u[idx] = { ...u[idx], qty: u[idx].qty + 1, total: (u[idx].qty + 1) * u[idx].price }; return u
      }
      return [...prev, { product_id: p.id, product_name: p.name, qty: 1, price: p.cost, cost: p.cost, total: p.cost }]
    })
    setProductSearch('')
  }

  function updateItem(idx: number, key: 'qty' | 'price', val: number) {
    setItems(prev => { const u = [...prev]; u[idx] = { ...u[idx], [key]: val, total: (key === 'qty' ? val : u[idx].qty) * (key === 'price' ? val : u[idx].price) }; return u })
  }

  const subtotal = items.reduce((a, i) => a + i.total, 0)
  const vatAmt = applyVat ? subtotal * (vatPct / 100) : 0
  const netTotal = subtotal + vatAmt
  const fmt = (n: number) => Number(n).toFixed(2)

  async function save() {
    if (items.length === 0) return showToast('أضف منتجاً واحداً على الأقل')
    setSaving(true)
    const sb = createClient()
    const { count } = await sb.from('maktaba_invoices').select('id', { count: 'exact', head: true }).eq('type', 'purchase')
    const num = `P${String((count ?? 0) + 1).padStart(5, '0')}`
    const sup = suppliers.find(s => s.id === supplier)

    const { data: inv, error } = await sb.from('maktaba_invoices').insert({
      num, type: 'purchase', party_id: supplier || null, party_name: sup?.name ?? '—',
      date, payment_type: payType, subtotal, disc_pct: 0, disc_amt: 0,
      vat_pct: applyVat ? vatPct : 0, vat_amt: vatAmt, net_total: netTotal, cost_total: netTotal, notes,
    }).select('id').single()

    if (!error && inv) {
      await sb.from('maktaba_invoice_items').insert(items.map(i => ({ invoice_id: inv.id, product_id: i.product_id, product_name: i.product_name, qty: i.qty, price: i.price, cost: i.price, total: i.total })))
      for (const i of items) {
        const prod = products.find(p => p.id === i.product_id)
        await sb.from('maktaba_products').update({ qty: (prod?.qty ?? 0) + i.qty, cost: i.price }).eq('id', i.product_id)
      }
      showToast(`✅ تم حفظ فاتورة المشتريات ${num}`)
      setItems([]); setSupplier(''); setNotes(''); setApplyVat(false)
      setDate(new Date().toISOString().slice(0, 10)); setPayType('cash')
      const { data: np } = await sb.from('maktaba_products').select('id,name,price,cost,qty').order('name')
      if (np) setProducts(np)
    } else { showToast('❌ خطأ في الحفظ') }
    setSaving(false)
  }

  const inp = (style?: any) => ({ background: '#1a2535', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '.45rem .7rem', color: '#e2e8f0', fontSize: '.8rem', fontFamily: 'Cairo,sans-serif', direction: 'rtl' as const, ...style })
  const filteredProducts = products.filter(p => !productSearch || p.name.includes(productSearch))

  return (
    <div style={{ padding: '.9rem', direction: 'rtl' }}>
      <div style={{ display: 'flex', gap: '.9rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '2 1 420px', background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
          <div style={{ padding: '.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,.07)', background: 'rgba(96,165,250,.08)' }}>
            <div style={{ fontWeight: 800, color: '#60a5fa', fontSize: '.9rem' }}>
              <i className="fas fa-truck" style={{ marginLeft: '.5rem' }} />فاتورة مشتريات جديدة
            </div>
          </div>
          <div style={{ padding: '.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.6rem', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            <div>
              <div style={{ fontSize: '.68rem', color: '#6b7280', marginBottom: '.25rem' }}>المورد</div>
              <select value={supplier} onChange={e => setSupplier(e.target.value)} style={{ ...inp(), width: '100%' }}>
                <option value="">— اختر موردًا —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '.68rem', color: '#6b7280', marginBottom: '.25rem' }}>التاريخ</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <div style={{ fontSize: '.68rem', color: '#6b7280', marginBottom: '.25rem' }}>طريقة الدفع</div>
              <select value={payType} onChange={e => setPayType(e.target.value)} style={{ ...inp(), width: '100%' }}>
                {PAY_TYPES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ padding: '.6rem .8rem', borderBottom: '1px solid rgba(255,255,255,.07)', position: 'relative' }}>
            <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="ابحث عن منتج لإضافته..." style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
            {productSearch && (
              <div style={{ position: 'absolute', top: '100%', right: '.8rem', left: '.8rem', background: '#1a2535', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, zIndex: 50, maxHeight: 200, overflowY: 'auto' }}>
                {filteredProducts.slice(0, 10).map(p => (
                  <div key={p.id} onMouseDown={() => addProduct(p)} style={{ padding: '.5rem .8rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,.05)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(96,165,250,.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <span style={{ color: '#60a5fa' }}>{Number(p.cost).toFixed(2)} ر.س</span>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ minHeight: 180 }}>
            {items.length === 0 ? <div style={{ padding: '2.5rem', textAlign: 'center', color: '#374151', fontSize: '.8rem' }}>ابحث عن منتج لإضافته</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
                <thead><tr style={{ background: 'rgba(255,255,255,.04)' }}>{['المنتج','الكمية','سعر الشراء','الإجمالي',''].map(h => <th key={h} style={{ padding: '.5rem .7rem', color: '#475569', textAlign: 'right' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}>
                      <td style={{ padding: '.45rem .7rem', color: '#e2e8f0' }}>{item.product_name}</td>
                      <td style={{ padding: '.45rem .7rem' }}><input type="number" min={1} value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} style={{ ...inp(), width: 60, padding: '.25rem .4rem', textAlign: 'center' }} /></td>
                      <td style={{ padding: '.45rem .7rem' }}><input type="number" min={0} value={item.price} onChange={e => updateItem(idx, 'price', Number(e.target.value))} style={{ ...inp(), width: 80, padding: '.25rem .4rem' }} /></td>
                      <td style={{ padding: '.45rem .7rem', color: '#93c5fd', fontWeight: 700 }}>{fmt(item.total)}</td>
                      <td style={{ padding: '.45rem .7rem' }}><button onClick={() => setItems(p => p.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><i className="fas fa-trash-can" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ padding: '.7rem .8rem', borderTop: '1px solid rgba(255,255,255,.07)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', fontSize: '.78rem', color: '#94a3b8' }}>
              <input type="checkbox" checked={applyVat} onChange={e => setApplyVat(e.target.checked)} />
              تطبيق ضريبة القيمة المضافة ({vatPct}%)
            </label>
          </div>
        </div>

        <div style={{ flex: '1 1 220px', background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(96,165,250,.2)', padding: '1rem' }}>
          <div style={{ fontWeight: 800, color: '#60a5fa', fontSize: '.85rem', marginBottom: '.9rem' }}>ملخص الفاتورة</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem', fontSize: '.78rem' }}>
            <span style={{ color: '#94a3b8' }}>{fmt(subtotal)} ر.س</span>
            <span style={{ color: '#6b7280' }}>المجموع الفرعي</span>
          </div>
          {applyVat && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem', fontSize: '.78rem' }}>
            <span style={{ color: '#fbbf24' }}>{fmt(vatAmt)} ر.س</span>
            <span style={{ color: '#6b7280' }}>ضريبة ({vatPct}%)</span>
          </div>}
          <div style={{ borderTop: '1px solid rgba(96,165,250,.2)', paddingTop: '.7rem', marginTop: '.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: '1rem' }}>{fmt(netTotal)} ر.س</span>
            <span style={{ color: '#94a3b8', fontSize: '.8rem' }}>الإجمالي</span>
          </div>
          <button onClick={save} disabled={saving || items.length === 0} style={{ width: '100%', marginTop: '1rem', background: items.length === 0 ? '#1a2e1a' : '#1d4ed8', color: items.length === 0 ? '#374151' : '#fff', border: 'none', borderRadius: 10, padding: '.7rem', fontSize: '.85rem', fontWeight: 800, cursor: items.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'Cairo,sans-serif' }}>
            <i className="fas fa-floppy-disk" style={{ marginLeft: '.4rem' }} />{saving ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
          </button>
        </div>
      </div>
    </div>
  )
}

