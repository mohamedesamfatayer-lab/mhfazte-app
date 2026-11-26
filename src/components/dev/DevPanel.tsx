'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

type Lang = 'ar' | 'en'

const t = {
  ar: {
    title: 'أدوات المطور',
    route: 'المسار',
    bundler: 'المجمّع',
    mode: 'وضع العرض',
    static: 'ثابت',
    dynamic: 'ديناميكي',
    hide: 'إخفاء',
    show: 'أدوات',
    preferences: 'الإعدادات',
    position: 'الموضع',
    size: 'الحجم',
    theme: 'المظهر',
    system: 'النظام',
    bottomLeft: 'أسفل اليسار',
    bottomRight: 'أسفل اليمين',
    medium: 'متوسط',
    hideSession: 'إخفاء للجلسة',
    disableHint: 'لتعطيل الأداة كلياً، أضف devIndicators: false في next.config.ts',
    switchLang: 'English',
  },
  en: {
    title: 'Dev Tools',
    route: 'Route',
    bundler: 'Bundler',
    mode: 'Render Mode',
    static: 'Static',
    dynamic: 'Dynamic',
    hide: 'Hide',
    show: 'Tools',
    preferences: 'Preferences',
    position: 'Position',
    size: 'Size',
    theme: 'Theme',
    system: 'System',
    bottomLeft: 'Bottom Left',
    bottomRight: 'Bottom Right',
    medium: 'Medium',
    hideSession: 'Hide for session',
    disableHint: 'To disable completely, set devIndicators: false in next.config.ts',
    switchLang: 'عربي',
  },
}

function getRouteMode(path: string): 'static' | 'dynamic' {
  if (path === '/') return 'static'
  if (path.startsWith('/p/') && !path.includes('/icons/') && !path.includes('/sw')) return 'static'
  return 'dynamic'
}

export function DevPanel() {
  const pathname = usePathname()
  const [lang, setLang] = useState<Lang>('ar')
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'info' | 'prefs'>('info')
  const [hidden, setHidden] = useState(false)
  const [position, setPosition] = useState<'bottom-left' | 'bottom-right'>('bottom-left')

  useEffect(() => {
    const stored = sessionStorage.getItem('devpanel-hidden')
    if (stored === '1') setHidden(true)
    const storedLang = localStorage.getItem('devpanel-lang') as Lang | null
    if (storedLang) setLang(storedLang)
    const storedPos = localStorage.getItem('devpanel-pos') as typeof position | null
    if (storedPos) setPosition(storedPos)
  }, [])

  const tx = t[lang]
  const mode = getRouteMode(pathname)
  const isRtl = lang === 'ar'

  function toggleLang() {
    const next: Lang = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    localStorage.setItem('devpanel-lang', next)
  }

  function hideSession() {
    sessionStorage.setItem('devpanel-hidden', '1')
    setHidden(true)
    setOpen(false)
  }

  function setPos(p: typeof position) {
    setPosition(p)
    localStorage.setItem('devpanel-pos', p)
  }

  if (hidden) return null

  const posStyle: React.CSSProperties =
    position === 'bottom-left'
      ? { bottom: 16, left: 16 }
      : { bottom: 16, right: 16 }

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 99999,
        fontFamily: "'Cairo', 'Segoe UI', system-ui, sans-serif",
        fontSize: 13,
        direction: isRtl ? 'rtl' : 'ltr',
        ...posStyle,
      }}
    >
      {/* Panel */}
      {open && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          width: 300,
          marginBottom: 8,
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '1px solid #f1f5f9',
            background: '#f8fafc',
          }}>
            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{tx.title}</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {/* Lang toggle */}
              <button onClick={toggleLang} style={{
                background: '#e0e7ff',
                color: '#4338ca',
                border: 'none',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                {tx.switchLang}
              </button>
              {/* Close */}
              <button onClick={() => setOpen(false)} style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                fontSize: 16,
                lineHeight: 1,
                padding: 2,
              }}>
                ×
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #f1f5f9',
          }}>
            {(['info', 'prefs'] as const).map((tabId) => (
              <button key={tabId} onClick={() => setTab(tabId)} style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                background: tab === tabId ? '#fff' : '#f8fafc',
                color: tab === tabId ? '#1e293b' : '#94a3b8',
                fontWeight: tab === tabId ? 700 : 400,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                borderBottom: tab === tabId ? '2px solid #6366f1' : '2px solid transparent',
              }}>
                {tabId === 'info' ? tx.route : tx.preferences}
              </button>
            ))}
          </div>

          {/* Tab: Info */}
          {tab === 'info' && (
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row label={tx.route} isRtl={isRtl}>
                <code style={{
                  background: '#f1f5f9',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 11,
                  color: '#334155',
                  direction: 'ltr',
                  display: 'inline-block',
                }}>
                  {pathname}
                </code>
              </Row>
              <Row label={tx.bundler} isRtl={isRtl}>
                <Badge color="#f97316">Turbopack</Badge>
              </Row>
              <Row label={tx.mode} isRtl={isRtl}>
                <Badge color={mode === 'static' ? '#10b981' : '#6366f1'}>
                  {mode === 'static' ? tx.static : tx.dynamic}
                </Badge>
              </Row>
            </div>
          )}

          {/* Tab: Preferences */}
          {tab === 'prefs' && (
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row label={tx.position} isRtl={isRtl}>
                <select
                  value={position}
                  onChange={(e) => setPos(e.target.value as typeof position)}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: '2px 6px',
                    fontSize: 12,
                    color: '#334155',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="bottom-left">{tx.bottomLeft}</option>
                  <option value="bottom-right">{tx.bottomRight}</option>
                </select>
              </Row>
              <Row label={tx.theme} isRtl={isRtl}>
                <Badge color="#64748b">{tx.system}</Badge>
              </Row>
              <div style={{ marginTop: 4 }}>
                <button onClick={hideSession} style={{
                  width: '100%',
                  padding: '7px 0',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                  {tx.hideSession}
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.5, direction: 'ltr' }}>
                {tx.disableHint}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          padding: '5px 10px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#10b981', flexShrink: 0,
        }} />
        {tx.show}
      </button>
    </div>
  )
}

function Row({ label, children, isRtl }: { label: string; children: React.ReactNode; isRtl: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      flexDirection: isRtl ? 'row' : 'row',
    }}>
      <span style={{ color: '#64748b', fontSize: 12, flexShrink: 0 }}>{label}</span>
      <div>{children}</div>
    </div>
  )
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      background: color + '18',
      color: color,
      border: `1px solid ${color}33`,
      borderRadius: 6,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 700,
    }}>
      {children}
    </span>
  )
}
