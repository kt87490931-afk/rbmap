/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  /** /threeno/* 정적 이미지 — 이미지 호스팅용 URL, 장기 캐시 */
  async headers() {
    return [
      {
        source: '/threeno/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
