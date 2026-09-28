import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Required for standalone to correctly bundle workspace packages
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@german-app/shared'],
};

export default nextConfig;
