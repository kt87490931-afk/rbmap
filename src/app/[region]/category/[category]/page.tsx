import { redirect } from 'next/navigation'
import { REGION_SLUGS } from '@/lib/data/venues'

/** /gangnam/category/karaoke → /gangnam (지역 페이지) */
export default async function RegionCategoryRedirectPage({
  params,
}: {
  params: Promise<{ region: string; category: string }>
}) {
  const { region } = await params
  if ((REGION_SLUGS as readonly string[]).includes(region)) {
    redirect(`/${region}`)
  }
  redirect('/')
}
