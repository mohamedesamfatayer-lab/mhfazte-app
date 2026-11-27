'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Section = any

export default function SaleLogSection({ onNav }: { onNav: (s: Section) => void }) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [search, setSearch]     = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [items, setItems]       = useState<Record<string, any[]>>({})

  async function load() {
    setLoading(true)
    let q = createClient().from('maktaba_invoices').select('*').eq('type', 'sale').order('created_at', { ascending: false })
    if (dateFrom) q = q.gte('date', dateFrom)
    if (dateTo)   q = q.lte('date', dateTo)
    const { data } = await q
    setInvoices(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [dateFrom, dateTo])

  async function loadItems(id: string) {
    if (items[id]) { setExpanded(id); return }
    const { data } = await createClient().from('maktaba_invoice_items').select('*').eq('invoice_id', id)
    setItems(p => ({ ...p, [id]: data ?? [] }))
    setExpanded(id)
  }

  async function del(id: string) {
    if (!confirm('حذف الفاتورة؟')) return
    await createClient().from('maktaba_invoices').delete().eq('id', id)
    load()
  }

  const fmt = (n: number) => String(Math.round(Number(n) || 0))
  const filtered = invoices.filter(i => !search || i.num.includes(search) || (i.party_name ?? '').includes(search))

  const inp = (style?: any) => ({ background: '#1a2535', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '.4rem .7rem', color: '#e2e8f0', fontSize: '.78rem', fontFamily: 'Cairo,sans-serif', direction: 'rtl' as const, ...style })

  return (
    <div style={{ padding: '.9rem', direction: 'rtl' }}>
      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="رقم الفاتورة أو اسم العميل..." style={{ ...inp(), flex: 1, minWidth: 160 }} />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inp()} />
        <span style={{ color: '#475569', fontSize: '.75rem' }}>إلى</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inp()} />
        <button onClick={() => { setDateFrom(''); setDateTo(''); setSearch('') }} style={{ ...inp(), cursor: 'pointer', color: '#94a3b8' }}>مسح</button>
        <button onClick={() => onNav('sale')} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '.4rem .9rem', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
          <i className="fas fa-plus" style={{ marginLeft: '.3rem' }} />فاتورة جديدة
        </button>
      </div>

      <div style={{ background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,.04)' }}>
              {['رقم الفاتورة','العميل','التاريخ','الإجمالي','طريقة الدفع','إجراءات'].map(h => (
                <th key={h} style={{ padding: '.6rem .8rem', color: '#475569', textAlign: 'right' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>جاري التحميل...</td></tr>
            ) : filtered.map((inv, i) => (
              <>
                <tr key={inv.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)', cursor: 'pointer' }}
                  onClick={() => expanded === inv.id ? setExpanded(null) : loadItems(inv.id)}>
                  <td style={{ padding: '.55rem .8rem', color: '#22c55e', fontWeight: 700 }}>{inv.num}</td>
                  <td style={{ padding: '.55rem .8rem', color: '#e2e8f0' }}>{inv.party_name ?? '—'}</td>
                  <td style={{ padding: '.55rem .8rem', color: '#475569' }}>{inv.date}</td>
                  <td style={{ padding: '.55rem .8rem', color: '#bbf7d0', fontWeight: 700 }}>{fmt(inv.net_total)} ر.س</td>
                  <td style={{ padding: '.55rem .8rem', color: '#94a3b8' }}>{{ cash: 'نقدي', card: 'بطاقة', credit: 'آجل', transfer: 'تحويل' }[inv.payment_type as string] ?? inv.payment_type}</td>
                  <td style={{ padding: '.55rem .8rem' }}>
                    <button onClick={e => { e.stopPropagation(); del(inv.id) }} style={{ background: 'rgba(248,113,113,.2)', color: '#f87171', border: 'none', borderRadius: 6, padding: '.22rem .5rem', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.7rem' }}>حذف</button>
                  </td>
                </tr>
                {expanded === inv.id && (
                  <tr key={`${inv.id}-detail`}><td colSpan={6} style={{ padding: 0 }}>
                    <div style={{ background: '#131f30', padding: '.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.72rem' }}>
                        <thead><tr>{['المنتج','الكمية','السعر','الإجمالي'].map(h => <th key={h} style={{ padding: '.35rem .6rem', color: '#475569', textAlign: 'right' }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {(items[inv.id] ?? []).map((it: any) => (
                            <tr key={it.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}>
                              <td style={{ padding: '.35rem .6rem', color: '#d1fae5' }}>{it.product_name}</td>
                              <td style={{ padding: '.35rem .6rem', color: '#94a3b8' }}>{it.qty}</td>
                              <td style={{ padding: '.35rem .6rem', color: '#94a3b8' }}>{fmt(it.price)}</td>
                              <td style={{ padding: '.35rem .6rem', color: '#bbf7d0', fontWeight: 700 }}>{fmt(it.total)} ر.س</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td></tr>
                )}
              </>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#374151' }}>لا توجد فواتير</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

