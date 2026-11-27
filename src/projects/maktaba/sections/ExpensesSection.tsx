'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const CATS = ['إيجار','كهرباء','مياه','رواتب','شحن ونقل','صيانة','تسويق','مشتريات','أخرى']

export default function ExpensesSection({ showToast }: { showToast: (m: string) => void }) {
  const [list, setList]     = useState<any[]>([])
  const [month, setMonth]   = useState(new Date().toISOString().slice(0, 7))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ description: '', amount: '', category: 'أخرى', date: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving]     = useState(false)

  async function load() {
    const sb = createClient()
    const from = `${month}-01`
    const to   = `${month}-31`
    const { data } = await sb.from('maktaba_expenses').select('*').gte('date', from).lte('date', to).order('date', { ascending: false })
    setList(data ?? [])
  }

  useEffect(() => { load() }, [month])

  async function save() {
    if (!form.description.trim() || !form.amount) return showToast('تأكد من ملء الحقول')
    setSaving(true)
    await createClient().from('maktaba_expenses').insert({ ...form, amount: Number(form.amount) })
    setSaving(false); setShowForm(false); showToast('✅ تمت الإضافة')
    setForm({ description: '', amount: '', category: 'أخرى', date: new Date().toISOString().slice(0, 10) })
    load()
  }

  async function del(id: string) { if (!confirm('حذف المصروف؟')) return; await createClient().from('maktaba_expenses').delete().eq('id', id); showToast('🗑 تم الحذف'); load() }

  const total = list.reduce((a, r) => a + Number(r.amount), 0)
  const fmt = (n: number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const inp = (style?: any) => ({ background: '#1a2535', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '.45rem .7rem', color: '#e2e8f0', fontSize: '.8rem', fontFamily: 'Cairo,sans-serif', direction: 'rtl' as const, ...style })

  return (
    <div style={{ padding: '.9rem', direction: 'rtl' }}>
      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '.9rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setShowForm(true)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '.45rem 1rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
          <i className="fas fa-plus" style={{ marginLeft: '.35rem' }} />إضافة مصروف
        </button>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={inp()} />
        <div style={{ marginRight: 'auto', background: '#1e2d42', borderRadius: 9, padding: '.4rem .9rem', border: '1px solid rgba(248,113,113,.2)', fontSize: '.82rem', color: '#f87171', fontWeight: 700 }}>
          الإجمالي: {fmt(total)} ر.س
        </div>
      </div>

      <div style={{ background: '#1e2d42', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
          <thead><tr style={{ background: 'rgba(255,255,255,.04)' }}>{['البيان','الفئة','المبلغ','التاريخ',''].map(h => <th key={h} style={{ padding: '.6rem .8rem', color: '#475569', textAlign: 'right' }}>{h}</th>)}</tr></thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                <td style={{ padding: '.55rem .8rem', color: '#e2e8f0' }}>{r.description}</td>
                <td style={{ padding: '.55rem .8rem' }}><span style={{ background: 'rgba(248,113,113,.12)', color: '#f87171', borderRadius: 5, padding: '.1rem .4rem', fontSize: '.68rem' }}>{r.category}</span></td>
                <td style={{ padding: '.55rem .8rem', color: '#fca5a5', fontWeight: 700 }}>{fmt(r.amount)} ر.س</td>
                <td style={{ padding: '.55rem .8rem', color: '#475569' }}>{r.date}</td>
                <td style={{ padding: '.55rem .8rem' }}><button onClick={() => del(r.id)} style={{ background: 'rgba(248,113,113,.2)', color: '#f87171', border: 'none', borderRadius: 6, padding: '.22rem .5rem', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.7rem' }}>حذف</button></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#374151' }}>لا توجد مصروفات لهذا الشهر</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{ background: '#1e2d42', borderRadius: 14, padding: '1.4rem', width: '100%', maxWidth: 400, border: '1px solid rgba(255,255,255,.1)', direction: 'rtl' }}>
            <div style={{ fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>إضافة مصروف جديد</div>
            {[{ label: 'البيان *', key: 'description', type: 'text' }, { label: 'المبلغ *', key: 'amount', type: 'number' }, { label: 'التاريخ', key: 'date', type: 'date' }].map(f => (
              <div key={f.key} style={{ marginBottom: '.6rem' }}>
                <div style={{ fontSize: '.7rem', color: '#6b7280', marginBottom: '.25rem' }}>{f.label}</div>
                <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '.7rem', color: '#6b7280', marginBottom: '.25rem' }}>الفئة</div>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ ...inp(), width: '100%' }}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '.6rem' }}>
              <button onClick={() => setShowForm(false)} style={{ ...inp(), cursor: 'pointer', padding: '.45rem 1rem' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '.45rem 1.2rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>{saving ? '...' : 'حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

