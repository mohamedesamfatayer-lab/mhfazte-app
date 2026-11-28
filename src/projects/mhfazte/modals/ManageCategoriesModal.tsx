'use client'

import { useState } from 'react'
import ModalBase, { BtnOutline } from './ModalBase'

export const DEFAULT_EXPENSE_CATS = [
  'طعام', 'مواصلات', 'فواتير', 'ملابس', 'صحة', 'ترفيه', 'تعليم', 'منزل', 'أخرى',
]

const LS_KEY = 'mhfazte_expense_cats'

export function loadExpenseCategories(): string[] {
  if (typeof window === 'undefined') return DEFAULT_EXPENSE_CATS
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return DEFAULT_EXPENSE_CATS
}

function saveExpenseCategories(list: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

const inSt: React.CSSProperties = {
  flex: 1, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 8, padding: '.45rem .7rem', color: '#fff',
  fontSize: '.85rem', fontFamily: 'Cairo, sans-serif', outline: 'none',
  boxSizing: 'border-box',
}

interface Props { onClose: () => void; onSaved: () => void }

export default function ManageCategoriesModal({ onClose, onSaved }: Props) {
  const [cats, setCats]       = useState<string[]>(() => loadExpenseCategories())
  const [newCat, setNewCat]   = useState('')
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')

  function persist(list: string[]) {
    saveExpenseCategories(list)
    setCats(list)
    onSaved()
  }

  function addCat() {
    const name = newCat.trim()
    if (!name || cats.includes(name)) return
    setNewCat('')
    persist([...cats, name])
  }

  function deleteCat(i: number) {
    persist(cats.filter((_, idx) => idx !== i))
  }

  function saveEdit(i: number) {
    const name = editVal.trim()
    if (!name) return
    setEditIdx(null)
    persist(cats.map((c, idx) => (idx === i ? name : c)))
  }

  return (
    <ModalBase title="إدارة فئات المصروفات" onClose={onClose}>
      <div style={{ marginBottom: '.8rem' }}>
        {cats.map((cat, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '.45rem',
            padding: '.35rem .45rem', borderRadius: 8,
            background: 'rgba(255,255,255,.04)', marginBottom: '.3rem',
          }}>
            {editIdx === i ? (
              <>
                <input
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(i) }}
                  style={inSt}
                  autoFocus
                />
                <button onClick={() => saveEdit(i)} style={{
                  padding: '.35rem .65rem', borderRadius: 7, border: 'none',
                  background: '#2563eb', color: '#fff', cursor: 'pointer',
                  fontSize: '.78rem', fontWeight: 700, fontFamily: 'Cairo, sans-serif',
                  whiteSpace: 'nowrap',
                }}>حفظ</button>
                <button onClick={() => setEditIdx(null)} style={{
                  padding: '.35rem .55rem', borderRadius: 7, border: 'none',
                  background: 'rgba(255,255,255,.08)', color: '#8899aa',
                  cursor: 'pointer', fontSize: '.78rem', fontFamily: 'Cairo, sans-serif',
                }}>إلغاء</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: '.85rem', color: '#e2e8f0' }}>{cat}</span>
                <button onClick={() => { setEditIdx(i); setEditVal(cat) }} style={{
                  padding: '.3rem .5rem', borderRadius: 7, border: 'none',
                  background: 'rgba(96,165,250,.15)', color: '#60a5fa',
                  cursor: 'pointer', fontSize: '.75rem',
                }}><i className="fas fa-pen" /></button>
                <button onClick={() => deleteCat(i)} style={{
                  padding: '.3rem .5rem', borderRadius: 7, border: 'none',
                  background: 'rgba(220,38,38,.15)', color: '#f87171',
                  cursor: 'pointer', fontSize: '.75rem',
                }}><i className="fas fa-trash-can" /></button>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '.45rem', marginBottom: '1rem' }}>
        <input
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addCat() }}
          placeholder="اسم الفئة الجديدة..."
          style={{ ...inSt }}
        />
        <button onClick={addCat} style={{
          padding: '.45rem .9rem', borderRadius: 8, border: 'none',
          background: '#15803d', color: '#fff', cursor: 'pointer',
          fontSize: '.82rem', fontWeight: 700, fontFamily: 'Cairo, sans-serif',
          display: 'flex', alignItems: 'center', gap: '.3rem', whiteSpace: 'nowrap',
        }}>
          <i className="fas fa-plus" />
          إضافة
        </button>
      </div>

      <BtnOutline onClick={onClose}>إغلاق</BtnOutline>
    </ModalBase>
  )
}
