import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/contexts/auth';

export const metadata: Metadata = {
  title: 'Deutsch',
  description: 'Learn German from your real class conversations',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Deutsch',
  },
  formatDetection: { telephone: false },
  icons: {
    apple: '/icon-gen/192',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f6ef7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
        <Script id="register-sw" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
          }
        `}</Script>
      </body>
    </html>
  );
}
