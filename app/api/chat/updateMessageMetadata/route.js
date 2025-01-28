// app/api/chat/updateMessageMetadata/route.js
import { NextResponse } from 'next/server';
import { getUserById } from '@/server/auth';
import { updateMessageMetadata } from '@/server/chat';

export async function POST(request) {
    try {
        const { messageId, userId, pinned, starred, notes } = await request.json();
        if (!messageId) {
            return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
        }
        // In your real app, you likely have user info from session or request
        // but here we'll just trust userId for the example:
        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const result = await updateMessageMetadata(userId, messageId, {
            pinned,
            starred,
            notes
        });
        return NextResponse.json(result);
    } catch (error) {
        console.error('updateMessageMetadata error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
