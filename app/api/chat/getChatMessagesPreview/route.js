// app/api/chat/getChatMessagesPreview/route.js
import { getChatMessagesPreview } from '@/server/chat';
import { getUserFromRequest } from '@/server/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, chatId } = body;

        if (!chatId) {
            return NextResponse.json(
                { error: 'Chat ID is required' },
                { status: 400 }
            );
        }

        const messages = await getChatMessagesPreview(userId, chatId);

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Error in getChatMessagesPreview route:', error);

        // Handle specific errors
        if (error.message === 'Chat not found or unauthorized') {
            return NextResponse.json(
                { error: 'Chat not found or unauthorized' },
                { status: 404 }
            );
        }

        if (error.message === 'Missing required parameters') {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}