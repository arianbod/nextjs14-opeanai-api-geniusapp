'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AIPersonas } from '@/lib/Personas';
import { getProviderConfig } from '@/lib/ai-providers';
import { nanoid } from 'nanoid';
import { serverLogger } from '@/server/logger';

// A helper to apply some LaTeX conversions if needed
const formatLaTeXContent = (content) => {
  if (!content) return content;

  // Temporarily replace code blocks
  const codeBlocks = [];
  content = content.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Example math replacements:
  content = content.replace(/Σ[ᵢi]₌₁([³⁵⁴ⁿ\d])\s*([^=\n]+)/g, '$$\\sum_{i=1}^{$1} $2$$');
  content = content.replace(/∫([^d]+)dx(?!\))/g, '$$\\int $1 dx$$');

  // Replace ```math blocks with $$...$$
  content = content.replace(/```math\n([\s\S]*?)```/g, '$$\n$1\n$$');

  // Turn inline $...$ into $$...$$ if needed
  content = content.replace(/([^$])\$([^$\n]+)\$([^$])/g, '$1$$$2$$$3');

  // Restore code blocks
  codeBlocks.forEach((block, i) => {
    content = content.replace(`__CODE_BLOCK_${i}__`, block);
  });

  return content;
};

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();

  // -----------------------------
  // Core States
  // -----------------------------
  const [model, setModel] = useState(null);
  const [activeChat, setActiveChat] = useState({
    id: null,
    title: '',
    model: null,
    engine: '',
    role: '',
    name: '',
    avatar: '',
    provider: '',
    modelCodeName: '',
    modelAllowed: {}
  });
  const [messages, setMessages] = useState([]);
  const [chatList, setChatList] = useState([]);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [showChatPreview, setShowChatPreview] = useState(false);
  const [previewChatId, setPreviewChatId] = useState(null);
  const [previewMessages, setPreviewMessages] = useState({});
  const [previewLoading, setPreviewLoading] = useState(false);

  // Image generation states
  const [imageGeneration, setImageGeneration] = useState({
    isGenerating: false,
    prompt: null,
    url: null,
    error: null,
    options: {}
  });

  // If user toggles “force image generation”
  const [forceImageGeneration, setForceImageGeneration] = useState(false);

  // Refs
  const messageQueueRef = useRef(new Set());
  const pendingMessagesRef = useRef(new Map());

  // -----------------------------
  // Utility: Reformat existing messages
  // -----------------------------
  const reformatExistingMessages = useCallback(() => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => ({
        ...msg,
        content: formatLaTeXContent(msg.content)
      }))
    );
  }, []);

  // -----------------------------
  // Chat List / Previews
  // -----------------------------
  const fetchPreviewMessages = useCallback(
    async (chatId) => {
      if (!chatId || !user?.userId) {
        serverLogger('No user or chatId in fetchPreviewMessages');
        return;
      }

      setPreviewLoading(true);
      try {
        const response = await fetch('/api/chat/getChatMessagesPreview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.userId, chatId })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch preview messages');
        }

        const { messages } = await response.json();
        if (Array.isArray(messages)) {
          setPreviewMessages((prev) => ({
            ...prev,
            [chatId]: messages
          }));
        }
      } catch (error) {
        console.error('Error fetching preview messages:', error);
        toast.error('Failed to load chat preview');
        setPreviewMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages[chatId];
          return newMessages;
        });
      } finally {
        setPreviewLoading(false);
      }
    },
    [user?.userId]
  );

  const toggleChatPreview = useCallback(
    (chatId) => {
      if (!chatId) {
        setShowChatPreview(false);
        setPreviewChatId(null);
        return;
      }

      if (previewChatId === chatId) {
        setShowChatPreview(false);
        setPreviewChatId(null);
      } else {
        setShowChatPreview(true);
        setPreviewChatId(chatId);
        // Only fetch if we don't already have them
        if (!previewMessages[chatId]) {
          fetchPreviewMessages(chatId).catch((error) => {
            console.error('Failed to fetch preview messages:', error);
            setShowChatPreview(false);
            setPreviewChatId(null);
          });
        }
      }
    },
    [previewChatId, previewMessages, fetchPreviewMessages]
  );

  const fetchChats = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const response = await fetch('/api/chat/getChatList', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId })
      });
      if (!response.ok) {
        toast.error('Failed to load chat list');
        return;
      }
      const data = await response.json();
      setChatList(data.chats || []);
    } catch (error) {
      console.error('Error fetching chat list:', error);
      toast.error('Failed to load chat list');
    }
  }, [user?.userId]);

  // -----------------------------
  // Load & Manage a Single Chat
  // -----------------------------
  const handleModelSelect = useCallback(
    (selectedModel) => {
      if (!selectedModel) {
        console.error('No model selected');
        return;
      }
      setModel(selectedModel);
      setActiveChat({
        id: null,
        title: '',
        model: selectedModel,
        engine: selectedModel.engine,
        role: selectedModel.role,
        name: selectedModel.name,
        avatar: selectedModel.avatar,
        provider: selectedModel.provider,
        modelCodeName: selectedModel.modelCodeName,
        modelAllowed: selectedModel.allowed
      });
      setMessages([]);
      router.prefetch('/chat');
    },
    [router]
  );

  const fetchChatData = useCallback(
    async (chatId) => {
      if (!chatId || !user?.userId) return;
      try {
        setIsLoading(true);
        const response = await fetch('/api/chat/getChatInfo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.userId, chatId })
        });
        const { chatDataInfo } = await response.json();
        serverLogger('chatDataInfo in client side:', chatDataInfo);

        if (!chatDataInfo?.modelCodeName) {
          throw new Error('Invalid chat info received');
        }

        const selectedModel =
          AIPersonas.find(
            (p) => p.modelCodeName === chatDataInfo.modelCodeName
          ) || AIPersonas.find((p) => p.provider === chatDataInfo.provider);

        if (!selectedModel) {
          // fallback to default model for that provider
          const defaultModel = AIPersonas.find(
            (p) =>
              p.provider === chatDataInfo.provider &&
              p.modelCodeName === getProviderConfig(chatDataInfo.provider).defaultModel
          );
          if (!defaultModel) {
            throw new Error('No compatible model found');
          }
          setActiveChat({
            id: chatDataInfo.id,
            title: chatDataInfo.title || '',
            model: defaultModel,
            engine: defaultModel.engine,
            role: defaultModel.role,
            name: defaultModel.name,
            avatar: defaultModel.avatar,
            provider: chatDataInfo.provider,
            modelCodeName: defaultModel.modelCodeName,
            modelAllowed: defaultModel.allowed
          });
          setModel(defaultModel);
        } else {
          setActiveChat({
            id: chatDataInfo.id,
            title: chatDataInfo.title || '',
            model: selectedModel,
            engine: selectedModel.engine,
            role: selectedModel.role,
            name: selectedModel.name,
            avatar: selectedModel.avatar,
            provider: chatDataInfo.provider,
            modelCodeName: selectedModel.modelCodeName,
            modelAllowed: selectedModel.allowed
          });
          setModel(selectedModel);
        }

        // Fetch messages
        const messagesResponse = await fetch('/api/chat/getChatMessages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.userId, chatId })
        });
        if (!messagesResponse.ok) {
          throw new Error('Failed to fetch chat messages');
        }
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages || []);
        reformatExistingMessages();
      } catch (error) {
        console.error('Error fetching chat data:', error);
        toast.error('Failed to load chat data. Please try again.');
        resetChat();
        if (error.response?.status === 404) {
          router.prefetch('/chat');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [user?.userId, router, reformatExistingMessages]
  );

  const resetChat = useCallback(() => {
    setActiveChat({
      id: null,
      title: '',
      model: null,
      engine: '',
      role: '',
      name: '',
      avatar: '',
      provider: '',
      modelCodeName: '',
      modelAllowed: {}
    });
    setMessages([]);
    setModel(null);
  }, []);

  // -----------------------------
  // Local Messages
  // -----------------------------
  const addMessage = useCallback((newMessage) => {
    if (!newMessage) {
      console.error('Missing message');
      return null;
    }
    const messageToAdd = {
      id: newMessage.id || nanoid(),
      role: newMessage.role || 'user',
      content: formatLaTeXContent(newMessage.content) || '',
      timestamp: newMessage.timestamp || new Date().toISOString(),
      pinned: newMessage.pinned || false,
      starred: newMessage.starred || false,
      notes: newMessage.notes || ''
    };
    setMessages((prev) => [...prev, messageToAdd]);
    return messageToAdd;
  }, []);

  const updateMessage = useCallback((messageId, newContent) => {
    if (!messageId) return;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content: formatLaTeXContent(newContent) || ''
            }
          : msg
      )
    );
  }, []);

  const removeMessage = useCallback((messageId) => {
    if (!messageId) return;
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  // -----------------------------
  // Pin / Star / Notes methods
  // -----------------------------
  const togglePinMessage = useCallback(
    async (messageId) => {
      if (!user?.userId) {
        toast.error('Please log in first');
        return;
      }
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) {
        toast.error('Message not found in local state');
        return;
      }
      const newPinnedValue = !msg.pinned;

      try {
        const res = await fetch('/api/chat/updateMessageMetadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.userId,
            messageId,
            pinned: newPinnedValue
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update pinned status');
        }
        // Update local state
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, pinned: newPinnedValue } : m
          )
        );
        toast.success(`Message ${newPinnedValue ? 'pinned' : 'unpinned'}`);
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      }
    },
    [user, messages]
  );

  const toggleStarMessage = useCallback(
    async (messageId) => {
      if (!user?.userId) {
        toast.error('Please log in first');
        return;
      }
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) {
        toast.error('Message not found in local state');
        return;
      }
      const newStarredValue = !msg.starred;

      try {
        const res = await fetch('/api/chat/updateMessageMetadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.userId,
            messageId,
            starred: newStarredValue
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update starred status');
        }
        // Update local state
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, starred: newStarredValue } : m
          )
        );
        toast.success(`Message ${newStarredValue ? 'starred' : 'unstarred'}`);
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      }
    },
    [user, messages]
  );

  const updateMessageNotes = useCallback(
    async (messageId, newNotes) => {
      if (!user?.userId) {
        toast.error('Please log in first');
        return;
      }
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) {
        toast.error('Message not found in local state');
        return;
      }

      try {
        const res = await fetch('/api/chat/updateMessageMetadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.userId,
            messageId,
            notes: newNotes
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update notes');
        }
        // Update local state
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, notes: newNotes } : m
          )
        );
        toast.success('Message notes updated');
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      }
    },
    [user, messages]
  );

  // -----------------------------
  // Generate Text (SSE) 
  // -----------------------------
  const generateResponse = async (content, fileData = null) => {
    if ((!content?.trim() && !fileData) || !user?.userId || isGenerating || !activeChat?.model) {
      toast.error('Please provide text/file or ensure a model is selected');
      return;
    }

    const messageId = nanoid();
    if (messageQueueRef.current.has(messageId)) {
      console.warn('Message already in queue:', messageId);
      return;
    }
    setIsGenerating(true);
    messageQueueRef.current.add(messageId);
    pendingMessagesRef.current.set(messageId, content.trim());

    try {
      let chatId = activeChat.id;
      let newChat = false;

      // If no active chat, create a new one first
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
        // Adjust if your server returns { data: {id:...} } or just {id:...}
        chatId = data.data?.id || data.id;
        newChat = true;
        setActiveChat((prev) => ({ ...prev, id: chatId }));
        window.history.pushState(null, '', `/chat/${chatId}`);
      }

      // Locally add the user message
      const userMessage = {
        id: messageId,
        role: 'user',
        content: formatLaTeXContent(content.trim()),
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add an empty assistant message
      const assistantMsgId = nanoid();
      const assistantMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // SSE request
      const messageResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          chatId,
          content: content.trim(),
          persona: activeChat.model,
          provider: activeChat.provider,
          file: fileData,
          messageId
        })
      });
      if (!messageResponse.ok) {
        throw new Error('Failed to generate response');
      }

      const reader = messageResponse.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

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
                updateMessage(assistantMsgId, accumulatedContent);
              }
            } catch (err) {
              console.error('Error parsing SSE data:', err);
            }
          }
        }
      }

      await fetchChats();
    } catch (error) {
      console.error('Error in message flow:', error);
      // remove the user message from local if failed
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.error(`Failed to process message: ${error.message}`);
    } finally {
      messageQueueRef.current.delete(messageId);
      pendingMessagesRef.current.delete(messageId);
      setIsGenerating(false);
    }
  };

  // -----------------------------
  // Generate Image
  // -----------------------------
  const generateImage = async (prompt, options = {}) => {
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

      // user message
      const userMsg = {
        id: nanoid(),
        role: 'user',
        content: `Generate image: ${prompt}`,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMsg]);

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
        // assistant message with an image
        const assistantMsg = {
          id: nanoid(),
          role: 'assistant',
          content: [
            '**Generated Image:**\n\n',
            `![Generated Image](${data.imageUrl})\n\n`,
            `I've generated an image based on your prompt: "${prompt}"`
          ].join(''),
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, assistantMsg]);

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
      // assistant error
      const errMsg = {
        id: nanoid(),
        role: 'assistant',
        content: `I encountered an error generating the image: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errMsg]);
      toast.error('Failed to generate image');
      return null;
    }
  };

  const retryImageGeneration = async () => {
    if (imageGeneration.prompt) {
      return generateImage(imageGeneration.prompt, imageGeneration.options);
    }
  };

  const updateImageOptions = (newOptions) => {
    setImageGeneration((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        ...newOptions
      }
    }));
  };

  // If forceImageGeneration = true => call generateImage; else generateResponse
  const processUserMessage = (content, fileData) => {
    if (!content.trim() && !fileData) {
      toast.error('Please enter text or upload a file');
      return;
    }
    if (!model) {
      toast.error('Please select a model first');
      return;
    }
    if (forceImageGeneration) {
      generateImage(content);
    } else {
      generateResponse(content, fileData);
    }
  };

  // -----------------------------
  // Searching
  // -----------------------------
  const toggleSearch = useCallback(() => setIsSearchOpen((prev) => !prev), []);
  const filteredMessages = useCallback(() => {
    return messages.filter((message) => {
      const matchesSearch = message.content
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter = searchFilter === 'all' || message.role === searchFilter;
      return matchesSearch && matchesFilter;
    });
  }, [messages, searchTerm, searchFilter]);

  // -----------------------------
  // Effects
  // -----------------------------
  // Fetch chat list on mount or user change
  useEffect(() => {
    if (user?.userId) {
      fetchChats();
    }
  }, [user?.userId, fetchChats]);

  // If there's a chatId param and no active chat, set it
  useEffect(() => {
    if (params?.chatId && user?.userId && !activeChat.id) {
      if (params.chatId.match(/^[a-zA-Z0-9-_]+$/)) {
        setActiveChat((prev) => ({ ...prev, id: params.chatId }));
      }
    }
  }, [params?.chatId, user?.userId, activeChat.id]);

  // When activeChat changes, if messages are empty, fetch the data
  useEffect(() => {
    if (params?.chatId && activeChat?.id && user?.userId && messages.length === 0) {
      fetchChatData(activeChat.id);
    }
  }, [params?.chatId, activeChat?.id, user?.userId, messages.length, fetchChatData]);

  // -----------------------------
  // Expose context values
  // -----------------------------
  const values = {
    // model selection
    model,
    setModel,

    // active chat
    activeChat,
    setActiveChat,

    // messages
    messages,
    setMessages,
    chatList,

    // UI states
    isLoading,
    isGenerating,

    // searching
    searchTerm,
    setSearchTerm,
    searchFilter,
    setSearchFilter,
    isSearchOpen,
    toggleSearch,
    filteredMessages,

    // chat methods
    handleModelSelect,
    fetchChatData,
    resetChat,

    // message methods
    addMessage,
    updateMessage,
    removeMessage,

    // pin/star/notes
    togglePinMessage,
    toggleStarMessage,
    updateMessageNotes,

    // SSE generation
    generateResponse,
    processUserMessage,

    // image generation
    imageGeneration,
    generateImage,
    retryImageGeneration,
    updateImageOptions,
    forceImageGeneration,
    setForceImageGeneration,

    // chat previews
    showChatPreview,
    previewChatId,
    toggleChatPreview,
    previewMessages,
    previewLoading,
    fetchPreviewMessages,

    // user
    user
  };

  return <ChatContext.Provider value={values}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
