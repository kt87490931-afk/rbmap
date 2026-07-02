import '@/styles/lounge-theme.css'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className="lounge-site">{children}</div>
}
