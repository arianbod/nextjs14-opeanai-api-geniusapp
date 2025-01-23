// components/assistant/AssistantPanel.jsx
'use client';

import React, { useEffect, useRef } from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { useAssistant } from '@/context/AssistantContext';
import { motion, AnimatePresence } from 'framer-motion';
import AssistantChat from './AssistantChat';

const AssistantPanel = () => {
	const {
		isOpen,
		isMinimized,
		toggleAssistant,
		toggleMinimize,
		initializeChat,
	} = useAssistant();
	const panelRef = useRef(null);

	useEffect(() => {
		if (isOpen && !isMinimized) {
			initializeChat();
		}
	}, [isOpen, isMinimized, initializeChat]);

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				ref={panelRef}
				className={`fixed ${
					isMinimized
						? 'bottom-20 right-6 w-72 h-16'
						: 'bottom-24 right-6 w-96 h-[600px]'
				} 
                           bg-base-100 rounded-lg shadow-2xl overflow-hidden z-40 
                           border border-base-300`}
				initial={{ opacity: 0, y: 50, scale: 0.9 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 50, scale: 0.9 }}
				transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
				{/* Header */}
				<div className='flex items-center justify-between p-4 border-b border-base-300 bg-base-200'>
					<h2 className='text-lg font-semibold'>Assistant</h2>
					<div className='flex items-center gap-2'>
						<button
							onClick={toggleMinimize}
							className='p-1 hover:bg-base-300 rounded-full transition-colors'>
							{isMinimized ? (
								<Maximize2 className='w-5 h-5' />
							) : (
								<Minimize2 className='w-5 h-5' />
							)}
						</button>
						<button
							onClick={toggleAssistant}
							className='p-1 hover:bg-base-300 rounded-full transition-colors'>
							<X className='w-5 h-5' />
						</button>
					</div>
				</div>

				{/* Chat Area */}
				{!isMinimized && <AssistantChat />}
			</motion.div>
		</AnimatePresence>
	);
};

export default AssistantPanel;
