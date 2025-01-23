// components/assistant/AssistantPanel.jsx
'use client';

import React, { useEffect, useRef } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { useAssistant } from '@/context/AssistantContext';
import { motion, AnimatePresence } from 'framer-motion';
import AssistantChat from './AssistantChat';
import Image from 'next/image';

const AssistantPanel = () => {
	const { isOpen, toggleAssistant, resetAssistant, initializeChat } =
		useAssistant();

	const panelRef = useRef(null);

	useEffect(() => {
		if (isOpen) {
			initializeChat();
		}
	}, [isOpen, initializeChat]);

	const handleReset = () => {
		resetAssistant();
		initializeChat();
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				ref={panelRef}
				className='fixed bottom-0 right-0 sm:bottom-24 sm:right-6
                          w-full sm:w-[450px] h-[100vh] sm:h-[600px]
                          sm:max-w-[95vw] sm:max-h-[90vh]
                          bg-base-100 shadow-2xl  z-40 
                          sm:rounded-lg sm:border border-base-300
                          flex flex-col'
				initial={{ opacity: 0, y: 50, scale: 0.9 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 50, scale: 0.9 }}
				transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
				{/* Header */}
				<div className='flex items-center justify-between px-4 py-3 bg-[#0095ff] text-white rounded-t-xl'>
					{/* Left side: Logo and Title */}
					<div className='flex items-center gap-3'>
						<div className='w-8 h-8 relative rounded-full overflow-hidden bg-white/10 flex-shrink-0'>
							<Image
								src='/baba-ai-assistant-logo.png'
								alt='BabaAI Assistant'
								fill
								className='object-cover'
								priority
							/>
						</div>
						<div>
							<h2 className='text-lg font-medium'>BabaAI Assistant</h2>
							<p className='text-xs opacity-90'>Online</p>
						</div>
					</div>

					{/* Right side: Action Buttons */}
					<div className='flex items-center gap-2'>
						<button
							onClick={handleReset}
							className='p-2 hover:bg-white/10 rounded-full transition-colors'
							aria-label='Reset Chat'>
							<RotateCcw className='w-5 h-5' />
						</button>
						<button
							onClick={toggleAssistant}
							className='p-2 hover:bg-white/10 rounded-full transition-colors'
							aria-label='Close'>
							<X className='w-5 h-5' />
						</button>
					</div>
				</div>

				{/* Chat Area with no padding */}
				<div className='flex-1 overflow-hidden'>
					<AssistantChat />
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export default AssistantPanel;
