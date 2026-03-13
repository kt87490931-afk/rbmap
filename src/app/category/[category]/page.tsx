import { redirect } from 'next/navigation'

/** /category/karaoke 등 → /gangnam (지역 페이지로 리다이렉트) */
export default async function CategoryRedirectPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const validCategories = ['karaoke', 'highpublic', 'shirtroom', 'public', 'jjomoh', 'bar', 'hostbar', 'room-salon']
  if (validCategories.includes(category)) {
    redirect('/gangnam')
  }
  redirect('/')
}
