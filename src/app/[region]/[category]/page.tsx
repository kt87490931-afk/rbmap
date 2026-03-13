import { redirect } from 'next/navigation'
import { REGION_SLUGS, SLUG_TO_TYPE } from '@/lib/data/venues'

/** /gangnam/karaoke, /dongtan/category/karaoke 등 → 해당 지역 페이지로 */
export default async function RegionCategoryPage({
  params,
}: {
  params: Promise<{ region: string; category: string }>
}) {
  const { region, category } = await params
  const isValidRegion = (REGION_SLUGS as readonly string[]).includes(region)
  const isValidCategory = !!SLUG_TO_TYPE[category]
  if (isValidRegion) {
    redirect(`/${region}`)
  }
  redirect('/')
}
