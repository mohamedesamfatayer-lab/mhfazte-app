import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { DevPanel } from '@/components/dev/DevPanel'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'المنصة · Platform',
  description: 'مشاريعي · My Projects',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'var(--font-cairo), system-ui, sans-serif' }}>
        {children}
        {process.env.NODE_ENV === 'development' && <DevPanel />}
      </body>
    </html>
  )
}
