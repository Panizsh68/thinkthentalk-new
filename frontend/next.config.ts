import type { NextConfig } from 'next';

const getBackendOrigin = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return 'http://localhost:3000';
  }

  try {
    return new URL(apiUrl).origin;
  } catch {
    if (apiUrl.startsWith('/')) {
      return 'http://localhost:3000';
    }
    return apiUrl.replace(/\/api\/?$/, '');
  }
};

const backendOrigin = getBackendOrigin();

const config: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
      {
        source: '/images/:path*',
        destination: '/api/upload/files/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: '/api/upload/files/:path*',
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
        hostname: 'thinkthentalk.ir',
        port: '',
        pathname: '/api/upload/files/**',
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
        hostname: 'www.thinkthentalk.ir',
        port: '',
        pathname: '/api/upload/files/**',
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
