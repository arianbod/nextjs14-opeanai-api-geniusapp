// @ts-nocheck
'use server';

import prisma from '@/prisma/db';
import { getUserById } from './auth';

interface LanguageEntry {
	code: string;
	name: string;
	lastUsed: string;
	useCount: number;
}

interface UserAgentEntry {
	browser: string;
	os: string;
	device: string;
	timestamp: string;
}
// Default preferences for website user
const DEFAULT_PREFERENCES = {
	currentLanguage: 'en',
	isSidebarPinned: true,
	languageHistory: [
		{
			code: 'en',
			name: 'English',
			lastUsed: new Date().toISOString(),
			useCount: 1,
		},
	],
};
// Added retry mechanism for database operations
async function withRetry<T>(
	operation: () => Promise<T>,
	retries = 3
): Promise<T> {
	for (let i = 0; i < retries; i++) {
		try {
			return await operation();
		} catch (error) {
			if (i === retries - 1) throw error;
			await new Promise((resolve) =>
				setTimeout(resolve, 1000 * Math.pow(2, i))
			);
		}
	}
	throw new Error('All retries failed');
}

export async function initializeUserPreferences(userId: string) {
	const user = await getUserById(userId);
	if (!user) throw new Error('User not found');

	return await withRetry(async () => {
		// First check if preferences already exist
		const existing = await prisma.userPreferences.findUnique({
			where: { userId: user.id },
		});

		if (existing) return existing;

		return await prisma.userPreferences.create({
			data: {
				userId: user.id,
				currentLanguage: 'en',
				isSidebarPinned: true,
				languageHistory: [
					{
						code: 'en',
						name: 'English',
						lastUsed: new Date().toISOString(),
						useCount: 1,
					},
				],
				userAgentHistory: [],
			},
		});
	});
}

export async function getUserPreferences(userId: string) {
	// Handle website user
	if (userId === process.env.NEXT_PUBLIC_WEBSITE_USER) {
		return DEFAULT_PREFERENCES;
	}

	const user = await getUserById(userId);
	if (!user) {
		// Return default preferences instead of throwing error
		return DEFAULT_PREFERENCES;
	}

	return await withRetry(async () => {
		let preferences = await prisma.userPreferences.findUnique({
			where: { userId },
		});

		if (!preferences) {
			preferences = await prisma.userPreferences.create({
				data: {
					userId,
					...DEFAULT_PREFERENCES,
				},
			});
		}

		return preferences;
	});
}

// Added new function to save entire preferences object
export async function saveUserPreferences(userId: string, preferences: any) {
	const user = await getUserById(userId);
	if (!user) throw new Error('User not found');

	return await withRetry(async () => {
		return await prisma.userPreferences.update({
			where: { userId: user.id },
			data: {
				...preferences,
				updatedAt: new Date(),
			},
		});
	});
}

export async function updateLanguagePreference(
	userId: string,
	languageCode: string,
	languageName: string
) {
	const user = await getUserById(userId);
	if (!user) throw new Error('User not found');

	return await withRetry(async () => {
		const preferences = await getUserPreferences(userId);
		const languageHistory = [
			...(preferences.languageHistory as LanguageEntry[]),
		];

		const existingIndex = languageHistory.findIndex(
			(l) => l.code === languageCode
		);

		if (existingIndex >= 0) {
			languageHistory[existingIndex] = {
				...languageHistory[existingIndex],
				lastUsed: new Date().toISOString(),
				useCount: languageHistory[existingIndex].useCount + 1,
			};
		} else {
			languageHistory.push({
				code: languageCode,
				name: languageName,
				lastUsed: new Date().toISOString(),
				useCount: 1,
			});
		}

		return await prisma.userPreferences.update({
			where: { userId: user.id },
			data: {
				currentLanguage: languageCode,
				languageHistory: languageHistory,
				updatedAt: new Date(),
			},
		});
	});
}

export async function updateSidebarPinned(userId: string, isPinned: boolean) {
	const user = await getUserById(userId);
	if (!user) throw new Error('User not found');

	return await withRetry(async () => {
		return await prisma.userPreferences.update({
			where: { userId: user.id },
			data: {
				isSidebarPinned: isPinned,
				updatedAt: new Date(),
			},
		});
	});
}

export async function recordUserAgent(userId: string, userAgent: string) {
	const user = await getUserById(userId);
	if (!user) throw new Error('User not found');

	return await withRetry(async () => {
		const preferences = await getUserPreferences(userId);
		const userAgentHistory = [
			...(preferences.userAgentHistory as UserAgentEntry[]),
		];

		const ua = {
			browser:
				userAgent.match(
					/(?:firefox|opera|safari|chrome|msie|trident(?=\/))\/?\s*(\d+)/i
				)?.[1] || 'Unknown',
			os: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
			device: /mobile|tablet|android/i.test(userAgent) ? 'Mobile' : 'Desktop',
			timestamp: new Date().toISOString(),
		};

		userAgentHistory.push(ua);

		if (userAgentHistory.length > 50) {
			userAgentHistory.shift();
		}

		return await prisma.userPreferences.update({
			where: { userId: user.id },
			data: {
				userAgentHistory: userAgentHistory,
				updatedAt: new Date(),
			},
		});
	});
}
