import OpenAI from 'openai';

const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL
});

const DEFAULT_MODEL = 'deepseek-chat';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 8191;
const MAX_RETRIES = 3;
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Helper functions for model detection
const isO1Model = (modelName) => modelName?.toLowerCase().includes('o1-');
const isVisionModel = (modelName) => {
    const visionModels = ['gpt-4-vision', 'gpt-4o-vision', 'gpt-4o-mini-vision'];
    return modelName && visionModels.some(vm => modelName.toLowerCase().includes(vm.toLowerCase()));
};

const formatLaTeXContent = (content) => {
    if (!content) return content;

    // First replace code blocks to protect them
    const codeBlocks = [];
    content = content.replace(/```[\s\S]*?```/g, (match) => {
        codeBlocks.push(match);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // LaTeX formatting rules
    const latexRules = [
        // Sigma notation
        { pattern: /Σ[ᵢi]₌₁([³⁵⁴ⁿ\d])\s*([^=\n]+)/g, replacement: '$$\\sum_{i=1}^{$1} $2$$' },
        { pattern: /Σ\s*\(\s*i\s*=\s*1\s*to\s*([^\)]+)\)\s*([^=\n]+)/g, replacement: '$$\\sum_{i=1}^{$1} $2$$' },
        // Other LaTeX rules remain the same...
    ];

    // Apply all LaTeX formatting rules
    latexRules.forEach(rule => {
        content = content.replace(rule.pattern, rule.replacement);
    });

    // Restore code blocks
    codeBlocks.forEach((block, i) => {
        content = content.replace(`__CODE_BLOCK_${i}__`, block);
    });

    return content;
};

const deepseekProvider = {
    formatMessages: ({ persona, previousMessages, fileContent, fileName, fileType }) => {
        // Filter out messages with empty content
        const validMessages = (Array.isArray(previousMessages) ? previousMessages : [])
            .filter(msg => msg && msg.content && msg.content.trim().length > 0)
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: formatLaTeXContent(msg.content.trim())
            }));

        // Ensure we have at least one message, similar to Claude provider
        if (validMessages.length === 0) {
            validMessages.push({
                role: 'user',
                content: 'Hello'
            });
        }

        // Create system message similar to Claude's approach
        let systemMessage = `You are ${persona.name}, a ${persona.role}. ${persona.instructions || ''}`;

        // Handle file content if present
        if (fileContent && fileName) {
            const isImage = SUPPORTED_IMAGE_TYPES.includes(fileType);

            if (isImage && isVisionModel(persona.modelCodeName)) {
                systemMessage += '\nYou have access to an image that has been uploaded. Please analyze it thoroughly and provide relevant insights.';

                // Handle image content for vision models
                const imageContent = [
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${fileType};base64,${fileContent}`,
                            detail: 'high'
                        }
                    },
                    {
                        type: 'text',
                        text: validMessages[0]?.content || 'Please analyze this image.'
                    }
                ];

                if (validMessages.length > 0) {
                    validMessages[0] = {
                        role: 'user',
                        content: imageContent
                    };
                } else {
                    validMessages.push({
                        role: 'user',
                        content: imageContent
                    });
                }
            } else {
                // Handle regular file content
                systemMessage += '\nYou have access to a file that has been uploaded. Please analyze its contents thoroughly.';

                const fileMessage = [
                    'Here is the file content:\n',
                    `<file>${fileName}</file>`,
                    `<content>${fileContent}</content>\n`,
                    `User request: ${validMessages[0]?.content || 'Please analyze this file.'}\n`,
                    'Please analyze this file\'s contents carefully and provide a relevant response.'
                ].join('\n');

                if (validMessages.length > 0) {
                    validMessages[0] = {
                        role: 'user',
                        content: fileMessage
                    };
                } else {
                    validMessages.push({
                        role: 'user',
                        content: fileMessage
                    });
                }
            }
        }

        // Return formatted messages with system message
        return {
            messages: [
                {
                    role: 'system',
                    content: systemMessage
                },
                ...validMessages
            ]
        };
    },

    generateChatStream: async (messages, persona = {}) => {
        if (!messages?.messages?.length) {
            throw new Error('No messages provided for generation');
        }

        // Ensure all messages have non-empty content
        const validMessages = messages.messages.filter(msg =>
            msg && msg.content && (
                typeof msg.content === 'string' ?
                    msg.content.trim().length > 0 :
                    Array.isArray(msg.content)
            )
        );

        if (validMessages.length === 0) {
            throw new Error('No valid messages with content found');
        }

        const requestParams = {
            model: persona.modelCodeName || DEFAULT_MODEL,
            messages: validMessages,
            stream: true,
            presence_penalty: 0.6,
            frequency_penalty: 0.5
        };

        // Handle temperature setting
        if (persona.capabilities?.supportedParameters?.temperature?.supported !== false) {
            requestParams.temperature = persona.capabilities?.supportedParameters?.temperature?.default || DEFAULT_TEMPERATURE;
        }

        // Handle token limit setting
        const maxTokensParam = isO1Model(persona.modelCodeName) ? 'max_completion_tokens' : 'max_tokens';
        requestParams[maxTokensParam] = persona.capabilities?.supportedParameters?.maxTokens?.default || DEFAULT_MAX_TOKENS;

        try {
            let lastError = null;
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                try {
                    if (attempt > 0) {
                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    }
                    return await deepseek.chat.completions.create(requestParams);
                } catch (error) {
                    lastError = error;
                    console.error(`DeepSeek API attempt ${attempt + 1} error:`, error);

                    if (error?.response?.status === 400) {
                        throw error;
                    }

                    const retryableStatus = [429, 500, 502, 503, 504];
                    if (!error?.response?.status || !retryableStatus.includes(error.response.status)) {
                        throw error;
                    }
                }
            }
            throw lastError;
        } catch (error) {
            console.error('DeepSeek API final error:', error);
            error.isDeepSeekError = true;
            throw error;
        }
    },

    extractContentFromChunk: (chunk) => {
        try {
            if (!chunk) return '';

            if (typeof chunk === 'string') {
                try {
                    const parsed = JSON.parse(chunk);
                    return formatLaTeXContent(parsed.choices?.[0]?.delta?.content || '');
                } catch {
                    return '';
                }
            }

            return formatLaTeXContent(chunk.choices?.[0]?.delta?.content || '');
        } catch (error) {
            console.error('Error extracting content from chunk:', error);
            return '';
        }
    },

    generateImage: async (prompt, options = {}) => {
        try {
            const response = await deepseek.images.generate({
                model: "dall-e-3",
                prompt,
                n: 1,
                size: options.size || "1024x1024",
                quality: options.quality || "standard",
                style: options.style || "vivid"
            });
            return { url: response.data[0].url };
        } catch (error) {
            console.error('Deepseek Image API error:', error);
            throw error;
        }
    }
};

export default deepseekProvider;