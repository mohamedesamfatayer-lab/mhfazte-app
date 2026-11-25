import { projects } from '@/registry'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{
      minHeight: '100dvh',
      background: '#0f172a',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h1 style={{
        color: '#f1f5f9',
        fontSize: '1.5rem',
        fontWeight: 800,
        marginBottom: '1.5rem',
        fontFamily: 'Cairo, sans-serif',
      }}>
        مشاريعي
      </h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1rem',
      }}>
        {projects.map((p) => (
          <Link key={p.slug} href={`/p/${p.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#1e293b',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: p.icon.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}>
                <svg
                  width={28}
                  height={28}
                  viewBox="0 0 24 24"
                  fill={p.icon.stroke ? 'none' : p.icon.fg}
                  stroke={p.icon.stroke ? p.icon.fg : 'none'}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={p.icon.path} />
                </svg>
              </div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem', fontFamily: 'Cairo, sans-serif' }}>
                {p.title}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.25rem', fontFamily: 'Cairo, sans-serif' }}>
                {p.summary}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
