import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이미지 호스팅',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
