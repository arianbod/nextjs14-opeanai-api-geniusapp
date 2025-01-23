// makeauser.js
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function hashValue(value) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(value, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

async function createWebsiteUser() {
    try {
        const websiteUser = await prisma.user.create({
            data: {
                id: 'babagpt.ai',
                token: await hashValue('pTbuKlPUBURRbFa2loyaJR5i769K4CIfW3Egx811rFw7ES4b3l6GJAEyyG7OMlpx'),
                animalSelection: await hashValue('website|user|default'),
                tokenBalance: 999999999,
                status: 'ACTIVE',
                statusReason: 'Website visitor chat user',
                isEmailVerified: true,
                loginAttempts: 0,
                // Removed orderId as it's auto-incremented
                statusHistory: [{
                    status: 'ACTIVE',
                    reason: 'Website visitor user created',
                    timestamp: new Date().toISOString()
                }],
                userPreferences: {
                    create: {
                        currentLanguage: 'en',
                        isSidebarPinned: true,
                        languageHistory: [{
                            code: 'en',
                            name: 'English',
                            lastUsed: new Date().toISOString(),
                            useCount: 1
                        }]
                    }
                }
            }
        });

        console.log('Website user created successfully:', websiteUser);
    } catch (error) {
        console.error('Error creating website user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createWebsiteUser();