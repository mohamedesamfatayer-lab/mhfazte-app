'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Loading } from './CreditorSection'
import { printTransactionsReport, printPersonStatement, type DebtRow } from '../lib/printStatement'
import AutocompleteInput from '../components/AutocompleteInput'

interface Tx {
  id: string; type: string; amount: number; currency: string;
  note: string | null; date: string | null; category: string | null;
  debt_name?: string | null;
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom'
type TypeFilter = 'all' | 'deposit' | 'expense' | 'debt_payment' | 'debt_receive'
type MainTab = 'transactions' | 'charts'

export default function ReportsSection() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [mainTab, setMainTab] = useState<MainTab>('transactions')
  const [dateF, setDateF] = useState<DateFilter>('all')
  const [typeF, setTypeF] = useState<TypeFilter>('all')
  const [customDate, setCustomDate] = useState('')
  const [personSearch, setPersonSearch] = useState('')
  const [printingKashf, setPrintingKashf] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mhfazte_transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      if (data) setTxs(data as Tx[])
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const monthStart = today.slice(0, 7) + '-01'

  const filtered = txs
    .filter(t => {
      if (dateF === 'today') return t.date === today
      if (dateF === 'week') return (t.date ?? '') >= weekAgo
      if (dateF === 'month') return (t.date ?? '') >= monthStart
      if (dateF === 'custom' && customDate) return t.date === customDate
      return true
    })
    .filter(t => typeF === 'all' || t.type === typeF)
    .filter(t => {
      if (!personSearch.trim()) return true
      const name = t.debt_name ?? t.note ?? ''
      return name.includes(personSearch.trim())
    })

  const fmt = (n: number) => String(Math.round(Number(n) || 0))

  const isOut = (t: Tx) => t.type === 'expense' || t.type === 'debt_payment' || t.type === 'withdraw'
  const isIn = (t: Tx) => t.type === 'deposit' || t.type === 'debt_receive'

  const outByCur = filtered.filter(isOut).reduce((acc, t) => {
    acc[t.currency] = (acc[t.currency] ?? 0) + Number(t.amount)
    return acc
  }, {} as Record<string, number>)

  const inByCur = filtered.filter(isIn).reduce((acc, t) => {
    acc[t.currency] = (acc[t.currency] ?? 0) + Number(t.amount)
    return acc
  }, {} as Record<string, number>)

  const typeLabel: Record<string, string> = {
    deposit: 'إيداع', expense: 'مصروف', debt_payment: 'سداد دين',
    debt_receive: 'استلام دين', withdraw: 'سحب',
  }

  const typeIcon: Record<string, { icon: string; color: string; bg: string }> = {
    deposit:      { icon: 'fa-arrow-down', color: '#34d399', bg: 'rgba(52,211,153,.15)' },
    withdraw:     { icon: 'fa-arrow-up', color: '#f87171', bg: 'rgba(248,113,113,.15)' },
    expense:      { icon: 'fa-receipt', color: '#fbbf24', bg: 'rgba(251,191,36,.15)' },
    debt_payment: { icon: 'fa-hand-holding-dollar', color: '#f87171', bg: 'rgba(248,113,113,.15)' },
    debt_receive: { icon: 'fa-hand-holding-heart', color: '#34d399', bg: 'rgba(52,211,153,.15)' },
  }

  const dateChips: { key: DateFilter; label: string }[] = [
    { key: 'all', label: 'كل الوقت' },
    { key: 'today', label: 'اليوم' },
    { key: 'week', label: 'هذا الأسبوع' },
    { key: 'month', label: 'هذا الشهر' },
    { key: 'custom', label: 'تاريخ محدد' },
  ]

