'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AutocompleteInput from '../components/AutocompleteInput'

interface Debt {
  id: string; name: string; currency: string; subtype: string | null;
  amount: number; remaining: number; date: string | null; note: string | null;
}

interface Props {
  onAdd?: () => void
  onPayment?: (debt: Debt) => void
}

export default function CreditorSection({ onAdd, onPayment }: Props) {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mhfazte_debts').select('*')
        .eq('type', 'دائن').order('created_at', { ascending: false })
      if (data) setDebts(data as Debt[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = debts.filter(d => !search || d.name.includes(search))
  const fmt = (n: number) => String(Math.round(Number(n) || 0))

  async function deleteDebt(id: string) {
    await createClient().from('mhfazte_debts').delete().eq('id', id)
    setDebts(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="section-anim">
      <div className="page-header">
        <span className="page-header-title">💚 ليا (دائن)</span>
        {onAdd && (
          <button className="page-header-btn" onClick={onAdd}>
            <i className="fas fa-plus" />
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: '.3rem .8rem .2rem', display: 'flex', alignItems: 'center' }}>
        <AutocompleteInput value={search} onChange={setSearch} placeholder="بحث باسم الشخص..." />
      </div>

      {/* Debt list */}
      <div className="debt-list" style={{ paddingTop: '.4rem' }}>
        {loading ? (
          <div className="empty-state"><i className="fas fa-spinner fa-spin" /><p>جاري التحميل...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><i className="fas fa-handshake" /><p>لا توجد ديون ليك</p></div>
        ) : (
          filtered.map(d => {
            const paid = Number(d.amount) - Number(d.remaining)
            const pct = d.amount > 0 ? Math.min(100, (paid / Number(d.amount)) * 100) : 0
            return (
              <div key={d.id} className="debt-card creditor" onClick={() => onPayment?.(d)}>
                <div className="debt-card-header">
                  <span className="debt-name">{d.name}</span>
                  <span className="debt-badge creditor">💚 دائن</span>
                </div>
                {d.note && <div style={{ fontSize: '.72rem', color: '#64748b', marginBottom: '.3rem' }}>{d.note}</div>}
                <div className="debt-row">
                  <div className="debt-mini">
                    <span className="debt-mini-label">إجمالي</span>
                    <span className="debt-mini-value">{fmt(d.amount)} <small style={{ color: '#64748b', fontSize: '.6rem' }}>{d.currency}</small></span>
                  </div>
                  <div className="debt-mini">
                    <span className="debt-mini-label">مدفوع</span>
                    <span className="debt-mini-value paid">{fmt(paid)}</span>
                  </div>
                  <div className="debt-mini">
                    <span className="debt-mini-label">الباقي</span>
                    <span className="debt-mini-value" style={{ color: '#059669' }}>{fmt(d.remaining)}</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill creditor" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.4rem', alignItems: 'center' }}>
                  <div style={{ fontSize: '.67rem', color: '#64748b' }}>{d.date ?? '—'}</div>
                  <button onClick={e => { e.stopPropagation(); deleteDebt(d.id) }} className="tx-act-btn del">
                    <i className="fas fa-trash-can" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
      <div style={{ height: '1.5rem' }} />
    </div>
  )
}

/* ───── Shared helpers used by other sections ───── */
export function PageHeader({ title, onAdd }: { title: string; onAdd?: () => void }) {
  return (
    <div className="page-header">
      <span className="page-header-title">{title}</span>
      {onAdd && (
        <button className="page-header-btn" onClick={onAdd}>
          <i className="fas fa-plus" />
        </button>
      )}
    </div>
  )
}

export function Loading() {
  return <div className="empty-state"><i className="fas fa-spinner fa-spin" /><p>جاري التحميل...</p></div>
}

export function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="empty-state">
      <i className={`fas ${icon}`} />
      <p>{text}</p>
    </div>
  )
}

export function inputStyle(paddingRight = '1rem'): React.CSSProperties {
  return {
    width: '100%', background: '#131e2d', border: '1.5px solid rgba(255,255,255,.1)',
    borderRadius: 10, padding: `.72rem ${paddingRight} .72rem 1rem`,
    color: '#e2e8f0', fontSize: '.9rem', outline: 'none', direction: 'rtl',
    fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box',
  }
}
