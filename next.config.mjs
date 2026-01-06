/** @type {import('next').NextConfig} */
const nextConfig = {
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
