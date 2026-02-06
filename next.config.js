/** @type {import('next').NextConfig} */
const nextConfig = {

  turbopack: {},
  

  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/System Volume Information/**',
          '**/hiberfil.sys',
          '**/pagefile.sys',
          '**/swapfile.sys'
        ]
      }
    }
    return config
  }
}

module.exports = nextConfig