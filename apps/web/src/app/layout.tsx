import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth';

export const metadata: Metadata = {
  title: 'German App',
  description: 'Learn German from your real class conversations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
