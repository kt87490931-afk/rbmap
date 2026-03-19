import { redirect } from 'next/navigation'
import { getRegionBySlugServer } from '@/lib/data/regions'

/** /gangnam/category/karaoke → /gangnam (지역 페이지) */
export default async function RegionCategoryRedirectPage({
  params,
}: {
  params: Promise<{ region: string; category: string }>
}) {
  const { region } = await params
  const regionData = await getRegionBySlugServer(region)
  if (regionData && !regionData.coming) {
    redirect(`/${region}`)
  }
  redirect('/')
}
