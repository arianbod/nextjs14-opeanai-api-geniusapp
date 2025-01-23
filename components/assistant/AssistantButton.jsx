// components/assistant/AssistantButton.jsx
'use client';

import React from 'react';
import { MessageCircleQuestion } from 'lucide-react';
import { useAssistant } from '@/context/AssistantContext';
import { motion } from 'framer-motion';

const AssistantButton = () => {
    const { toggleAssistant, isOpen } = useAssistant();

    return (
        <motion.button
            onClick={toggleAssistant}
            className="fixed bottom-6 right-6 p-4 rounded-full bg-primary text-primary-content shadow-lg hover:shadow-xl transition-all duration-300 z-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <MessageCircleQuestion className="w-6 h-6" />
        </motion.button>
    );
};

export default AssistantButton;



