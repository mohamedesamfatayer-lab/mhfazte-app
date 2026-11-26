'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export default function AutocompleteInput({ value, onChange, placeholder, style }: Props) {
  const [allNames, setAllNames] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    createClient()
      .from('mhfazte_debts')
      .select('name')
      .then(({ data }) => {
        if (!data) return
        const unique = [...new Set((data as { name: string }[]).map(d => d.name).filter(Boolean))]
        setAllNames(unique.sort())
      })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = value.trim()
    ? allNames.filter(n => n.includes(value.trim()))
    : allNames

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'ابحث بالاسم...'}
        autoComplete="off"
        style={{
          width: '100%',
          background: '#243044',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 8,
          padding: '.4rem .7rem',
          color: '#e2e8f0',
          fontSize: '.78rem',
          outline: 'none',
          direction: 'rtl',
          fontFamily: 'Cairo, sans-serif',
          boxSizing: 'border-box',
          ...style,
        }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, left: 0,
          background: '#1e2d42',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,.5)',
          zIndex: 999,
          maxHeight: 220,
          overflowY: 'auto',
        }}>
          {filtered.map(name => (
            <div
              key={name}
              onMouseDown={e => { e.preventDefault(); onChange(name); setOpen(false) }}
              style={{
                padding: '.5rem .8rem',
                fontSize: '.8rem',
                color: '#e2e8f0',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,.05)',
                fontFamily: 'Cairo, sans-serif',
                direction: 'rtl',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#243044')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
