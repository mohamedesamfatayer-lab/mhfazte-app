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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function nav(s: Section) { setActive(s) }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', direction: 'rtl',
      background: '#0f1a2e', fontFamily: "'Cairo', system-ui, sans-serif",
      color: '#e2e8f0',
    }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 40,
        }} />
      )}

      {/* ══ Sidebar ══ */}
      <aside style={{
        width: 240, minWidth: 240, height: '100dvh',
        background: '#0d1521', display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid rgba(255,255,255,.06)', overflowY: 'auto',
        position: 'fixed' as const,
        top: 0, right: 0, bottom: 0,
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .25s ease',
      }}>
        {/* Brand header */}
        <div style={{ padding: '1rem 1rem .8rem', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.8rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              background: 'linear-gradient(135deg,#14532d,#16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(22,163,74,.35)',
            }}>
              <i className="fas fa-book-open" style={{ color: '#fff', fontSize: '1rem' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', lineHeight: 1.2 }}>المكتبة</div>
              <div style={{ fontSize: '.65rem', color: '#4b5563', marginTop: 2 }}>نظام المحاسبة المتكامل</div>
            </div>
          </div>
          <Link href="/" style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.5rem',
            padding: '.5rem .75rem', borderRadius: 8,
            background: 'rgba(37,99,235,.12)', border: '1px solid rgba(37,99,235,.25)',
            color: '#60a5fa', fontSize: '.78rem', fontWeight: 600,
          }}>
            <i className="fas fa-arrow-right" style={{ fontSize: '.68rem' }} /> القائمة الرئيسية
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '.5rem 0' }}>
          {NAV.map(group => (
            <div key={group.section}>
              {group.section && (
                <div style={{ fontSize: '.62rem', color: '#4b5563', fontWeight: 700, padding: '.7rem 1rem .25rem', letterSpacing: 1 }}>
                  {group.section}
                </div>
              )}
              {group.items.map(item => (
                <button key={item.id} onClick={() => { setActive(item.id); setSidebarOpen(false) }} style={{
                  width: 'calc(100% - 1rem)', display: 'flex', alignItems: 'center', gap: '.65rem',
                  padding: '.6rem .75rem', margin: '1px .5rem',
                  background: active === item.id ? 'rgba(255,255,255,.08)' : 'transparent',
                  border: 'none', borderRadius: 8,
                  color: active === item.id ? '#fff' : '#8899aa',
                  fontSize: '.83rem', fontWeight: active === item.id ? 700 : 400,
                  cursor: 'pointer', fontFamily: 'Cairo,sans-serif',
                  textAlign: 'right', direction: 'rtl', transition: 'all .15s',
                }}
                  onMouseEnter={e => { if (active !== item.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)' }}
                  onMouseLeave={e => { if (active !== item.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <i className={`fas ${item.icon}`} style={{ fontSize: '.85rem', width: 18, textAlign: 'center', color: active === item.id ? item.color : '#4b5563' }} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '.75rem 1rem' }}>
          <button onClick={() => createClient().auth.signOut().then(() => { window.location.href = '/login' })} style={{
            width: '100%', padding: '.5rem', borderRadius: 8,
            border: '1px solid rgba(220,38,38,.35)', background: 'rgba(220,38,38,.1)',
            color: '#f87171', fontSize: '.83rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Cairo,sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
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
          background: '#0d1521', borderBottom: '1px solid rgba(255,255,255,.06)',
          padding: '.6rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem',
          position: 'sticky', top: 0, zIndex: 10,
          direction: 'rtl',
        }}>
          {active !== 'dashboard' && (
            <button onClick={() => setActive('dashboard')} style={{
              background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 7,
              color: '#8899aa', cursor: 'pointer', padding: '.3rem .55rem', fontSize: '.85rem',
              display: 'flex', alignItems: 'center', gap: '.3rem', fontFamily: 'Cairo, sans-serif',
              flexShrink: 0,
            }}>
              <i className="fas fa-arrow-right" style={{ fontSize: '.75rem' }} />
              <span style={{ fontSize: '.75rem', fontWeight: 600 }}>رجوع</span>
            </button>
          )}
          <div style={{ fontSize: '.83rem', flex: 1 }}>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>المكتبة</span>
            <span style={{ color: 'rgba(255,255,255,.2)', margin: '0 .4rem' }}>/</span>
            <span style={{ color: '#8899aa' }}>{SECTION_LABELS[active]}</span>
          </div>
          <span style={{ fontSize: '.7rem', color: '#4b5563' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 7,
            color: '#8899aa', cursor: 'pointer', padding: '.3rem .55rem', fontSize: '1rem',
          }}>
            <i className="fas fa-bars" />
          </button>
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

