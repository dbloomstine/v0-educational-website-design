/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/funds/hedge-funds/middle-office',
        destination: '/funds/hedge-funds',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
