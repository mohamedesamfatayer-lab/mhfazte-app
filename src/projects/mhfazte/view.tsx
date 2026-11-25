export default function MhfazteView() {
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
        color: 'var(--a-text, #e2e8f0)',
      }}
    >
      <div style={{ fontSize: '3rem' }}>👛</div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>محفظتي</h1>
      <p style={{ color: 'var(--a-dim, #94a3b8)', fontSize: '0.9rem', margin: 0 }}>
        قيد البناء
      </p>
    </div>
  )
}
