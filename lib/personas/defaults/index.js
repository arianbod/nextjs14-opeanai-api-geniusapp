// @/lib/personas/defaults/index.js

import {
    FaRobot,
    FaGlobe,
} from 'react-icons/fa';
import { SiOpenai } from 'react-icons/si';

export const defaultCapabilities = {
    supportsSystemMessage: true,
    supportedParameters: {
        maxTokens: {
            name: 'max_tokens',
            default: 8191,
        },
        temperature: {
            supported: true,
            default: 0.7,
        },
    },
};

export const defaultAllowed = {
    send: { text: true, file: false, image: false },
    receive: { text: true, file: false, image: false }
};

export const visionAllowed = {
    send: { text: true, file: true, image: true },
    receive: { text: true, file: false, image: false }
};

export const providerDefaults = {
    openai: {
        engine: 'OpenAI',
        provider: 'openai',
        icon: SiOpenai,
        avatar: '/images/personas/chatgpt.jpg',
        color: 'from-green-400 to-blue-500',
    },
    anthropic: {
        engine: 'Anthropic',
        provider: 'anthropic',
        icon: FaGlobe,
        avatar: '/images/personas/claude.webp',
        color: 'from-yellow-400 to-orange-500',
    },
    x: {
        engine: 'X',
        provider: 'x',
        icon: FaRobot,
        avatar: '/images/personas/x.jpg',
        color: 'from-blue-400 to-purple-500',
    },
    gemini: {
        engine: 'Gemini',
        provider: 'gemini',
        icon: FaRobot,
        avatar: '/images/personas/gemini.jpg',
        color: 'from-blue-500 to-teal-500',
    },
    perplexity: {
        engine: 'Perplexity',
        provider: 'perplexity',
        icon: FaGlobe,
        avatar: '/images/personas/perplexity.png',
        color: 'from-indigo-400 to-purple-500',
    },
    deepseek: {
        engine: 'Deepseek',
        provider: 'deepseek',
        icon: FaGlobe,
        avatar: '/images/personas/reezen.png',
        color: 'from-indigo-400 to-purple-500',
    }
};