'use client'

import { useEffect, useState } from 'react'

export function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSTip, setShowIOSTip] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (installed) return null

  async function install() {
    if (isIOS) { setShowIOSTip(t => !t); return }
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
  }

  return (
    <div style={{ padding: '0 .75rem .6rem' }}>
      <button onClick={install} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '.55rem',
        padding: '.55rem .75rem', borderRadius: 8, border: '1px solid rgba(96,165,250,.3)',
        background: 'rgba(96,165,250,.1)', color: '#60a5fa',
        fontSize: '.8rem', fontWeight: 700, cursor: 'pointer',
        fontFamily: 'Cairo, sans-serif', direction: 'rtl',
      }}>
        <i className="fas fa-mobile-screen-button" style={{ fontSize: '.85rem' }} />
        تثبيت التطبيق
        {isIOS && <i className="fas fa-circle-info" style={{ fontSize: '.7rem', marginRight: 'auto', opacity: .7 }} />}
      </button>

      {showIOSTip && (
        <div style={{
          marginTop: '.4rem', background: '#1e3a5f', borderRadius: 8,
          padding: '.55rem .7rem', fontSize: '.72rem', color: '#93c5fd',
          border: '1px solid rgba(96,165,250,.2)', lineHeight: 1.6, direction: 'rtl',
        }}>
          افتح Safari ← اضغط زر المشاركة
          <i className="fas fa-arrow-up-from-bracket" style={{ margin: '0 .3rem' }} />
          ← اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong>
        </div>
      )}
    </div>
  )
}
