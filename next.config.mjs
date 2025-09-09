/** @type {import('next').NextConfig} */
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // Vercel deployment optimizations
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    optimizeCss: true,
  },
  
  // Bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle splitting for production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Framework chunk for React/Next.js core
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\/]node_modules[\/](react|react-dom|scheduler|prop-types|use-subscription)[\/]/,
            priority: 40,
            enforce: true,
          },
          // Large libraries chunk
          lib: {
            test(module) {
              return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
            },
            name: 'lib',
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          // Common modules chunk
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          // Chart.js specific chunk (heavy library)
          charts: {
            test: /[\/]node_modules[\/](chart\.js|react-chartjs-2)[\/]/,
            name: 'charts',
            priority: 50,
            chunks: 'all',
          },
          // Radix UI components chunk
          radixui: {
            test: /[\/]node_modules[\/]@radix-ui[\/]/,
            name: 'radixui',
            priority: 45,
            chunks: 'all',
          },
        },
      };
    }
    
    // Tree shaking improvements (handled by Next.js)
    // config.optimization.usedExports = true;
    // config.optimization.sideEffects = false;
    
    // Reduce bundle size with module concatenation
    config.optimization.concatenateModules = true;
    
    return config;
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "replicate.com",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "fpjwdspidfdfewkkmgie.supabase.co",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Performance optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Reduce JavaScript bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  
  // API route rewrites (removed the problematic OpenAI rewrite)
  async rewrites() {
    return [
      // Add any internal rewrites here if needed
    ];
  },
};

export default withBundleAnalyzer(nextConfig);