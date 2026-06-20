
import type { NextConfig } from 'next';

const config: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const uploadProxyDestination =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://thinkthentalk.ir';

    return [
      {
        source: '/api/:path*',
        destination: `${uploadProxyDestination}/api/:path*`,
      },
      {
        source: '/images/:path*',
        destination: `${uploadProxyDestination}/uploads/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${uploadProxyDestination}/uploads/:path*`,
      },
    ];
  },
  images: {
    unoptimized: true, // Disable image optimization for localhost development
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'thinkthentalk.ir',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'thinkthentalk.ir',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.thinkthentalk.ir',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'www.thinkthentalk.ir',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default config;
