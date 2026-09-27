import { redirect } from 'next/navigation';

// Always send root to /login. The (app)/layout.tsx redirects to /dashboard if already authenticated.
export default function Home() {
  redirect('/login');
}
