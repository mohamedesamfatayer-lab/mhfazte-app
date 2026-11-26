'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

interface Product { id: string; name: string; price: number; cost: number; qty: number }
interface Customer { id: string; name: string }
interface LineItem { product_id: string; product_name: string; qty: number; price: number; cost: number; total: number }

const PAY_TYPES = [
  { v: 'cash', l: 'نقدي' }, { v: 'card', l: 'بطاقة' },
  { v: 'credit', l: 'آجل' }, { v: 'transfer', l: 'تحويل' },
]

export default function SaleSection({ showToast }: { showToast: (m: string) => void }) {
  const [products, setProducts]   = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vatPct, setVatPct]       = useState(0)
  const [customer, setCustomer]   = useState('')
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10))
  const [payType, setPayType]     = useState('cash')
  const [discPct, setDiscPct]     = useState(0)
  const [applyVat, setApplyVat]   = useState(false)
  const [notes, setNotes]         = useState('')
  const [items, setItems]         = useState<LineItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    const sb = createClient()
    Promise.all([
      sb.from('maktaba_products').select('id,name,price,cost,qty').order('name'),
      sb.from('maktaba_customers').select('id,name').order('name'),
      sb.from('maktaba_settings').select('vat_pct').eq('id', 1).single(),
    ]).then(([p, c, s]) => {
      setProducts(p.data ?? [])
      setCustomers(c.data ?? [])
      setVatPct(Number((s.data as any)?.vat_pct ?? 15))
    })
  }, [])

  function addProduct(p: Product) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.product_id === p.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1, total: (updated[idx].qty + 1) * updated[idx].price }
        return updated
      }
      return [...prev, { product_id: p.id, product_name: p.name, qty: 1, price: p.price, cost: p.cost, total: p.price }]
    })
    setProductSearch('')
  }

  function updateItem(idx: number, key: 'qty' | 'price', val: number) {
    setItems(prev => {
      const u = [...prev]
      u[idx] = { ...u[idx], [key]: val, total: (key === 'qty' ? val : u[idx].qty) * (key === 'price' ? val : u[idx].price) }
      return u
    })
  }

  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  const subtotal = items.reduce((a, i) => a + i.total, 0)
  const discAmt  = subtotal * (discPct / 100)
  const afterDisc = subtotal - discAmt
  const vatAmt   = applyVat ? afterDisc * (vatPct / 100) : 0
  const netTotal = afterDisc + vatAmt
  const costTotal = items.reduce((a, i) => a + i.cost * i.qty, 0)

  const fmt = (n: number) => Number(n).toFixed(2)

  async function save() {
    if (items.length === 0) return showToast('أضف منتجاً واحداً على الأقل')
    setSaving(true)
    const sb = createClient()
    // Generate invoice number
    const { count } = await sb.from('maktaba_invoices').select('id', { count: 'exact', head: true }).eq('type', 'sale')
    const num = `S${String((count ?? 0) + 1).padStart(5, '0')}`
    const cust = customers.find(c => c.id === customer)

    const { data: inv, error } = await sb.from('maktaba_invoices').insert({
      num, type: 'sale', party_id: customer || null, party_name: cust?.name ?? 'عميل نقدي عام',
      date, payment_type: payType, subtotal, disc_pct: discPct, disc_amt: discAmt,
      vat_pct: applyVat ? vatPct : 0, vat_amt: vatAmt, net_total: netTotal, cost_total: costTotal, notes,
    }).select('id').single()

    if (!error && inv) {
      await sb.from('maktaba_invoice_items').insert(items.map(i => ({ invoice_id: inv.id, product_id: i.product_id, product_name: i.product_name, qty: i.qty, price: i.price, cost: i.cost, total: i.total })))
      // Update stock
      for (const i of items) {
        await sb.from('maktaba_products').update({ qty: Math.max(0, (products.find(p => p.id === i.product_id)?.qty ?? 0) - i.qty) }).eq('id', i.product_id)
      }
      showToast(`✅ تم حفظ الفاتورة ${num}`)
      // Reset form
      setItems([]); setCustomer(''); setDiscPct(0); setApplyVat(false); setNotes('')
      setDate(new Date().toISOString().slice(0, 10)); setPayType('cash')
      // Refresh products
      const { data: np } = await sb.from('maktaba_products').select('id,name,price,cost,qty').order('name')
      if (np) setProducts(np)
    } else {
      showToast('❌ خطأ في الحفظ')
    }
    setSaving(false)
  }

  const inp = (style?: any) => ({
    background: '#1a2535', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8,
    padding: '.45rem .7rem', color: '#e2e8f0', fontSize: '.8rem',
    fontFamily: 'Cairo,sans-serif', direction: 'rtl' as const, ...style,
  })

  const filteredProducts = products.filter(p => !productSearch || p.name.includes(productSearch) || String(p.id).includes(productSearch))

  return (
    <div style={{ padding: '.9rem', direction: 'rtl' }}>
      <div style={{ display: 'flex', gap: '.9rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Left: invoice form */}
        <div style={{ flex: '2 1 420px', background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,.07)', background: 'rgba(34,197,94,.08)' }}>
            <div style={{ fontWeight: 800, color: '#22c55e', fontSize: '.9rem' }}>
              <i className="fas fa-file-invoice-dollar" style={{ marginLeft: '.5rem' }} />
              فاتورة مبيعات جديدة
            </div>
          </div>

          {/* Fields row */}
          <div style={{ padding: '.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.6rem', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            <div>
              <div style={{ fontSize: '.68rem', color: '#6b7280', marginBottom: '.25rem' }}>العميل</div>
              <select value={customer} onChange={e => setCustomer(e.target.value)} style={{ ...inp(), width: '100%' }}>
                <option value="">عميل نقدي عام</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

          {/* Product search */}
          <div style={{ padding: '.6rem .8rem', borderBottom: '1px solid rgba(255,255,255,.07)', position: 'relative' }}>
            <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
              placeholder="ابحث عن منتج لإضافته..." style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
            {productSearch && (
              <div style={{ position: 'absolute', top: '100%', right: '.8rem', left: '.8rem', background: '#1a2535', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, zIndex: 50, maxHeight: 200, overflowY: 'auto' }}>
                {filteredProducts.slice(0, 10).map(p => (
                  <div key={p.id} onMouseDown={() => addProduct(p)} style={{ padding: '.5rem .8rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,.05)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <span style={{ color: '#22c55e' }}>{Number(p.price).toFixed(2)} ر.س</span>
                    <span>{p.name}</span>
                  </div>
                ))}
                {filteredProducts.length === 0 && <div style={{ padding: '.6rem', color: '#475569', fontSize: '.75rem', textAlign: 'center' }}>لا توجد نتائج</div>}
              </div>
            )}
          </div>

          {/* Items table */}
          <div style={{ minHeight: 180 }}>
            {items.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#374151', fontSize: '.8rem' }}>ابحث عن منتج لإضافته للفاتورة</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,.04)' }}>
                    {['المنتج','الكمية','السعر','الإجمالي',''].map(h => (
                      <th key={h} style={{ padding: '.5rem .7rem', color: '#475569', textAlign: 'right' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}>
                      <td style={{ padding: '.45rem .7rem', color: '#e2e8f0' }}>{item.product_name}</td>
                      <td style={{ padding: '.45rem .7rem' }}>
                        <input type="number" min={1} value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} style={{ ...inp(), width: 60, padding: '.25rem .4rem', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '.45rem .7rem' }}>
                        <input type="number" min={0} value={item.price} onChange={e => updateItem(idx, 'price', Number(e.target.value))} style={{ ...inp(), width: 80, padding: '.25rem .4rem' }} />
                      </td>
                      <td style={{ padding: '.45rem .7rem', color: '#bbf7d0', fontWeight: 700 }}>{fmt(item.total)}</td>
                      <td style={{ padding: '.45rem .7rem' }}>
                        <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '.8rem' }}>
                          <i className="fas fa-trash-can" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer options */}
          <div style={{ padding: '.7rem .8rem', borderTop: '1px solid rgba(255,255,255,.07)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
            <div>
              <div style={{ fontSize: '.68rem', color: '#6b7280', marginBottom: '.25rem' }}>خصم %</div>
              <input type="number" min={0} max={100} value={discPct} onChange={e => setDiscPct(Number(e.target.value))} style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.5rem', paddingBottom: '.1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', fontSize: '.78rem', color: '#94a3b8' }}>
                <input type="checkbox" checked={applyVat} onChange={e => setApplyVat(e.target.checked)} />
                تطبيق ضريبة القيمة المضافة ({vatPct}%)
              </label>
            </div>
          </div>

          <div style={{ padding: '.4rem .8rem .6rem' }}>
            <div style={{ fontSize: '.68rem', color: '#6b7280', marginBottom: '.25rem' }}>ملاحظات</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inp(), width: '100%', boxSizing: 'border-box', resize: 'none' }} />
          </div>
        </div>

        {/* Right: summary */}
        <div style={{ flex: '1 1 220px', background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(34,197,94,.2)', padding: '1rem' }}>
          <div style={{ fontWeight: 800, color: '#22c55e', fontSize: '.85rem', marginBottom: '.9rem' }}>ملخص الفاتورة</div>

          {[
            { label: 'المجموع الفرعي', val: `${fmt(subtotal)} ر.س` },
            { label: `خصم (${discPct}%)`, val: `-${fmt(discAmt)} ر.س`, color: '#f87171' },
            ...(applyVat ? [{ label: `ضريبة (${vatPct}%)`, val: `${fmt(vatAmt)} ر.س`, color: '#fbbf24' }] : []),
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem', fontSize: '.78rem' }}>
              <span style={{ color: (r as any).color ?? '#94a3b8' }}>{r.val}</span>
              <span style={{ color: '#6b7280' }}>{r.label}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid rgba(34,197,94,.2)', paddingTop: '.7rem', marginTop: '.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#22c55e', fontWeight: 800, fontSize: '1rem' }}>{fmt(netTotal)} ر.س</span>
            <span style={{ color: '#94a3b8', fontSize: '.8rem' }}>الإجمالي</span>
          </div>

          <button onClick={save} disabled={saving || items.length === 0} style={{
            width: '100%', marginTop: '1rem', background: items.length === 0 ? '#1a2e1a' : '#16a34a',
            color: items.length === 0 ? '#374151' : '#fff', border: 'none', borderRadius: 10,
            padding: '.7rem', fontSize: '.85rem', fontWeight: 800, cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'Cairo,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
          }}>
            <i className="fas fa-floppy-disk" />
            {saving ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
          </button>
        </div>
      </div>
    </div>
  )
}

