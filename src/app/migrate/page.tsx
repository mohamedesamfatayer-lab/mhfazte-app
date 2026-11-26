'use client'

import { useEffect, useRef, useState } from 'react'

// Firebase config from original app
const FB_CONFIG = {
  apiKey: 'AIzaSyB2WVBRuxop55kOJ0i7iSHBjrkxDsm__cM',
  authDomain: 'mhfazte.firebaseapp.com',
  projectId: 'mhfazte',
  storageBucket: 'mhfazte.firebasestorage.app',
  messagingSenderId: '770888739081',
  appId: '1:770888739081:web:17c30d2034d49ac47a0bd8',
}

type LogLine = { text: string; type: 'info' | 'ok' | 'err' | 'head' }

export default function MigratePage() {
  const [logs, setLogs] = useState<LogLine[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [fbLoaded, setFbLoaded] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  const log = (text: string, type: LogLine['type'] = 'info') => {
    setLogs(prev => [...prev, { text, type }])
    setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 50)
  }

  // Load Firebase SDK scripts
  useEffect(() => {
    const scripts = [
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
    ]
    let loaded = 0
    scripts.forEach(src => {
      const s = document.createElement('script')
      s.src = src
      s.onload = () => { loaded++; if (loaded === scripts.length) setFbLoaded(true) }
      document.head.appendChild(s)
    })
  }, [])

  async function startMigration() {
    if (running) return
    setRunning(true)
    setLogs([])

    try {
      log('⟳ تهيئة Firebase...', 'head')
      const firebase = (window as any).firebase

      // Init Firebase app (avoid re-init)
      if (!firebase.apps.length) firebase.initializeApp(FB_CONFIG)
      else firebase.app()

      const db = firebase.firestore()
      const auth = firebase.auth()

      // Force sign out first to avoid cached session
      await auth.signOut()
      log('⟳ تسجيل الدخول بجوجل (Firebase)...', 'info')
      const provider = new firebase.auth.GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await auth.signInWithPopup(provider)
      const fbUid = result.user.uid
      const fbEmail = result.user.email
      log(`✓ Firebase UID: ${fbUid}`, 'ok')
      log(`✓ Firebase Email: ${fbEmail}`, 'ok')

      const col = (name: string) => db.collection('users').doc(fbUid).collection(name)
      const toDate = (ts: any): string | null => {
        if (!ts) return null
        if (typeof ts === 'string') return ts
        if (ts.toDate) return ts.toDate().toISOString().slice(0, 10)
        return null
      }

      // ===== TEST: check if any data exists =====
      log('', 'info')
      log('── فحص البيانات الموجودة في Firebase ──', 'head')
      try {
        const testSnap = await col('debts').limit(1).get()
        log(`Firebase debts collection: ${testSnap.size} وثيقة موجودة (اختبار)`, testSnap.size > 0 ? 'ok' : 'info')
      } catch (e: any) {
        log(`✗ خطأ في قراءة Firebase: ${e.message}`, 'err')
        log('تأكد أن هذا هو الحساب الصحيح الذي فيه بياناتك', 'info')
        setRunning(false)
        return
      }

      // ===== READ ALL DATA FROM FIREBASE =====
      log('', 'info')
      log('── قراءة البيانات من Firebase ──', 'head')

      const [accDoc, debtsSnap, paymentsSnap, txSnap, expSnap, remSnap, recSnap] = await Promise.all([
        col('account').doc('main').get(),
        col('debts').get(),
        col('payments').get(),
        col('transactions').get(),
        col('expenses').get(),
        col('reminders').get(),
        col('recurring').get(),
      ])

      log(`الحساب: ${accDoc.exists ? '✓' : 'لا يوجد'}`, 'info')
      log(`الديون: ${debtsSnap.size}`, debtsSnap.size > 0 ? 'ok' : 'info')
      log(`الدفعات: ${paymentsSnap.size}`, 'info')
      log(`المعاملات: ${txSnap.size}`, 'info')
      log(`المصروفات: ${expSnap.size}`, 'info')
      log(`التذكيرات: ${remSnap.size}`, 'info')
      log(`المتكررة: ${recSnap.size}`, 'info')

      // Build payload
      const account = accDoc.exists ? { balances: accDoc.data()?.balances ?? {} } : null

      const debts = debtsSnap.docs.map((d: any) => {
        const data = d.data()
        return {
          _fbId: d.id,
          type: data.type,
          subtype: data.subtype ?? null,
          name: data.name ?? '',
          currency: data.currency ?? 'EGP',
          totalAmount: data.totalAmount ?? data.amount ?? 0,
          remaining: data.remaining ?? data.totalAmount ?? 0,
          date: toDate(data.date ?? data.createdAt),
          note: data.note ?? null,
        }
      })

      const payments = paymentsSnap.docs.map((d: any) => {
        const data = d.data()
        return {
          debtId: data.debtId,
          amount: data.amount ?? 0,
          date: toDate(data.date ?? data.createdAt),
          ref: data.ref ?? null,
          note: data.note ?? null,
        }
      })

      const transactions = txSnap.docs.map((d: any) => {
        const data = d.data()
        return {
          type: data.type ?? 'deposit',
          amount: data.amount ?? 0,
          currency: data.currency ?? 'EGP',
          note: data.note ?? null,
          date: toDate(data.date ?? data.createdAt),
          category: data.category ?? null,
        }
      })

      const expenses = expSnap.docs.map((d: any) => {
        const data = d.data()
        return {
          category: data.category ?? 'أخرى',
          amount: data.amount ?? 0,
          currency: data.currency ?? 'EGP',
          note: data.note ?? null,
          date: toDate(data.date ?? data.createdAt),
        }
      })

      const reminders = remSnap.docs.map((d: any) => {
        const data = d.data()
        return {
          title: data.title ?? data.text ?? '',
          date: toDate(data.date ?? data.createdAt),
          note: data.note ?? null,
          done: data.done ?? false,
        }
      })

      const recurring = recSnap.docs.map((d: any) => {
        const data = d.data()
        return {
          name: data.name ?? '',
          type: data.type ?? 'expense',
          currency: data.currency ?? 'EGP',
          amount: data.amount ?? 0,
          day: data.day ?? null,
          lastRun: data.lastRun ?? null,
        }
      })

      // ===== SEND TO SERVER API (bypasses RLS) =====
      log('', 'info')
      log('── إرسال إلى الخادم ──', 'head')
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, debts, payments, transactions, expenses, reminders, recurring }),
      })

      const json = await res.json()
      if (!res.ok) {
        log(`✗ خطأ من الخادم: ${json.error}`, 'err')
        setRunning(false)
        return
      }

      // Log results
      Object.entries(json.results).forEach(([key, val]) => {
        log(`${val}  ${key}`, 'ok')
      })

      log('', 'info')
      log('✅ اكتملت عملية النقل بنجاح!', 'ok')
      setDone(true)

    } catch (err: any) {
      log(`✗ خطأ: ${err.message}`, 'err')
    }

    setRunning(false)
  }

  const colMap: Record<LogLine['type'], string> = {
    info: '#94a3b8', ok: '#34d399', err: '#f87171', head: '#60a5fa',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#1a2535', color: '#e2e8f0',
      fontFamily: 'Cairo, system-ui, sans-serif', direction: 'rtl',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '.5rem' }}>
          🔄 نقل البيانات من Firebase إلى Supabase
        </div>
        <div style={{ color: '#94a3b8', fontSize: '.9rem', marginBottom: '1.5rem' }}>
          سيطلب منك تسجيل الدخول بجوجل (نفس حسابك في محفظتي) للوصول إلى بياناتك في Firebase.
        </div>

        {!fbLoaded && (
          <div style={{ color: '#60a5fa', fontSize: '.9rem', marginBottom: '1rem' }}>
            ⟳ جاري تحميل Firebase SDK...
          </div>
        )}

        {!done ? (
          <button
            onClick={startMigration}
            disabled={!fbLoaded || running}
            style={{
              background: running ? '#475569' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '.9rem 2rem', fontSize: '1rem', fontWeight: 700,
              cursor: running || !fbLoaded ? 'not-allowed' : 'pointer',
              fontFamily: 'Cairo, sans-serif', marginBottom: '1.5rem',
              width: '100%',
            }}
          >
            {running ? '⟳ جاري النقل...' : '🚀 ابدأ نقل البيانات'}
          </button>
        ) : (
          <a href="/p/mhfazte" style={{
            display: 'block', background: '#059669', color: '#fff',
            border: 'none', borderRadius: 12, padding: '.9rem 2rem',
            fontSize: '1rem', fontWeight: 700, textAlign: 'center',
            textDecoration: 'none', marginBottom: '1.5rem', width: '100%',
          }}>
            ✅ افتح محفظتي
          </a>
        )}

        {logs.length > 0 && (
          <div
            ref={logRef}
            style={{
              background: '#0f172a', borderRadius: 12, padding: '1rem',
              maxHeight: 400, overflowY: 'auto', direction: 'ltr',
              fontFamily: 'monospace', fontSize: '.8rem',
            }}
          >
            {logs.map((l, i) => (
              <div key={i} style={{ color: colMap[l.type], marginBottom: 2 }}>
                {l.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
