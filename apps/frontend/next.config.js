import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@rayz/ui', '@rayz/types'],
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'
    return [
      {
        source: '/api/auth/:path*',
        destination: `${backendUrl}/api/auth/:path*`,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
