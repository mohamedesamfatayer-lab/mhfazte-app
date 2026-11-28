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

const CURRENCIES = ['EGP', 'SAR', 'USD']
const CUR_LABELS: Record<string, string> = { EGP: 'ج.م', SAR: 'ريال', USD: '$' }

const inSt: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 8, padding: '.4rem .7rem', color: '#fff',
  fontSize: '.8rem', fontFamily: 'Cairo, sans-serif', outline: 'none',
  boxSizing: 'border-box',
}

export default function HistorySection() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ type: string; amount: string; currency: string; date: string; note: string }>({
    type: '', amount: '', currency: 'EGP', date: '', note: '',
  })
  const [saving, setSaving] = useState(false)

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
  const fmt = (n: number) => String(Math.round(Number(n) || 0))
  const isIncome = (t: Tx) => t.type === 'deposit' || t.type === 'debt_receive'

  async function deleteTx(id: string) {
    await createClient().from('mhfazte_transactions').delete().eq('id', id)
    setTxs(prev => prev.filter(t => t.id !== id))
  }

  function openEdit(tx: Tx) {
    setEditId(tx.id)
    setEditData({
      type: tx.type,
      amount: String(tx.amount),
      currency: tx.currency,
      date: tx.date ?? '',
      note: tx.note ?? '',
    })
  }

  async function saveEdit() {
    if (!editId) return
    if (!editData.amount || isNaN(Number(editData.amount))) return
    setSaving(true)
    await createClient().from('mhfazte_transactions').update({
      type: editData.type,
      amount: Number(editData.amount),
      currency: editData.currency,
      date: editData.date || null,
      note: editData.note || null,
    }).eq('id', editId)
    setTxs(prev => prev.map(t => t.id === editId ? {
      ...t,
      type: editData.type,
      amount: Number(editData.amount),
      currency: editData.currency,
      date: editData.date || null,
      note: editData.note || null,
    } : t))
    setSaving(false)
    setEditId(null)
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
            const isEditing = editId === tx.id
            return (
              <div key={tx.id}>
                {/* ── Transaction row ── */}
                <div className="tx-item">
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
                    <button
                      className="tx-act-btn"
                      title="تعديل"
                      onClick={() => isEditing ? setEditId(null) : openEdit(tx)}
                      style={{
                        color: isEditing ? '#fbbf24' : '#60a5fa',
                        background: isEditing ? 'rgba(251,191,36,.15)' : 'rgba(96,165,250,.15)',
                      }}
                    >
                      <i className={`fas ${isEditing ? 'fa-xmark' : 'fa-pen'}`} />
                    </button>
                    <button className="tx-act-btn del" onClick={() => deleteTx(tx.id)}>
                      <i className="fas fa-trash-can" />
                    </button>
                  </div>
                </div>

                {/* ── Inline edit panel ── */}
                {isEditing && (
                  <div style={{
                    margin: '0 .9rem .5rem',
                    background: '#131f30',
                    border: '1px solid rgba(251,191,36,.25)',
                    borderRadius: 10, padding: '.85rem 1rem',
                    direction: 'rtl',
                  }}>
                    <div style={{ fontSize: '.72rem', color: '#fbbf24', fontWeight: 700, marginBottom: '.7rem' }}>
                      <i className="fas fa-pen" style={{ marginLeft: '.35rem' }} />
                      تعديل المعاملة
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
                      {/* Type */}
                      <div style={{ flex: '1 1 140px' }}>
                        <div style={{ fontSize: '.65rem', color: '#8899aa', marginBottom: '.25rem' }}>النوع</div>
                        <select value={editData.type} onChange={e => setEditData(d => ({ ...d, type: e.target.value }))} style={inSt}>
                          {Object.entries(typeConfig).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div style={{ flex: '1 1 100px' }}>
                        <div style={{ fontSize: '.65rem', color: '#8899aa', marginBottom: '.25rem' }}>المبلغ</div>
                        <input
                          type="number" inputMode="decimal"
                          value={editData.amount}
                          onChange={e => setEditData(d => ({ ...d, amount: e.target.value }))}
                          style={inSt}
                        />
                      </div>

                      {/* Currency */}
                      <div style={{ flex: '1 1 120px' }}>
                        <div style={{ fontSize: '.65rem', color: '#8899aa', marginBottom: '.25rem' }}>العملة</div>
                        <div style={{ display: 'flex', gap: '.3rem' }}>
                          {CURRENCIES.map(c => (
                            <button key={c} onClick={() => setEditData(d => ({ ...d, currency: c }))} style={{
                              flex: 1, padding: '.38rem .3rem', borderRadius: 7, border: 'none', cursor: 'pointer',
                              background: editData.currency === c ? 'rgba(37,99,235,.5)' : 'rgba(255,255,255,.06)',
                              color: editData.currency === c ? '#fff' : '#8899aa',
                              fontSize: '.72rem', fontWeight: 700, fontFamily: 'Cairo, sans-serif',
                            }}>{CUR_LABELS[c]}</button>
                          ))}
                        </div>
                      </div>

                      {/* Date */}
                      <div style={{ flex: '1 1 140px' }}>
                        <div style={{ fontSize: '.65rem', color: '#8899aa', marginBottom: '.25rem' }}>التاريخ</div>
                        <input
                          type="date" value={editData.date}
                          onChange={e => setEditData(d => ({ ...d, date: e.target.value }))}
                          style={inSt}
                        />
                      </div>

                      {/* Note */}
                      <div style={{ flex: '2 1 200px' }}>
                        <div style={{ fontSize: '.65rem', color: '#8899aa', marginBottom: '.25rem' }}>ملاحظة</div>
                        <input
                          type="text" value={editData.note}
                          onChange={e => setEditData(d => ({ ...d, note: e.target.value }))}
                          placeholder="وصف اختياري"
                          style={inSt}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '.5rem', marginTop: '.8rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditId(null)} style={{
                        padding: '.4rem .9rem', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)',
                        background: 'transparent', color: '#8899aa', fontSize: '.78rem', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                      }}>إلغاء</button>
                      <button onClick={saveEdit} disabled={saving} style={{
                        padding: '.4rem 1.1rem', borderRadius: 8, border: 'none',
                        background: '#2563eb', color: '#fff', fontSize: '.78rem', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                        opacity: saving ? .6 : 1,
                      }}>
                        {saving ? 'جاري الحفظ...' : 'حفظ التعديل'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      <div style={{ height: '1.5rem' }} />
    </div>
  )
}
