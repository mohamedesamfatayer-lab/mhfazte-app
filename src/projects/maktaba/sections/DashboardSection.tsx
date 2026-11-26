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

  const fmt = (n: number) => Number(n).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const statCards = [
    { label: 'مبيعات الشهر',   val: `${fmt(stats.sales)} ر.س`,  icon: 'fa-chart-line',       color: '#22c55e', bg: 'rgba(34,197,94,.15)' },
    { label: 'الربح التقديري', val: `${fmt(stats.profit)} ر.س`, icon: 'fa-sack-dollar',      color: '#34d399', bg: 'rgba(52,211,153,.15)' },
    { label: 'مبيعات اليوم',   val: stats.today.toString(),     icon: 'fa-receipt',          color: '#60a5fa', bg: 'rgba(96,165,250,.15)' },
    { label: 'مصروفات الشهر',  val: `${fmt(stats.expenses)} ر.س`, icon: 'fa-money-bill-wave', color: '#f87171', bg: 'rgba(248,113,113,.15)' },
    { label: 'منتجات نفدت',    val: stats.lowStock.toString(),  icon: 'fa-triangle-exclamation', color: '#fbbf24', bg: 'rgba(251,191,36,.15)' },
  ]

  return (
    <div style={{ padding: '.9rem', direction: 'rtl' }}>
      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            flex: '1 1 160px', background: '#1e2d42', borderRadius: 12,
            border: '1px solid rgba(255,255,255,.07)', padding: '.9rem 1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.5rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: '.8rem' }} />
              </div>
              <span style={{ fontSize: '.7rem', color: '#6b7280' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
              {loading ? '...' : s.val}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '.9rem', flexWrap: 'wrap' }}>
        {/* Recent sales */}
        <div style={{ flex: '2 1 320px', background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
          <div style={{ padding: '.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => onNav('sale-log')} style={{ fontSize: '.65rem', color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
              عرض الكل
            </button>
            <span style={{ fontWeight: 700, fontSize: '.82rem', color: '#e2e8f0' }}>
              <i className="fas fa-clock-rotate-left" style={{ color: '#22c55e', marginLeft: '.4rem', fontSize: '.75rem' }} />
              آخر المبيعات
            </span>
          </div>
          {recentSales.length === 0 && !loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#374151', fontSize: '.8rem' }}>لا توجد مبيعات بعد</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,.03)' }}>
                  {['رقم الفاتورة','العميل','المبلغ','التاريخ'].map(h => (
                    <th key={h} style={{ padding: '.5rem .8rem', color: '#475569', fontWeight: 600, textAlign: 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s: any, i: number) => (
                  <tr key={s.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                    <td style={{ padding: '.5rem .8rem', color: '#22c55e', fontWeight: 700 }}>{s.num}</td>
                    <td style={{ padding: '.5rem .8rem', color: '#e2e8f0' }}>{s.party_name ?? '—'}</td>
                    <td style={{ padding: '.5rem .8rem', color: '#bbf7d0' }}>{fmt(s.net_total)} ر.س</td>
                    <td style={{ padding: '.5rem .8rem', color: '#475569' }}>{s.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Low stock */}
        <div style={{ flex: '1 1 220px', background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(251,191,36,.2)', overflow: 'hidden' }}>
          <div style={{ padding: '.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => onNav('products')} style={{ fontSize: '.65rem', color: '#fbbf24', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
              عرض الكل
            </button>
            <span style={{ fontWeight: 700, fontSize: '.82rem', color: '#fbbf24' }}>
              <i className="fas fa-triangle-exclamation" style={{ marginLeft: '.4rem', fontSize: '.75rem' }} />
              تنبيهات المخزون
            </span>
          </div>
          {lowItems.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#374151', fontSize: '.8rem' }}>المخزون كافٍ ✓</div>
          ) : lowItems.map((p: any) => (
            <div key={p.id} style={{ padding: '.6rem 1rem', borderTop: '1px solid rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ background: 'rgba(248,113,113,.15)', color: '#f87171', borderRadius: 5, padding: '.1rem .4rem', fontSize: '.68rem', fontWeight: 700 }}>
                {p.qty}
              </span>
              <span style={{ fontSize: '.75rem', color: '#e2e8f0' }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

