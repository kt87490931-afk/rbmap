export default function ReviewWriteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#050505', overflow: 'auto' }}>
      {children}
    </div>
  )
}
