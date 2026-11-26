'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function SettingsSection({ showToast }: { showToast: (m: string) => void }) {
  const [form, setForm] = useState({ store_name: '', phone: '', address: '', vat_num: '', vat_pct: '15', min_stock: '5', currency: 'SAR' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    createClient().from('maktaba_settings').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) setForm({ store_name: data.store_name ?? '', phone: data.phone ?? '', address: data.address ?? '', vat_num: data.vat_num ?? '', vat_pct: String(data.vat_pct ?? 15), min_stock: String(data.min_stock ?? 5), currency: data.currency ?? 'SAR' })
    })
  }, [])

  async function save() {
    setSaving(true)
    await createClient().from('maktaba_settings').upsert({ id: 1, ...form, vat_pct: Number(form.vat_pct), min_stock: Number(form.min_stock) }, { onConflict: 'id' })
    setSaving(false); showToast('✅ تم حفظ الإعدادات')
  }

  const inp = (style?: any) => ({ background: '#1a2535', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '.5rem .75rem', color: '#e2e8f0', fontSize: '.82rem', fontFamily: 'Cairo,sans-serif', direction: 'rtl' as const, ...style })

  const fields = [
    { label: 'اسم المكتبة', key: 'store_name', type: 'text' },
    { label: 'رقم الهاتف', key: 'phone', type: 'text' },
    { label: 'العنوان', key: 'address', type: 'text' },
    { label: 'الرقم الضريبي', key: 'vat_num', type: 'text' },
    { label: 'نسبة ضريبة القيمة المضافة %', key: 'vat_pct', type: 'number' },
    { label: 'الحد الأدنى للمخزون', key: 'min_stock', type: 'number' },
  ]

  return (
    <div style={{ padding: '.9rem', direction: 'rtl', maxWidth: 560 }}>
      <div style={{ background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', padding: '1.4rem' }}>
        <div style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '.95rem', marginBottom: '1.1rem' }}>
          <i className="fas fa-gear" style={{ color: '#64748b', marginLeft: '.5rem' }} />
          إعدادات المكتبة
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem', marginBottom: '1rem' }}>
          {fields.map(f => (
            <div key={f.key} style={{ gridColumn: f.key === 'address' ? 'span 2' : undefined }}>
              <div style={{ fontSize: '.7rem', color: '#6b7280', marginBottom: '.28rem' }}>{f.label}</div>
              <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div>
            <div style={{ fontSize: '.7rem', color: '#6b7280', marginBottom: '.28rem' }}>العملة</div>
            <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} style={{ ...inp(), width: '100%' }}>
              <option value="SAR">ريال سعودي (ر.س)</option>
              <option value="EGP">جنيه مصري (ج.م)</option>
              <option value="USD">دولار ($)</option>
              <option value="AED">درهم (د.إ)</option>
            </select>
          </div>
        </div>

        <button onClick={save} disabled={saving} style={{
          background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10,
          padding: '.6rem 1.4rem', fontSize: '.85rem', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Cairo,sans-serif',
          display: 'flex', alignItems: 'center', gap: '.4rem',
        }}>
          <i className="fas fa-floppy-disk" />
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  )
}

