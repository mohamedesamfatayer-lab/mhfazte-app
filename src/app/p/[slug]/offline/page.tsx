import { projects } from '@/registry'

export default async function OfflinePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'Cairo, sans-serif',
        color: '#e2e8f0',
        background: project?.appBg ?? '#0f172a',
      }}
    >
      <div style={{ fontSize: '3rem' }}>📡</div>
      <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
        {project?.title ?? 'التطبيق'}
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
        لا يوجد اتصال بالإنترنت
      </p>
    </div>
  )
}
