'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AutocompleteInput from '../components/AutocompleteInput'

interface Debt {
  id: string; name: string; currency: string; subtype: string | null;
  amount: number; remaining: number; date: string | null; note: string | null;
}

type SubTab = 'all' | 'سلفة' | 'أقساط'

interface Props {
  onAdd?: () => void
  onPayment?: (debt: Debt) => void
}

export default function DebtorSection({ onAdd, onPayment }: Props) {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subTab, setSubTab] = useState<SubTab>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mhfazte_debts').select('*')
        .eq('type', 'مدين').order('created_at', { ascending: false })
      if (data) setDebts(data as Debt[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = debts
    .filter(d => !search || d.name.includes(search))
    .filter(d => subTab === 'all' || d.subtype === subTab)

  const fmt = (n: number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })

  const سلفTotals = debts.filter(d => d.subtype !== 'أقساط').reduce((acc, d) => {
    acc[d.currency] = (acc[d.currency] ?? 0) + Number(d.remaining); return acc
  }, {} as Record<string, number>)

  const قسطTotals = debts.filter(d => d.subtype === 'أقساط').reduce((acc, d) => {
    acc[d.currency] = (acc[d.currency] ?? 0) + Number(d.remaining); return acc
  }, {} as Record<string, number>)

  async function deleteDebt(id: string) {
    await createClient().from('mhfazte_debts').delete().eq('id', id)
    setDebts(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="section-anim">
      {/* Page Header */}
      <div className="page-header">
        <span className="page-header-title">❤️ عليا (مدين)</span>
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

      {/* Sub Tabs */}
      <div className="tabs" style={{ margin: '.5rem .8rem .3rem' }}>
        {(['all', 'سلفة', 'أقساط'] as SubTab[]).map(t => (
          <button key={t} className={`tab ${subTab === t ? 'active' : ''}`} onClick={() => setSubTab(t)}>
            {t === 'all' ? 'الكل' : t === 'سلفة' ? '💸 سلف' : '📋 أقساط'}
          </button>
        ))}
      </div>

      {/* Summary strip */}
      {!loading && (
        <div style={{ display: 'flex', gap: '.4rem', padding: '0 .8rem .4rem' }}>
          <div style={{
            flex: 1, background: '#243044', borderRadius: 10, padding: '.5rem .6rem',
            border: '1px solid rgba(220,38,38,.2)',
          }}>
            <div style={{ fontSize: '.6rem', color: '#94a3b8', marginBottom: '.2rem' }}>💸 سلف الباقي</div>
            {Object.keys(سلفTotals).length === 0
              ? <div style={{ fontSize: '.75rem', color: '#475569' }}>لا يوجد</div>
              : Object.entries(سلفTotals).map(([cur, val]) => (
                <div key={cur} style={{ fontSize: '.8rem', fontWeight: 700, color: '#dc2626' }}>
                  {fmt(val)} <span style={{ fontSize: '.62rem', color: '#94a3b8' }}>{cur}</span>
                </div>
              ))
            }
          </div>
          <div style={{
            flex: 1, background: '#243044', borderRadius: 10, padding: '.5rem .6rem',
            border: '1px solid rgba(217,119,6,.2)',
          }}>
            <div style={{ fontSize: '.6rem', color: '#94a3b8', marginBottom: '.2rem' }}>📋 أقساط الباقي</div>
            {Object.keys(قسطTotals).length === 0
              ? <div style={{ fontSize: '.75rem', color: '#475569' }}>لا يوجد</div>
              : Object.entries(قسطTotals).map(([cur, val]) => (
                <div key={cur} style={{ fontSize: '.8rem', fontWeight: 700, color: '#d97706' }}>
                  {fmt(val)} <span style={{ fontSize: '.62rem', color: '#94a3b8' }}>{cur}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Debt list */}
      <div className="debt-list" style={{ paddingTop: '.3rem' }}>
        {loading ? (
          <div className="empty-state"><i className="fas fa-spinner fa-spin" /><p>جاري التحميل...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><i className="fas fa-handshake" /><p>لا توجد ديون عليك</p></div>
        ) : (
          filtered.map(d => {
            const paid = Number(d.amount) - Number(d.remaining)
            const pct = d.amount > 0 ? Math.min(100, (paid / Number(d.amount)) * 100) : 0
            return (
              <div key={d.id} className="debt-card debtor" onClick={() => onPayment?.(d)}>
                <div className="debt-card-header">
                  <span className="debt-name">{d.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    {d.subtype && (
                      <span style={{
                        fontSize: '.68rem', fontWeight: 600, padding: '.15rem .45rem',
                        borderRadius: 20, background: '#fef2f2', color: '#dc2626',
                      }}>{d.subtype}</span>
                    )}
                    <span className="debt-badge debtor">❤️ مدين</span>
                  </div>
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
                    <span className="debt-mini-value remaining">{fmt(d.remaining)}</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill debtor" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.4rem', alignItems: 'center' }}>
                  <div style={{ fontSize: '.67rem', color: '#64748b' }}>{d.date ?? '—'}</div>
                  <div style={{ display: 'flex', gap: '.3rem' }}>
                    <button onClick={e => { e.stopPropagation(); deleteDebt(d.id) }} className="tx-act-btn del">
                      <i className="fas fa-trash-can" />
                    </button>
                  </div>
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
