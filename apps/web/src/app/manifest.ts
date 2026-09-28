import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Deutsch — Learn German',
    short_name: 'Deutsch',
    description: 'Learn German from your real class conversations',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#4f6ef7',
    orientation: 'portrait',
    icons: [
      { src: '/icon-gen/192', sizes: '192x192', type: 'image/png' },
      { src: '/icon-gen/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
