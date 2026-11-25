export default function DemoView() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        fontFamily: 'Cairo, sans-serif',
        color: 'var(--a-text, #f1f5f9)',
      }}
    >
      <div style={{ fontSize: '3rem' }}>🧪</div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>مشروع تجريبي</h1>
      <p style={{ color: 'var(--a-dim, #64748b)', fontSize: '0.9rem', margin: 0 }}>
        هذا مشروع فارغ للاختبار
      </p>
    </div>
  )
}
