// app/api/conference-notification/route.js
import { NextResponse } from 'next/server';
import { sendConferenceNotification } from '@/server/services/conferenceEmailService';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, conferenceUrl, messages } = body;

        // Validate required fields
        if (!email || !conferenceUrl) {
            return NextResponse.json(
                { error: 'Email and conference URL are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
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

        // Validate messages format if provided
        if (messages && (!Array.isArray(messages) || !messages.every(msg =>
            msg &&
            typeof msg === 'object' &&
            typeof msg.content === 'string' &&
            ['user', 'assistant'].includes(msg.role) &&
            typeof msg.timestamp === 'string'))) {
            return NextResponse.json(
                { error: 'Invalid messages format' },
                { status: 400 }
            );
        }

        const result = await sendConferenceNotification(email, conferenceUrl, messages);

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