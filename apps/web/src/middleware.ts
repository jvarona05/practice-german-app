import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Browser or extensions sometimes prepend a 2-letter locale code (e.g. /de/login).
// This app has no locale routing — strip it and redirect to the bare path.
const LOCALE_PREFIX = /^\/([a-z]{2})(\/.*)?$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = pathname.match(LOCALE_PREFIX);
  if (match) {
    const rest = match[2] ?? '/';
    return NextResponse.redirect(new URL(rest, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
