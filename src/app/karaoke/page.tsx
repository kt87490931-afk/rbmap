import { redirect } from 'next/navigation'

/** /karaoke → /gangnam (가라오케 메인 지역으로 리다이렉트) */
export default async function KaraokeRedirectPage() {
  redirect('/gangnam')
}
