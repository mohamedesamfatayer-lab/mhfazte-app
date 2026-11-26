'use client'

import { createClient } from '@/lib/supabase'

export default function MoreTab() {
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ padding: '1.5rem 1rem' }}>
      <div style={{ color: 'var(--a-text)', fontSize: 20, fontWeight: 800, marginBottom: '1.5rem' }}>
        أكثر
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'الميزانية',   icon: '📋', desc: 'ضبط ميزانية الفئات' },
          { label: 'التذكيرات',   icon: '🔔', desc: 'إدارة التذكيرات' },
          { label: 'المتكررة',    icon: '🔄', desc: 'المدفوعات المتكررة' },
          { label: 'الإعدادات',   icon: '⚙️', desc: 'إعدادات التطبيق' },
        ].map(item => (
          <button key={item.label} style={{
            background: 'var(--a-surface)',
            border: '1px solid var(--a-line)',
            borderRadius: 14,
            padding: '1rem 1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'right',
          }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--a-text)' }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--a-dim)', marginTop: 2 }}>{item.desc}</div>
            </div>
            <span style={{ color: 'var(--a-dim)', fontSize: 16 }}>›</span>
          </button>
        ))}

        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleSignOut} style={{
            width: '100%',
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 14,
            padding: '1rem 1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: '#f87171',
          }}>
            <span style={{ fontSize: 22 }}>🚪</span>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>تسجيل الخروج</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