  const typeChips: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'deposit', label: 'إيداع' },
    { key: 'expense', label: 'مصروف' },
    { key: 'debt_payment', label: 'سداد دين' },
    { key: 'debt_receive', label: 'استلام دين' },
  ]

  async function printKashf() {
    if (!personSearch.trim()) return
    setPrintingKashf(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('mhfazte_debts')
      .select('name,amount,remaining,currency,subtype,note,date,type')
      .ilike('name', personSearch.trim())
      .order('date', { ascending: true })
    setPrintingKashf(false)
    if (data) printPersonStatement(personSearch.trim(), data as DebtRow[])
  }

  async function deleteTx(id: string) {
    const supabase = createClient()
    await supabase.from('mhfazte_transactions').delete().eq('id', id)
    setTxs(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div style={{ direction: 'rtl' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '.55rem .85rem .4rem',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
        <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#e2e8f0' }}>📊 التقارير</span>
        <button onClick={() => printTransactionsReport(filtered, 'تقرير المعاملات')} style={{
          width: 32, height: 32, borderRadius: 8, border: 'none',
          background: 'rgba(37,99,235,.4)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '.85rem',
        }}>
          <i className="fas fa-print" />
        </button>
      </div>

      {/* Main tabs */}
      <div style={{ display: 'flex', margin: '.6rem .8rem .3rem', background: '#243044', borderRadius: 10, padding: 3, gap: 3 }}>
        {([['transactions', 'المعاملات'], ['charts', 'مخططات']] as [MainTab, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setMainTab(k)} style={{
            flex: 1, padding: '.4rem', borderRadius: 8, border: 'none',
            background: mainTab === k ? '#2563eb' : 'transparent',
            color: mainTab === k ? '#fff' : '#94a3b8',
            fontSize: '.8rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif',
          }}>
            {label}
          </button>
        ))}
      </div>

      {mainTab === 'charts' ? (
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
          <i className="fas fa-chart-pie" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }} />
          <p style={{ margin: 0, fontSize: '.85rem' }}>المخططات قريباً</p>
        </div>
      ) : (
        <>
          {/* Date filter */}
          <div style={{ padding: '.5rem .8rem .3rem' }}>
            <div style={{ fontSize: '.7rem', color: '#94a3b8', marginBottom: '.4rem', fontWeight: 600 }}>الفترة الزمنية</div>
            <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
              {dateChips.map(c => (
                <button key={c.key} onClick={() => setDateF(c.key)} style={{
                  padding: '.28rem .6rem', borderRadius: 20, border: 'none',
                  background: dateF === c.key ? '#2563eb' : '#243044',
                  color: dateF === c.key ? '#fff' : '#94a3b8',
                  fontSize: '.7rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Cairo, sans-serif',
                }}>
                  {c.label}
                </button>
              ))}
            </div>
            {dateF === 'custom' && (
              <input
                type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
                style={{
                  marginTop: '.4rem', background: '#243044', border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 8, padding: '.35rem .6rem', color: '#e2e8f0', fontSize: '.8rem',
                  outline: 'none', direction: 'ltr',
                }}
              />
            )}
          </div>

          {/* Type filter */}
          <div style={{ padding: '.3rem .8rem .4rem' }}>
            <div style={{ fontSize: '.7rem', color: '#94a3b8', marginBottom: '.4rem', fontWeight: 600 }}>نوع المعاملة</div>
            <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
              {typeChips.map(c => (
                <button key={c.key} onClick={() => setTypeF(c.key)} style={{
                  padding: '.28rem .6rem', borderRadius: 20, border: 'none',
                  background: typeF === c.key ? '#2563eb' : '#243044',
                  color: typeF === c.key ? '#fff' : '#94a3b8',
                  fontSize: '.7rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Cairo, sans-serif',
                }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Person statement */}
          <div style={{ margin: '.2rem .8rem .5rem', background: '#1e2d42', borderRadius: 12, padding: '.6rem .8rem', border: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontSize: '.7rem', color: '#94a3b8', marginBottom: '.4rem', fontWeight: 600 }}>
              🧑 كشف حساب شخص
            </div>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <AutocompleteInput
                value={personSearch}
                onChange={setPersonSearch}
                placeholder="اكتب أو اختر اسم الشخص..."
              />
              <button onClick={printKashf} disabled={!personSearch.trim() || printingKashf} style={{
                background: personSearch.trim() ? '#8b5cf6' : '#374151',
                color: '#fff', border: 'none',
                borderRadius: 8, padding: '.4rem .7rem', fontSize: '.72rem',
                fontWeight: 700, cursor: personSearch.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'Cairo, sans-serif',
                whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '.3rem',
                opacity: printingKashf ? .7 : 1,
              }}>
                <i className={`fas ${printingKashf ? 'fa-spinner fa-spin' : 'fa-file-invoice'}`} />
                {printingKashf ? 'جاري...' : 'طباعة كشف'}
              </button>
            </div>
          </div>

          {/* Summary cards */}
          {!loading && (
            <div style={{ display: 'flex', gap: '.5rem', margin: '0 .8rem .5rem' }}>
              {/* Count */}
              <div style={{
                background: '#243044', borderRadius: 12, padding: '.6rem .8rem',
                border: '1px solid rgba(255,255,255,.07)', textAlign: 'center', minWidth: 70,
              }}>
                <div style={{ fontSize: '.6rem', color: '#94a3b8', marginBottom: '.25rem' }}>عدد المعاملات</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e2e8f0' }}>{filtered.length}</div>
              </div>

              {/* Outgoing */}
              <div style={{
                flex: 1, background: '#243044', borderRadius: 12, padding: '.6rem .8rem',
                border: '1px solid rgba(248,113,113,.15)',
              }}>
                <div style={{ fontSize: '.6rem', color: '#f87171', marginBottom: '.25rem', fontWeight: 600 }}>إجمالي صادر</div>
                {Object.keys(outByCur).length === 0
                  ? <div style={{ fontSize: '.8rem', color: '#475569' }}>—</div>
                  : Object.entries(outByCur).map(([cur, val]) => (
                    <div key={cur} style={{ fontSize: '.78rem', fontWeight: 700, color: '#e2e8f0' }}>
                      {fmt(val)} <span style={{ color: '#64748b', fontWeight: 400, fontSize: '.65rem' }}>{cur}</span>
                    </div>
                  ))
                }
              </div>

              {/* Incoming */}
              <div style={{
                flex: 1, background: '#243044', borderRadius: 12, padding: '.6rem .8rem',
                border: '1px solid rgba(52,211,153,.15)',
              }}>
                <div style={{ fontSize: '.6rem', color: '#34d399', marginBottom: '.25rem', fontWeight: 600 }}>إجمالي وارد</div>
                {Object.keys(inByCur).length === 0
                  ? <div style={{ fontSize: '.8rem', color: '#475569' }}>—</div>
                  : Object.entries(inByCur).map(([cur, val]) => (
                    <div key={cur} style={{ fontSize: '.78rem', fontWeight: 700, color: '#e2e8f0' }}>
                      {fmt(val)} <span style={{ color: '#64748b', fontWeight: 400, fontSize: '.65rem' }}>{cur}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Transactions list */}
          <div style={{ padding: '.3rem .75rem' }}>
            {loading ? <Loading /> : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0', fontSize: '.85rem' }}>
                لا توجد معاملات في هذه الفترة
              </div>
            ) : (
              filtered.map(tx => {
                const ti = typeIcon[tx.type] ?? { icon: 'fa-circle', color: '#94a3b8', bg: 'rgba(255,255,255,.08)' }
                const out = isOut(tx)
                return (
                  <div key={tx.id} style={{
                    background: '#243044', borderRadius: 12, padding: '.7rem .8rem',
                    marginBottom: '.35rem', display: 'flex', alignItems: 'center', gap: '.7rem',
                    border: '1px solid rgba(255,255,255,.05)',
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: ti.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`fas ${ti.icon}`} style={{ color: ti.color, fontSize: '.8rem' }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '.84rem', color: '#e2e8f0' }}>
                        {tx.note ?? tx.category ?? tx.debt_name ?? typeLabel[tx.type] ?? tx.type}
                      </div>
                      <div style={{ fontSize: '.67rem', color: '#64748b', marginTop: 2 }}>
                        {typeLabel[tx.type] ?? tx.type} · {tx.date ?? '—'}
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign: 'left', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '.92rem', color: out ? '#f87171' : '#34d399' }}>
                        {out ? '-' : '+'}{fmt(tx.amount)}
                      </div>
                      <div style={{ fontSize: '.62rem', color: '#64748b' }}>{tx.currency}</div>
                    </div>

                    {/* Delete */}
                    <button onClick={() => deleteTx(tx.id)} style={{
                      width: 28, height: 28, borderRadius: '50%', border: 'none',
                      background: 'rgba(248,113,113,.15)', color: '#f87171',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                    }}>
                      <i className="fas fa-trash-can" style={{ fontSize: '.7rem' }} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
