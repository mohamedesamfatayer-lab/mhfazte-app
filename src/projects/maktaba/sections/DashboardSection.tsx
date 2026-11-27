'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Section = 'sale' | 'purchase' | 'sale-log' | 'purchase-log' | 'products' | 'categories' | 'customers' | 'suppliers' | 'expenses' | 'settings' | 'dashboard'

export default function DashboardSection({ onNav }: { onNav: (s: Section) => void }) {
  const [stats, setStats]       = useState({ sales: 0, profit: 0, today: 0, lowStock: 0, expenses: 0 })
  const [recentSales, setRecent] = useState<any[]>([])
  const [lowItems, setLowItems]  = useState<any[]>([])
  const [loading, setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const monthStart = new Date().toISOString().slice(0, 7) + '-01'
      const today = new Date().toISOString().slice(0, 10)

      const [salesRes, todayRes, lowRes, expRes, recentRes] = await Promise.all([
        sb.from('maktaba_invoices').select('net_total,cost_total').eq('type', 'sale').gte('date', monthStart),
        sb.from('maktaba_invoices').select('id', { count: 'exact', head: true }).eq('type', 'sale').eq('date', today),
        sb.from('maktaba_products').select('id,name,qty,min_stock').filter('qty', 'lte', 'min_stock'),
        sb.from('maktaba_expenses').select('amount').gte('date', monthStart),
        sb.from('maktaba_invoices').select('id,num,party_name,net_total,date').eq('type', 'sale').order('created_at', { ascending: false }).limit(5),
      ])

      const sales   = (salesRes.data ?? []).reduce((a: number, r: any) => a + Number(r.net_total), 0)
      const profit  = (salesRes.data ?? []).reduce((a: number, r: any) => a + (Number(r.net_total) - Number(r.cost_total)), 0)
      const exps    = (expRes.data ?? []).reduce((a: number, r: any) => a + Number(r.amount), 0)

      // filter low stock properly
      const low = (lowRes.data ?? []).filter((r: any) => Number(r.qty) <= Number(r.min_stock))

      setStats({ sales, profit, today: todayRes.count ?? 0, lowStock: low.length, expenses: exps })
      setRecent(recentRes.data ?? [])
      setLowItems(low.slice(0, 5))
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (n: number) => String(Math.round(Number(n) || 0))

  const CARD_BG = '#131f30'
  const BORDER  = '1px solid rgba(255,255,255,.06)'
  const DIM_TXT = '#4b5563'
  const SEC_TXT = '#8899aa'

  const statCards = [
    { label: 'مبيعات الشهر',   amt: fmt(stats.sales),    cur: 'ر.س', icon: 'fa-chart-line',           color: '#22c55e', bg: 'rgba(34,197,94,.15)' },
    { label: 'الربح التقديري', amt: fmt(stats.profit),   cur: 'ر.س', icon: 'fa-sack-dollar',          color: '#34d399', bg: 'rgba(52,211,153,.15)' },
    { label: 'مبيعات اليوم',   amt: stats.today.toString(), cur: '',  icon: 'fa-receipt',              color: '#60a5fa', bg: 'rgba(96,165,250,.15)' },
    { label: 'مصروفات الشهر',  amt: fmt(stats.expenses), cur: 'ر.س', icon: 'fa-money-bill-wave',      color: '#f87171', bg: 'rgba(248,113,113,.15)' },
    { label: 'منتجات نفدت',    amt: stats.lowStock.toString(), cur: '', icon: 'fa-triangle-exclamation', color: '#fbbf24', bg: 'rgba(251,191,36,.15)' },
  ]

  return (
    <div style={{ padding: '.9rem', direction: 'rtl', background: '#0f1a2e', minHeight: '100%' }}>

      {/* Stat cards — horizontal layout, amount+currency inline */}
      <div style={{ display: 'flex', gap: '.55rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '.1rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            flex: '0 0 auto', minWidth: 155,
            background: CARD_BG, borderRadius: 10,
            border: BORDER, padding: '.65rem .8rem',
            display: 'flex', alignItems: 'center', gap: '.6rem',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: '.78rem' }} />
            </div>
            <div style={{ textAlign: 'right', minWidth: 0 }}>
              <div style={{ fontSize: '.63rem', color: DIM_TXT, marginBottom: '.15rem', whiteSpace: 'nowrap' }}>{s.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '.25rem', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '.95rem', fontWeight: 800, color: '#fff' }}>{loading ? '...' : s.amt}</span>
                {s.cur && <span style={{ fontSize: '.68rem', color: SEC_TXT, fontWeight: 600 }}>{s.cur}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '.9rem', flexWrap: 'wrap' }}>
        {/* Recent sales */}
        <div style={{ flex: '2 1 320px', background: CARD_BG, borderRadius: 12, border: BORDER, overflow: 'hidden' }}>
          <div style={{ padding: '.65rem 1rem', borderBottom: BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => onNav('sale-log')} style={{ fontSize: '.65rem', color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
              عرض الكل
            </button>
            <span style={{ fontWeight: 700, fontSize: '.83rem', color: '#e2e8f0' }}>
              <i className="fas fa-clock-rotate-left" style={{ color: '#22c55e', marginLeft: '.4rem', fontSize: '.75rem' }} />
              آخر المبيعات
            </span>
          </div>
          {recentSales.length === 0 && !loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: DIM_TXT, fontSize: '.83rem' }}>لا توجد مبيعات بعد</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,.03)' }}>
                  {['رقم الفاتورة','العميل','المبلغ','التاريخ'].map(h => (
                    <th key={h} style={{ padding: '.5rem .8rem', color: SEC_TXT, fontWeight: 600, textAlign: 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s: any, i: number) => (
                  <tr key={s.id} style={{ borderTop: BORDER, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                    <td style={{ padding: '.5rem .8rem', color: '#22c55e', fontWeight: 700 }}>{s.num}</td>
                    <td style={{ padding: '.5rem .8rem', color: '#e2e8f0' }}>{s.party_name ?? '—'}</td>
                    <td style={{ padding: '.5rem .8rem', color: '#bbf7d0' }}>
                      <span style={{ fontWeight: 700 }}>{fmt(s.net_total)}</span>
                      <span style={{ fontSize: '.68rem', color: SEC_TXT, marginRight: '.25rem' }}>ر.س</span>
                    </td>
                    <td style={{ padding: '.5rem .8rem', color: DIM_TXT }}>{s.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Low stock */}
        <div style={{ flex: '1 1 200px', background: CARD_BG, borderRadius: 12, border: '1px solid rgba(251,191,36,.2)', overflow: 'hidden' }}>
          <div style={{ padding: '.65rem 1rem', borderBottom: BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => onNav('products')} style={{ fontSize: '.65rem', color: '#fbbf24', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
              عرض الكل
            </button>
            <span style={{ fontWeight: 700, fontSize: '.83rem', color: '#fbbf24' }}>
              <i className="fas fa-triangle-exclamation" style={{ marginLeft: '.4rem', fontSize: '.75rem' }} />
              تنبيهات المخزون
            </span>
          </div>
          {lowItems.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: DIM_TXT, fontSize: '.83rem' }}>المخزون كافٍ ✓</div>
          ) : lowItems.map((p: any) => (
            <div key={p.id} style={{ padding: '.6rem 1rem', borderTop: BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ background: 'rgba(248,113,113,.15)', color: '#f87171', borderRadius: 6, padding: '.15rem .5rem', fontSize: '.72rem', fontWeight: 700 }}>
                {p.qty}
              </span>
              <span style={{ fontSize: '.78rem', color: '#e2e8f0' }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

