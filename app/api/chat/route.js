// app/api/chat/route.js
import { NextResponse } from 'next/server';
import { addMessageToChat, getChatMessages } from '@/server/chat';
import { getChatProvider } from '@/lib/ai-providers/server';
import { handleProviderError } from '@/lib/error-handlers';

export const config = {
    api: {
        responseLimit: false,
        bodyParser: {
            sizeLimit: '20mb'
        }
    }
};

const encoder = new TextEncoder();
const createSSEMessage = (data) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

// Constants
const BATCH_SIZE = 5;
const ALLOWED_FILE_TYPES = [
    'text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'text/html', 'text/css', 'application/javascript', 'application/json', 'text/markdown'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

async function processStream(controller, aiStream, provider, providerInstance, contentChunks = []) {
    let accumulatedContent = '';
    try {
        for await (const chunk of aiStream) {
            const contentChunk = providerInstance.extractContentFromChunk(chunk);
            if (contentChunk) {
                accumulatedContent += contentChunk;
                contentChunks.push(contentChunk);

                if (contentChunks.length >= BATCH_SIZE) {
                    controller.enqueue(
                        createSSEMessage({
                            type: 'chunk',
                            content: contentChunks.join(''),
                            provider
                        })
                    );
                    contentChunks.length = 0;
                }
            }
        }

        if (contentChunks.length > 0) {
            controller.enqueue(
                createSSEMessage({
                    type: 'chunk',
                    content: contentChunks.join(''),
                    provider
                })
            );
        }

        return accumulatedContent;
    } catch (error) {
        throw error;
    }
}

export async function POST(request) {
    const streamHeaders = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    };

    try {
        const { userId, chatId, content, persona, file } = await request.json();

        if (!userId || !chatId || (!content?.trim() && !file) || !persona) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // File validation
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: 'File size exceeds 20MB limit' },
                    { status: 400 }
                );
            }
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                return NextResponse.json(
                    { error: 'Unsupported file type' },
                    { status: 400 }
                );
            }
        }

        const providerInstance = getChatProvider(persona.provider);

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // ---------------------------
                    // CHANGED: do calls in series
                    // ---------------------------
                    const userMessage = await addMessageToChat(
                        userId,
                        chatId,
                        content?.trim() || `Uploaded a ${IMAGE_TYPES.includes(file?.type) ? 'image' : 'file'}`,
                        'user'
                    );
                    const previousMessages = await getChatMessages(userId, chatId);

                    controller.enqueue(createSSEMessage({
                        type: 'status',
                        content: 'streaming_started',
                        messageId: userMessage.id
                    }));

                    console.log("File Info:", {
                        file,
                        fileContent: file?.content,
                        fileType: file?.type,
                    });

                    const formattedMessages = providerInstance.formatMessages({
                        persona,
                        previousMessages,
                        fileContent: file?.content,
                        fileName: file?.name,
                        fileType: file?.type
                    });

                    const aiStream = await providerInstance.generateChatStream(
                        formattedMessages,
                        persona
                    );

                    const contentChunks = [];
                    const accumulatedContent = await processStream(
                        controller,
                        aiStream,
                        persona.provider,
                        providerInstance,
                        contentChunks
                    );

                    // Save the assistant message
                    const assistantMessage = await addMessageToChat(
                        userId,
                        chatId,
                        accumulatedContent,
                        'assistant'
                    );

                    controller.enqueue(createSSEMessage({
                        type: 'status',
                        content: 'streaming_completed',
                        messageId: assistantMessage.id
                    }));

                } catch (error) {
                    console.error('Streaming error:', error);
                    const { errorMessage } = await handleProviderError(error, persona.provider);

                    controller.enqueue(createSSEMessage({
                        type: 'error',
                        content: errorMessage || 'An error occurred during streaming',
                        error: {
                            message: error.message,
                            provider: persona.provider,
                            model: persona.modelCodeName,
                            code: error.code || 'UNKNOWN_ERROR',
                            providerError: error.isClaudeError || error.isGeminiError || error.isPerplexityError || false,
                            details: error.response?.data?.error || error.toString()
                        }
                    }));

                } finally {
                    controller.enqueue(createSSEMessage({
                        type: 'status',
                        content: 'stream_ended'
                    }));
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, { headers: streamHeaders });

    } catch (error) {
        console.error('Fatal error in chat API:', error);
        return NextResponse.json(
            {
                error: 'Failed to process chat request',
                details: error.message,
                provider: error.provider || 'unknown',
                code: error.code || 'UNKNOWN_ERROR',
                providerSpecific: {
                    isClaudeError: error.isClaudeError || false,
                    isGeminiError: error.isGeminiError || false,
                    isPerplexityError: error.isPerplexityError || false
                }
            },
            { status: 500 }
        );
    }
}
