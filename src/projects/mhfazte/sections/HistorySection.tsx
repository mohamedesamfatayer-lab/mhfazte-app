'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Tx {
  id: string; type: string; amount: number; currency: string;
  note: string | null; date: string | null; category: string | null;
}

type Filter = 'all' | 'deposit' | 'withdraw' | 'expense' | 'debt_payment' | 'debt_receive'

const typeConfig: Record<string, { label: string; color: string; cls: string; icon: string }> = {
  deposit:      { label: 'إيداع',      color: '#059669', cls: 'income',  icon: 'fa-arrow-down' },
  withdraw:     { label: 'سحب',        color: '#dc2626', cls: 'expense', icon: 'fa-arrow-up' },
  expense:      { label: 'مصروف',      color: '#d97706', cls: 'warning', icon: 'fa-receipt' },
  debt_payment: { label: 'سداد دين',   color: '#2563eb', cls: 'blue',    icon: 'fa-money-bill' },
  debt_receive: { label: 'استلام دين', color: '#7c3aed', cls: 'purple',  icon: 'fa-hand-holding-dollar' },
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'deposit', label: 'إيداع' },
  { key: 'withdraw', label: 'سحب' },
  { key: 'expense', label: 'مصروفات' },
  { key: 'debt_payment', label: 'سداد دين' },
  { key: 'debt_receive', label: 'استلام دين' },
]

export default function HistorySection() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mhfazte_transactions').select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(150)
      if (data) setTxs(data as Tx[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? txs : txs.filter(t => t.type === filter)
  const fmt = (n: number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })
  const isIncome = (t: Tx) => t.type === 'deposit' || t.type === 'debt_receive'

  async function deleteTx(id: string) {
    await createClient().from('mhfazte_transactions').delete().eq('id', id)
    setTxs(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="section-anim">
      <div className="page-header">
        <span className="page-header-title">سجل المعاملات</span>
      </div>

      {/* Filter chips */}
      <div className="filter-row">
        {FILTERS.map(f => (
          <button key={f.key} className={`filter-chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="tx-list" style={{ paddingTop: '.4rem' }}>
        {loading ? (
          <div className="empty-state"><i className="fas fa-spinner fa-spin" /><p>جاري التحميل...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><i className="fas fa-history" /><p>لا توجد معاملات</p></div>
        ) : (
          filtered.map(tx => {
            const cfg = typeConfig[tx.type] ?? { label: tx.type, color: '#94a3b8', cls: 'blue', icon: 'fa-circle' }
            return (
              <div key={tx.id} className="tx-item">
                <div className={`tx-icon ${cfg.cls}`}>
                  <i className={`fas ${cfg.icon}`} />
                </div>
                <div className="tx-info">
                  <div className="tx-name">{tx.note ?? tx.category ?? cfg.label}</div>
                  <div className="tx-date">{cfg.label} · {tx.date ?? '—'}</div>
                </div>
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  <div className={`tx-amount ${isIncome(tx) ? 'plus' : 'minus'}`}>
                    {isIncome(tx) ? '+' : '-'}{fmt(tx.amount)}
                  </div>
                  <div style={{ fontSize: '.65rem', color: '#64748b' }}>{tx.currency}</div>
                </div>
                <div className="tx-actions">
                  <button className="tx-act-btn del" onClick={() => deleteTx(tx.id)}>
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
