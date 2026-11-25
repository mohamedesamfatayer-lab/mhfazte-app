import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'المنصة',
  description: 'مشاريعي',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
