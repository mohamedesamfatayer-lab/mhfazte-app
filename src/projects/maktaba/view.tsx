'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const DashboardSection  = dynamic(() => import('./sections/DashboardSection'))
const SaleSection       = dynamic(() => import('./sections/SaleSection'))
const PurchaseSection   = dynamic(() => import('./sections/PurchaseSection'))
const SaleLogSection    = dynamic(() => import('./sections/SaleLogSection'))
const PurchaseLogSection = dynamic(() => import('./sections/PurchaseLogSection'))
const ProductsSection   = dynamic(() => import('./sections/ProductsSection'))
const CategoriesSection = dynamic(() => import('./sections/CategoriesSection'))
const CustomersSection  = dynamic(() => import('./sections/CustomersSection'))
const SuppliersSection  = dynamic(() => import('./sections/SuppliersSection'))
const ExpensesSection   = dynamic(() => import('./sections/ExpensesSection'))
const SettingsSection   = dynamic(() => import('./sections/SettingsSection'))

type Section =
  | 'dashboard' | 'sale' | 'purchase'
  | 'sale-log' | 'purchase-log'
  | 'products' | 'categories' | 'customers' | 'suppliers'
  | 'expenses' | 'settings'

const NAV: { section: string; items: { id: Section; label: string; icon: string; color: string }[] }[] = [
  {
    section: '',
    items: [{ id: 'dashboard', label: 'لوحة التحكم', icon: 'fa-gauge-high', color: '#22c55e' }],
  },
  {
    section: 'العمليات',
    items: [
      { id: 'sale',     label: 'فاتورة مبيعات',    icon: 'fa-file-invoice-dollar', color: '#34d399' },
      { id: 'purchase', label: 'فاتورة مشتريات',   icon: 'fa-truck',               color: '#60a5fa' },
    ],
  },
  {
    section: 'السجلات',
    items: [
      { id: 'sale-log',     label: 'سجل المبيعات',    icon: 'fa-receipt',      color: '#a3e635' },
      { id: 'purchase-log', label: 'سجل المشتريات',   icon: 'fa-boxes-stacked', color: '#94a3b8' },
      { id: 'expenses',     label: 'المصروفات',        icon: 'fa-money-bill-wave', color: '#f87171' },
    ],
  },
  {
    section: 'الإدارة',
    items: [
      { id: 'products',   label: 'المنتجات',   icon: 'fa-book',        color: '#fbbf24' },
      { id: 'categories', label: 'الأصناف',    icon: 'fa-tags',        color: '#f59e0b' },
      { id: 'customers',  label: 'العملاء',    icon: 'fa-users',       color: '#38bdf8' },
      { id: 'suppliers',  label: 'الموردون',   icon: 'fa-handshake',   color: '#a78bfa' },
      { id: 'settings',   label: 'الإعدادات',  icon: 'fa-gear',        color: '#64748b' },
    ],
  },
]

const SECTION_LABELS: Record<Section, string> = {
  dashboard: 'لوحة التحكم', sale: 'فاتورة مبيعات', purchase: 'فاتورة مشتريات',
  'sale-log': 'سجل المبيعات', 'purchase-log': 'سجل المشتريات',
  products: 'المنتجات', categories: 'الأصناف', customers: 'العملاء',
  suppliers: 'الموردون', expenses: 'المصروفات', settings: 'الإعدادات',
}

