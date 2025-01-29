// sseLogic.js
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

/**
 * generateResponse: SSE-based text generation
 *
 * - We create a local "temp" user message
 * - We send "tempId" to the server
 * - The server returns an SSE event "user_message_created" with the real ID
 * - We unify local ID with real ID so pin/star/notes work immediately
 */
export async function generateResponse({
    content,
    fileData,
    user,
    activeChat,
    isGenerating,
    setIsGenerating,
    setActiveChat,
    setMessages,
    router,
    fetchChats,
    formatLaTeXContent
}) {
    if (
        (!content?.trim() && !fileData) ||
        !user?.userId ||
        isGenerating ||
        !activeChat?.model
    ) {
        toast.error('Please provide text/file or ensure a model is selected');
        return;
    }

    // create local temp ID
    const tempUserId = nanoid();

    // block double submission
    setIsGenerating(true);

    try {
        let chatId = activeChat.id;
        let newChat = false;

        // If no active chat, create it first
        if (!chatId) {
            const modelData = {
                name: activeChat.model.name,
                provider: activeChat.model.provider,
                modelCodeName: activeChat.model.modelCodeName,
                role: activeChat.model.role
            };
            const response = await fetch('/api/chat/createChat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.userId,
                    initialMessage: content,
                    model: modelData
                })
            });

            if (!response.ok) throw new Error('Failed to create chat');
            const data = await response.json();
            chatId = data.data?.id || data.id;
            newChat = true;
            // update activeChat state
            setActiveChat((prev) => ({ ...prev, id: chatId }));
            // push new route
            window.history.pushState(null, '', `/chat/${chatId}`);
        }

        // 1) local user message with temp ID
        setMessages((prev) => [
            ...prev,
            {
                id: tempUserId,
                role: 'user',
                content: formatLaTeXContent(content.trim()),
                timestamp: new Date().toISOString(),
                pinned: false,
                starred: false,
                notes: ''
            }
        ]);

        // 2) local assistant placeholder
        const tempAssistantId = nanoid();
        setMessages((prev) => [
            ...prev,
            {
                id: tempAssistantId,
                role: 'assistant',
                content: '',
                timestamp: new Date().toISOString(),
                pinned: false,
                starred: false,
                notes: ''
            }
        ]);

        // 3) SSE request
        const messageResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.userId,
                chatId,
                tempId: tempUserId, // pass the local temp ID
                content: content.trim(),
                persona: activeChat.model,
                provider: activeChat.provider,
                file: fileData
            })
        });
        if (!messageResponse.ok) {
            throw new Error('Failed to generate response');
        }

        // read SSE
        const reader = messageResponse.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedAssistantContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;

                try {
                    const data = JSON.parse(line.slice(6));

                    if (data.type === 'user_message_created') {
                        // unify the local user message ID with DB real ID
                        const { realId, tempId } = data;
                        if (realId && tempId) {
                            setMessages((prev) =>
                                prev.map((m) => (m.id === tempId ? { ...m, id: realId } : m))
                            );
                        }
                    } else if (data.type === 'chunk' && data.content) {
                        // accumulating AI chunk text
                        accumulatedAssistantContent += data.content;
                        // update local assistant
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === tempAssistantId
                                    ? { ...m, content: accumulatedAssistantContent }
                                    : m
                            )
                        );
                    } else if (data.type === 'error') {
                        toast.error(data.content || 'SSE error');
                    } else if (data.type === 'status') {
                        // e.g. "streaming_completed"
                        if (data.content === 'streaming_completed') {
                            // optionally unify assistant ID if needed
                            // data.messageId => real assistant ID from DB
                        }
                    }
                } catch (err) {
                    console.error('Error parsing SSE chunk data:', err);
                }
            }
        }

        // optional: refresh chat list
        await fetchChats();
    } catch (error) {
        console.error('Error in SSE flow:', error);
        toast.error(`Failed to process message: ${error.message}`);
        // remove local user message
        setMessages((prev) => prev.filter((m) => m.id !== tempUserId));
    } finally {
        setIsGenerating(false);
    }
}

/**
 * generateImage: calls the /api/chat/generateImage
 * Similar pattern: create local user message, etc.
 */
export async function generateImage({
    prompt,
    options,
    user,
    activeChat,
    imageGeneration,
    setImageGeneration,
    setMessages,
    toast,
    nanoid
}) {
    if (!user?.userId || !activeChat?.id) {
        toast.error('Please log in and have an active chat first');
        return null;
    }
    try {
        setImageGeneration((prev) => ({
            ...prev,
            isGenerating: true,
            prompt,
            url: null,
            error: null,
            options: {
                ...prev.options,
                ...options
            }
        }));

        // local user message
        const tempUserId = nanoid();
        setMessages((prev) => [
            ...prev,
            {
                id: tempUserId,
                role: 'user',
                content: `Generate image: ${prompt}`,
                timestamp: new Date().toISOString(),
                pinned: false,
                starred: false,
                notes: ''
            }
        ]);

        // call server
        const response = await fetch('/api/chat/generateImage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                options: { ...imageGeneration.options, ...options },
                userId: user.userId,
                chatId: activeChat.id
            })
        });

        const data = await response.json();
        if (!response.ok || data.error) {
            throw new Error(data.error || 'Failed to generate image');
        }

        if (data.imageUrl) {
            // local assistant image
            const tempAssistantId = nanoid();
            setMessages((prev) => [
                ...prev,
                {
                    id: tempAssistantId,
                    role: 'assistant',
                    content: [
                        '**Generated Image:**\n\n',
                        `![Generated Image](${data.imageUrl})\n\n`,
                        `I generated an image for your prompt: "${prompt}"`
                    ].join(''),
                    timestamp: new Date().toISOString(),
                    pinned: false,
                    starred: false,
                    notes: ''
                }
            ]);

            setImageGeneration((prev) => ({
                ...prev,
                isGenerating: false,
                url: data.imageUrl,
                error: null
            }));
            return data.imageUrl;
        } else {
            throw new Error('No imageUrl returned');
        }
    } catch (error) {
        console.error('Image generation error:', error);
        setImageGeneration((prev) => ({
            ...prev,
            isGenerating: false,
            error: error.message
        }));
        // local assistant error message
        const tempErrId = nanoid();
        setMessages((prev) => [
            ...prev,
            {
                id: tempErrId,
                role: 'assistant',
                content: `Sorry, failed to generate image: ${error.message}`,
                timestamp: new Date().toISOString(),
                pinned: false,
                starred: false,
                notes: ''
            }
        ]);
        toast.error('Failed to generate image');
        return null;
    }
}
