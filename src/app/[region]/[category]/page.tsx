import { redirect } from 'next/navigation'
import { SLUG_TO_TYPE } from '@/lib/data/venues'
import { getRegionBySlugServer } from '@/lib/data/regions'

/** /gangnam/karaoke, /dongtan/category/karaoke 등 → 해당 지역 페이지로 */
export default async function RegionCategoryPage({
  params,
}: {
  params: Promise<{ region: string; category: string }>
}) {
  const { region, category } = await params
  const regionData = await getRegionBySlugServer(region)
  const isValidCategory = !!SLUG_TO_TYPE[category]
  if (regionData && !regionData.coming) {
    redirect(`/${region}`)
  }
  redirect('/')
}