export default function MaktabaView() {
  const [active, setActive] = useState<Section>('dashboard')
  const [toast, setToast]   = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function nav(s: Section) { setActive(s) }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', direction: 'rtl',
      background: '#1a2535', fontFamily: "'Cairo', system-ui, sans-serif",
      color: '#e2e8f0',
    }}>
      {/* ══ Sidebar ══ */}
      <aside style={{
        width: 220, minWidth: 220, height: '100dvh', position: 'sticky', top: 0,
        background: '#141c2b', display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid rgba(255,255,255,.07)', overflowY: 'auto',
      }}>
        {/* Back + Brand */}
        <div style={{ padding: '.7rem .9rem', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <Link href="/" style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.5rem',
            marginBottom: '.6rem', padding: '.45rem .7rem', borderRadius: 8,
            background: 'rgba(37,99,235,.18)', border: '1px solid rgba(37,99,235,.35)',
            color: '#60a5fa', fontSize: '.75rem', fontWeight: 700,
          }}>
            <i className="fas fa-arrow-right" style={{ fontSize: '.65rem' }} /> القائمة الرئيسية
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg,#14532d,#16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(22,163,74,.35)',
            }}>
              <i className="fas fa-book-open" style={{ color: '#bbf7d0', fontSize: '.9rem' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#fff' }}>المكتبة</div>
              <div style={{ fontSize: '.58rem', color: '#475569' }}>نظام المحاسبة المتكامل</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: '.3rem' }}>
          {NAV.map(group => (
            <div key={group.section}>
              {group.section && (
                <div style={{ fontSize: '.58rem', color: '#475569', fontWeight: 700, padding: '.5rem .9rem .15rem', letterSpacing: .8 }}>
                  {group.section}
                </div>
              )}
              {group.items.map(item => (
                <button key={item.id} onClick={() => setActive(item.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '.55rem',
                  padding: '.5rem .9rem',
                  background: active === item.id ? `${item.color}18` : 'transparent',
                  border: 'none', borderRight: `3px solid ${active === item.id ? item.color : 'transparent'}`,
                  color: active === item.id ? '#fff' : '#6b7280',
                  fontSize: '.78rem', fontWeight: active === item.id ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'Cairo,sans-serif',
                  textAlign: 'right', direction: 'rtl', transition: 'all .15s',
                }}
                  onMouseEnter={e => { if (active !== item.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)' }}
                  onMouseLeave={e => { if (active !== item.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <i className={`fas ${item.icon}`} style={{ fontSize: '.75rem', width: 15, textAlign: 'center', color: active === item.id ? item.color : '#374151' }} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '.7rem .9rem' }}>
          <button onClick={() => createClient().auth.signOut().then(() => { window.location.href = '/login' })} style={{
            width: '100%', padding: '.38rem', borderRadius: 7,
            border: '1px solid rgba(220,38,38,.4)', background: 'rgba(220,38,38,.1)',
            color: '#f87171', fontSize: '.72rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Cairo,sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem',
          }}>
            <i className="fas fa-right-from-bracket" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ══ Main ══ */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Breadcrumb */}
        <div style={{
          background: '#141c2b', borderBottom: '1px solid rgba(255,255,255,.07)',
          padding: '.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ fontSize: '.78rem' }}>
            <span style={{ color: '#16a34a', fontWeight: 700 }}>المكتبة</span>
            <span style={{ color: 'rgba(255,255,255,.2)', margin: '0 .4rem' }}>/</span>
            <span style={{ color: '#94a3b8' }}>{SECTION_LABELS[active]}</span>
          </div>
          <span style={{ fontSize: '.68rem', color: '#374151' }}>
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Section content */}
        <div style={{ flex: 1 }}>
          {active === 'dashboard'    && <DashboardSection onNav={nav} />}
          {active === 'sale'         && <SaleSection showToast={showToast} />}
          {active === 'purchase'     && <PurchaseSection showToast={showToast} />}
          {active === 'sale-log'     && <SaleLogSection onNav={nav} />}
          {active === 'purchase-log' && <PurchaseLogSection onNav={nav} />}
          {active === 'products'     && <ProductsSection showToast={showToast} />}
          {active === 'categories'   && <CategoriesSection showToast={showToast} />}
          {active === 'customers'    && <CustomersSection showToast={showToast} />}
          {active === 'suppliers'    && <SuppliersSection showToast={showToast} />}
          {active === 'expenses'     && <ExpensesSection showToast={showToast} />}
          {active === 'settings'     && <SettingsSection showToast={showToast} />}
        </div>
      </main>

      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: '#14532d', border: '1px solid rgba(34,197,94,.3)',
          color: '#bbf7d0', borderRadius: 10, padding: '.6rem 1.4rem',
          fontSize: '.82rem', fontWeight: 600, zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,.5)', fontFamily: 'Cairo, sans-serif',
        }}>{toast}</div>
      )}
    </div>
  )
}

