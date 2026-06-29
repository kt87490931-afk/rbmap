import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '영상 호스팅',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
