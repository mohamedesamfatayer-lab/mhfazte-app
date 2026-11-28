'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import ModalBase, { BtnOutline } from './ModalBase'

export const DEFAULT_EXPENSE_CATS = [
  'طعام', 'مواصلات', 'فواتير', 'ملابس', 'صحة', 'ترفيه', 'تعليم', 'منزل', 'أخرى',
]

export async function loadCategoriesFromDB(): Promise<string[]> {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return DEFAULT_EXPENSE_CATS
  const { data } = await sb.from('mhfazte_account').select('categories').eq('user_id', user.id).single()
  if (data?.categories && Array.isArray(data.categories) && (data.categories as string[]).length > 0) {
    return data.categories as string[]
  }
  return DEFAULT_EXPENSE_CATS
}

async function saveCategoriesToDB(list: string[]) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return
  await sb.from('mhfazte_account').upsert({ user_id: user.id, categories: list }, { onConflict: 'user_id' })
}

const inSt: React.CSSProperties = {
  flex: 1, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 8, padding: '.45rem .7rem', color: '#fff',
  fontSize: '.85rem', fontFamily: 'Cairo, sans-serif', outline: 'none',
  boxSizing: 'border-box',
}

interface Props { onClose: () => void; onSaved: () => void }

export default function ManageCategoriesModal({ onClose, onSaved }: Props) {
  const [cats, setCats]       = useState<string[]>(DEFAULT_EXPENSE_CATS)
  const [newCat, setNewCat]   = useState('')
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')

  useEffect(() => {
    loadCategoriesFromDB().then(setCats)
  }, [])

  async function persist(list: string[]) {
    await saveCategoriesToDB(list)
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
