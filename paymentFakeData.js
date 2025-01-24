const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PACKAGES = {
    BASIC: {
        name: 'Basic Pack',
        amount: 15,
        tokens: 1500
    },
    STANDARD: {
        name: 'Standard Pack',
        amount: 25,
        tokens: 2800
    },
    PREMIUM: {
        name: 'Premium Pack',
        amount: 50,
        tokens: 6000
    }
};

// Helper to generate random IP addresses
const generateRandomIP = () => {
    return Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.');
};

// Helper to generate realistic dates within a range
const generateRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to choose random package
const getRandomPackage = () => {
    const packages = Object.values(PACKAGES);
    return packages[Math.floor(Math.random() * packages.length)];
};

// Helper to generate session and payment intent IDs
const generateId = (prefix) => {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
};

async function seedPayments() {
    const userId = 'babagpt.ai'; // Your specified user ID
    let currentBalance = 100; // Starting balance
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-24');

    // Generate enough transactions to reach approximately $8550
    let totalAmount = 0;
    const transactions = [];

    while (totalAmount < 8550) {
        const package_ = getRandomPackage();
        const date = generateRandomDate(startDate, endDate);
        const isSuccessful = Math.random() > 0.1; // 90% success rate

        if (isSuccessful) {
            totalAmount += package_.amount;
        }

        const transaction = {
            id: generateId('pmt'),
            userId,
            type: 'TOKEN_PURCHASE',
            packageName: package_.name,
            amount: package_.amount,
            tokenAmount: package_.tokens,
            currency: 'usd',
            paymentMethod: 'card',
            previousBalance: currentBalance,
            expectedBalance: currentBalance + package_.tokens,
            finalBalance: isSuccessful ? currentBalance + package_.tokens : null,
            stripeSessionId: generateId('cs'),
            paymentIntentId: generateId('pi'),
            stripeCustomerId: 'cus_ABC123DEF456',
            status: isSuccessful ? 'COMPLETED' : 'FAILED',
            ipAddress: generateRandomIP(),
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            countryCode: 'US',
            createdAt: date,
            updatedAt: new Date(date.getTime() + 60000), // 1 minute later
            completedAt: isSuccessful ? new Date(date.getTime() + 60000) : null,
            metadata: JSON.stringify({
                platform: Math.random() > 0.5 ? 'web' : 'mobile',
                client_version: '1.0.0'
            })
        };

        if (isSuccessful) {
            currentBalance += package_.tokens;
        }

        transactions.push(transaction);
    }

    // Sort transactions by date
    transactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Insert all transactions
    try {
        for (const transaction of transactions) {
            await prisma.payment.create({
                data: transaction
            });
            console.log(`Created payment: ${transaction.id} - $${transaction.amount}`);
        }

        console.log(`\nSeeding completed successfully!`);
        console.log(`Total transactions: ${transactions.length}`);
        console.log(`Total amount: $${totalAmount}`);
        console.log(`Final token balance: ${currentBalance}`);

    } catch (error) {
        console.error('Error seeding payments:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding
seedPayments()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });