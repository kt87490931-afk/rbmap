import '@/styles/lounge-theme.css'
import { getLoungeHomeContent } from '@/lib/data/lounge-home'
import { LoungeSiteShell } from '@/components/lounge/LoungeSiteShell'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const content = await getLoungeHomeContent()
  return (
    <div className="lounge-site">
      <LoungeSiteShell content={content}>{children}</LoungeSiteShell>
    </div>
  )
}
