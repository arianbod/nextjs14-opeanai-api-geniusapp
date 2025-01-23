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
		if (isOpen && !isMinimized && !panelRef.current) {
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
						? 'bottom-20 right-6 w-14 h-14'
						: `bottom-20 right-6 w-[90vw] sm:w-[380px] h-[500px] 
                           max-h-[calc(100vh-160px)]` // Increased space from bottom
				} 
                           bg-base-100 rounded-lg shadow-2xl overflow-hidden z-40 
                           border border-base-300`}
				initial={{ opacity: 0, y: 50, scale: 0.9 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 50, scale: 0.9 }}
				transition={{
					type: 'spring',
					damping: 20,
					stiffness: 300,
					duration: 0.2,
				}}>
				{/* Header */}
				<div
					className={`flex items-center justify-between ${
						isMinimized ? 'p-2' : 'p-4'
					} border-b border-base-300 bg-base-200`}>
					{!isMinimized && <h2 className='text-lg font-semibold'>Baba AI Assistant</h2>}
					<div className='flex items-center gap-2 ml-auto'>
						<button
							onClick={toggleMinimize}
							className='p-1 hover:bg-base-300 rounded-full transition-colors'
							aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}>
							{isMinimized ? (
								<Maximize2 className='w-5 h-5' />
							) : (
								<Minimize2 className='w-5 h-5' />
							)}
						</button>
						{!isMinimized && (
							<button
								onClick={toggleAssistant}
								className='p-1 hover:bg-base-300 rounded-full transition-colors'
								aria-label='Close chat'>
								<X className='w-5 h-5' />
							</button>
						)}
					</div>
				</div>

				{/* Chat Area - Fixed height container */}
				<div
					className={`transition-all duration-200 ${
						isMinimized ? 'h-0' : 'h-[calc(100%-56px)]'
					} overflow-hidden`}>
					{!isMinimized && <AssistantChat />}
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export default AssistantPanel;
