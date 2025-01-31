// app/api/conference-sms/route.js
import { NextResponse } from 'next/server';
import { sendConferenceSmS } from '@/server/services/conferenceSmsService';

export async function POST(request) {
    try {
        const body = await request.json();
        const { phoneNumber, conferenceUrl } = body;

        // Validate required fields
        if (!phoneNumber || !conferenceUrl) {
            return NextResponse.json(
                { error: 'Phone number and conference URL are required' },
                { status: 400 }
            );
        }

        // Validate phone number format (basic E.164 format check)
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return NextResponse.json(
                { error: 'Invalid phone number format. Must be in E.164 format (e.g., +1234567890)' },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(conferenceUrl);
        } catch {
            return NextResponse.json(
                { error: 'Invalid conference URL format' },
                { status: 400 }
            );
        }

        const result = await sendConferenceSmS(phoneNumber, conferenceUrl);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error, details: result.details },
                { status: 500 }
            );
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('API route error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}