'use client';

import { createContext, useContext, useState, useCallback } from 'react';
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
    const [isLoading, setIsLoading] = useState(false);
    // Added: Separate loading state for message sending
    const [isSending, setIsSending] = useState(false);

    // Chat States
    const [assistantChatId, setAssistantChatId] = useState(null);
    const [messages, setMessages] = useState([]);

    // Support model configuration
    const supportModel = AIPersonas.find(p => p.key === 'claude-3-5-sonnet-latest-helper');

    // Toggle assistant visibility
    const toggleAssistant = useCallback(() => {
        setIsOpen(prev => !prev);
        setIsMinimized(false);
        initializeChat()
    }, []);

    // Minimize/maximize assistant panel
    const toggleMinimize = useCallback(() => {
        setIsMinimized(prev => !prev);
    }, []);

    // Initialize chat session
    const initializeChat = useCallback(async () => {
        serverLogger("initialize", assistantChatId)
        // Only initialize if not already initialized
        if (assistantChatId || isLoading) return;

        try {
            setIsLoading(true);
            const tempChatId = nanoid();
            setAssistantChatId(tempChatId);

            // Create initial message
            const welcomeMessage = {
                id: nanoid(),
                role: 'assistant',
                content: user ?
                    "Hello! I'm your personal BabaGPT assistant. How can I help you today?" :
                    "Hi! I'm BabaGPT assistant. I can help you learn about our platform and features. Feel free to ask any questions!",
                timestamp: new Date().toISOString()
            };

            try {
                const response = await fetch('/api/chat/createChat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: WEBSITE_USER,
                        initialMessage: welcomeMessage.content,
                        model: {
                            name: supportModel.name,
                            provider: supportModel.provider,
                            modelCodeName: supportModel.modelCodeName,
                            role: supportModel.role
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to create chat');
                }

                setMessages([welcomeMessage]);
            } catch (error) {
                console.error('Error creating chat:', error);
                toast.error('Failed to initialize chat. Please try again.');
                setAssistantChatId(null);
            }
        } catch (error) {
            console.error('Error initializing assistant chat:', error);
            toast.error('Failed to initialize chat assistant');
            setAssistantChatId(null);
        } finally {
            setIsLoading(false);
        }
    }, [user, supportModel]);

    // Handle streaming response
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
                            if (data.content && typeof data.content === 'string' &&
                                !data.content.includes('streaming_started') &&
                                !data.content.includes('streaming_completed') &&
                                !data.content.includes('stream_ended')) {
                                accumulatedContent += data.content;
                                // Update the last message with accumulated content
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    const lastMessage = newMessages[newMessages.length - 1];
                                    if (lastMessage.role === 'assistant') {
                                        lastMessage.content = accumulatedContent;
                                    } else {
                                        newMessages.push({
                                            id: nanoid(),
                                            role: 'assistant',
                                            content: accumulatedContent,
                                            timestamp: new Date().toISOString()
                                        });
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

    // Send message to assistant
    const sendMessage = useCallback(async (content) => {
        if (!content?.trim() || !assistantChatId || isSending) return;

        try {
            setIsSending(true);
            // Add user message immediately
            const userMessage = {
                id: nanoid(),
                role: 'user',
                content: content.trim(),
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, userMessage]);

            // Add initial assistant message for streaming
            setMessages(prev => [...prev, {
                id: nanoid(),
                role: 'assistant',
                content: '',
                timestamp: new Date().toISOString()
            }]);

            // Send message to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: WEBSITE_USER,
                    chatId: assistantChatId,
                    content: content.trim(),
                    persona: supportModel,
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            // Handle streaming response
            await handleStreamResponse(response);

        } catch (error) {
            console.error('Error sending message:', error);
            // Add error message
            setMessages(prev => [...prev, {
                id: nanoid(),
                role: 'assistant',
                content: "I apologize, but I encountered an error. Please try again or refresh the page if the issue persists.",
                timestamp: new Date().toISOString()
            }]);
            toast.error('Failed to process message');
        } finally {
            setIsSending(false);
        }
    }, [assistantChatId, supportModel]);

    // Reset assistant state
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
        isLoading: isLoading || isSending, // Combine loading states for external consumers
        messages,
        toggleAssistant,
        toggleMinimize,
        initializeChat,
        sendMessage,
        resetAssistant,
        isLoggedIn: !!user
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