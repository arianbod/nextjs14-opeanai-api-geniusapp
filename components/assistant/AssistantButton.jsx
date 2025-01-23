// components/assistant/AssistantButton.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { MessageCircleQuestion, X } from 'lucide-react';
import { useAssistant } from '@/context/AssistantContext';
import { motion, AnimatePresence } from 'framer-motion';

const AssistantButton = () => {
	const { toggleAssistant, isOpen } = useAssistant();
	const [isButtonVisible, setIsButtonVisible] = useState(true);

	// Check localStorage on mount
	useEffect(() => {
		const hidden = localStorage.getItem('assistantButtonHidden');
		if (hidden === 'true') {
			setIsButtonVisible(false);
		}
	}, []);

	const hideButton = (e) => {
		e.stopPropagation(); // Prevent triggering button click
		setIsButtonVisible(false);
		localStorage.setItem('assistantButtonHidden', 'true');
	};

	if (!isButtonVisible) return null;

	return (
		<div className='fixed bottom-6 right-6 z-50'>
			{/* Close button */}
			<button
				onClick={hideButton}
				className='absolute -top-2 -right-2 p-1 rounded-full bg-base-100 shadow-md hover:bg-base-200 transition-colors z-30'
				aria-label='Hide Assistant Button'>
				<X className='w-3 h-3' />
			</button>

			{/* Main button */}
			<motion.button
				onClick={toggleAssistant}
				className='p-4 rounded-full bg-primary text-primary-content shadow-lg hover:shadow-xl transition-all duration-300'
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}>
				<MessageCircleQuestion className='w-6 h-6' />
			</motion.button>
		</div>
	);
};

export default AssistantButton;
