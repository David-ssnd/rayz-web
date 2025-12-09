import { dirname } from 'path'
import { fileURLToPath } from 'url'
import createNextIntlPlugin from 'next-intl/plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@rayz/ui', '@rayz/types', '@rayz/database'],
  turbopack: {
    root: __dirname.replace(/apps[\\\/]frontend$/, ''),
  },
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
