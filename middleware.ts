// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supportedLanguages } from './lib/supportedLanguages';

const defaultLanguage = 'en';

// Define public routes that don't require authentication
const publicPaths = [
	'/api/auth/verify-email',
	'/api/auth/manage-email',
	'/api/auth/login',
	'/api/auth/register',
	'/images',
	'/favicon.ico',
	'/_next',
	'/api/images',
];

interface UserData {
	userId: string;
	token: string;
	tokenBalance: number;
	timestamp: number;
}

function getLanguageFromRequest(request: NextRequest): string {
	const pathname = request.nextUrl.pathname;

	// Check URL path first
	const pathnameLanguage = supportedLanguages.find(
		(lang) => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`
	);
	if (pathnameLanguage) return pathnameLanguage;

	// Check Accept-Language header
	const acceptLanguage = request.headers.get('Accept-Language');
	if (acceptLanguage) {
		const headerLanguage = acceptLanguage.split(',')[0].split('-')[0];
		if (supportedLanguages.includes(headerLanguage)) return headerLanguage;
	}

	return defaultLanguage;
}

function isPublicPath(pathname: string): boolean {
	return publicPaths.some((path) => pathname.startsWith(path));
}

function isAuthPath(pathname: string): boolean {
	// Check if the path is the auth page, accounting for language prefixes
	return (
		supportedLanguages.some(
			(lang) =>
				pathname === `/${lang}/auth` || pathname.startsWith(`/${lang}/auth/`)
		) ||
		pathname === '/auth' ||
		pathname.startsWith('/auth/')
	);
}

function validateSession(userData: UserData): boolean {
	const currentTime = new Date().getTime();
	const SESSION_DURATION = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds
	return currentTime - userData.timestamp < SESSION_DURATION;
}

function isAuthenticated(request: NextRequest): boolean {
	try {
		const userCookie = request.cookies.get('user');
		if (!userCookie?.value) return false;

		const userData: UserData = JSON.parse(userCookie.value);
		return validateSession(userData);
	} catch (error) {
		return false;
	}
}

export function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const language = getLanguageFromRequest(request);

	if (request.nextUrl.pathname.startsWith('/api/')) {
		return NextResponse.next();
	}
	// Handle static files and public routes
	if (pathname.startsWith('/images/') || isPublicPath(pathname)) {
		return NextResponse.next();
	}

	// Get authentication status
	const isUserAuthenticated = isAuthenticated(request);

	// Handle language-specific paths
	const hasLanguagePrefix = supportedLanguages.some(
		(lang) => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`
	);

	// If the user is not authenticated and not already on the auth page,
	// redirect to the auth page with the correct language prefix
	if (!isUserAuthenticated && !isAuthPath(pathname)) {
		return NextResponse.redirect(new URL(`/${language}/auth`, request.url));
	}

	// If authenticated but trying to access auth page, redirect to home
	if (isUserAuthenticated && isAuthPath(pathname)) {
		return NextResponse.redirect(new URL(`/${language}`, request.url));
	}

	// If no language prefix, add it while maintaining the current path
	if (!hasLanguagePrefix) {
		return NextResponse.redirect(
			new URL(`/${language}${pathname}`, request.url)
		);
	}

	// Proceed with the request
	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
