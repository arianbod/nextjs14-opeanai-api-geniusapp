"use client";

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { nanoid } from 'nanoid';
import { AIPersonas } from '@/lib/Personas';
import toast from 'react-hot-toast';
import { serverLogger } from '@/server/logger';

const WEBSITE_USER = process.env.WEBSITE_USER || 'babagpt.ai';

const AssistantContext = createContext();

export const AssistantProvider = ({ children }) => {
    const { user } = useAuth();

    // UI States
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    // "IsLoading" used to display spinner or "Assistant typing"
    const [isLoading, setIsLoading] = useState(false);
    // Tracks if we are currently sending a message
    const [isSending, setIsSending] = useState(false);

    const [assistantChatId, setAssistantChatId] = useState(null);
    const [messages, setMessages] = useState([]);

    // Suppose we had a "welcome" message or a "notFirstTimeAssistant" flag
    // We'll remove or simplify that so we do NOT create a chat prematurely.
    // const [notFirstTimeAssistant, setNotFirstTimeAssistant] = useState(false);

    // Model configuration
    const supportModel = AIPersonas.find(
        (p) => p.key === 'claude-3-5-sonnet-latest-helper'
    );

    // Toggle assistant visibility, but DO NOT automatically create chat
    const toggleAssistant = useCallback(() => {
        setIsOpen((prev) => !prev);
        setIsMinimized(false);
        // DO NOT call initializeChat here
    }, []);

    // Minimize/maximize assistant panel
    const toggleMinimize = useCallback(() => {
        setIsMinimized((prev) => !prev);
    }, []);

    // We no longer auto-create the chat on opening. If you had
    // a useEffect that tried to open the assistant for non-auth users,
    // remove it or simply do not call initializeChat in it.

    // ————————————————————————————————————————————
    // If you still want a helper to create a chat manually, keep something like:
    // ————————————————————————————————————————————
    const createNewChat = useCallback(async () => {
        try {
            setIsLoading(true);
            // You can pass an empty string or some minimal text as "initialMessage"
            const body = {
                userId: WEBSITE_USER,
                initialMessage: 'Conversation started', // or just empty
                model: {
                    name: supportModel.name,
                    provider: supportModel.provider,
                    modelCodeName: supportModel.modelCodeName,
                    role: supportModel.role,
                },
            };

            const response = await fetch('/api/chat/createChat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error('Failed to create chat');
            }

            const result = await response.json();
            if (!result.success || !result.data?.id) {
                throw new Error('No valid chat ID returned');
            }

            setAssistantChatId(result.data.id);
            return result.data.id;
        } catch (error) {
            console.error('Error creating chat:', error);
            toast.error('Failed to create chat. Please try again.');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [supportModel]);

    // ————————————————————————————————————————————
    // A small helper to do up to 3 fetch attempts
    // ————————————————————————————————————————————
    async function tryFetchChatAPI(payload, attempt = 1) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error('Failed to get response');
            }
            return response;
        } catch (error) {
            if (attempt < 3) {
                // exponential backoff or small delay
                await new Promise((r) => setTimeout(r, 500 * attempt));
                return tryFetchChatAPI(payload, attempt + 1);
            } else {
                throw error;
            }
        }
    }

    // ————————————————————————————————————————————
    // Handle streaming response
    // ————————————————————————————————————————————
    const handleStreamResponse = async (response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (
                                data.content &&
                                typeof data.content === 'string' &&
                                !data.content.includes('streaming_started') &&
                                !data.content.includes('streaming_completed') &&
                                !data.content.includes('stream_ended')
                            ) {
                                accumulatedContent += data.content;
                                // Update the last assistant message with the new chunk
                                setMessages((prev) => {
                                    const newMessages = [...prev];
                                    const lastMessage = newMessages[newMessages.length - 1];

                                    if (lastMessage && lastMessage.role === 'assistant') {
                                        lastMessage.content = accumulatedContent;
                                    }
                                    return newMessages;
                                });
                            }
                        } catch (err) {
                            console.error('Error parsing SSE data:', err);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error processing stream:', error);
            throw error;
        }
    };

    // ————————————————————————————————————————————
    // Send message
    // ————————————————————————————————————————————
    const sendMessage = useCallback(
        async (content) => {
            if (!content?.trim() || isSending) return;

            try {
                setIsSending(true);

                // 1) Create a chat if we don't have one yet
                let tempChatId = assistantChatId;
                if (!tempChatId) {
                    tempChatId = await createNewChat();
                    if (!tempChatId) {
                        // If createNewChat fails, we cannot proceed
                        return;
                    }
                    setAssistantChatId(tempChatId);
                }

                // 2) Immediately add the user message to local state
                const userMessage = {
                    id: nanoid(),
                    role: 'user',
                    content: content.trim(),
                    timestamp: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, userMessage]);

                // 3) Optionally add a placeholder assistant message for streaming
                setMessages((prev) => [
                    ...prev,
                    {
                        id: nanoid(),
                        role: 'assistant',
                        content: '',
                        timestamp: new Date().toISOString(),
                    },
                ]);

                // 4) Actually call our /api/chat route with streaming
                const payload = {
                    userId: WEBSITE_USER,
                    chatId: tempChatId,
                    content: content.trim(),
                    persona: supportModel,
                };

                const response = await tryFetchChatAPI(payload);
                // 5) Stream the response chunks
                await handleStreamResponse(response);

            } catch (error) {
                console.error('Error sending message:', error);
                // Replace the placeholder assistant message with an error text
                setMessages((prev) => [
                    ...prev,
                    {
                        id: nanoid(),
                        role: 'assistant',
                        content:
                            'I apologize, but I encountered an error. Please try again or refresh the page if the issue persists.',
                        timestamp: new Date().toISOString(),
                    },
                ]);
                toast.error('Failed to process message');
            } finally {
                setIsSending(false);
            }
        },
        [assistantChatId, isSending, createNewChat, supportModel]
    );

    // ————————————————————————————————————————————
    // Reset assistant
    // ————————————————————————————————————————————
    const resetAssistant = useCallback(() => {
        setMessages([]);
        setAssistantChatId(null);
        setIsMinimized(false);
        setIsOpen(false);
        setIsLoading(false);
        setIsSending(false);
    }, []);

    const value = {
        isOpen,
        isMinimized,
        // Combine loading states if you want: isLoading or isSending
        isLoading: isLoading || isSending,
        messages,
        toggleAssistant,
        toggleMinimize,
        sendMessage,
        resetAssistant,
        // some UI can detect if user is logged in
        isLoggedIn: !!user,
    };

    return (
        <AssistantContext.Provider value={value}>
            {children}
        </AssistantContext.Provider>
    );
};

export const useAssistant = () => {
    const context = useContext(AssistantContext);
    if (!context) {
        throw new Error('useAssistant must be used within an AssistantProvider');
    }
    return context;
};

export default AssistantContext;
