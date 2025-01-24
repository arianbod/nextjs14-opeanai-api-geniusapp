// components/assistant/AssistantPanel.jsx
'use client';

import React, { useEffect, useRef } from 'react';
import { X, Minimize2, Maximize2, MessageCircle } from 'lucide-react';
import { useAssistant } from '@/context/AssistantContext';
import { motion, AnimatePresence } from 'framer-motion';
import AssistantChat from './AssistantChat';
import Image from 'next/image';

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
				className={`z-50 fixed p-0 pb-1 ${
					isMinimized
						? 'bottom-20 right-6 w-14 h-14'
						: `bottom-20 right-6 w-[90vw] sm:w-[380px] h-[500px] 
               max-h-[calc(100vh-160px)]`
				} 
        bg-base-100 rounded-lg shadow-2xl 
        border border-base-300 backdrop-blur-sm`}
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
					className={`flex items-center rounded-t-lg ${
						isMinimized ? 'p-2 justify-center' : 'p-4 justify-between'
					} border-b border-base-300 bg-base-200 relative`}>
					{isMinimized ? (
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ type: 'spring', stiffness: 500, damping: 30 }}
							className='relative'>
							<div className='w-10 h-10 rounded-full overflow-hidden border-2 border-base-300 bg-base-100'>
								<Image
									alt='Assistant Avatar'
									src='/images/babagpt_bw.svg'
									width={40}
									height={40}
									className='object-contain p-1'
									priority
								/>
							</div>
							{/* Online indicator for minimized state */}
							<motion.div
								className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-base-200'
								animate={{
									scale: [1, 1.2, 1],
									opacity: [1, 0.8, 1],
								}}
								transition={{
									duration: 2,
									repeat: Infinity,
									ease: 'easeInOut',
								}}
							/>
						</motion.div>
					) : (
						<>
							{/* Header content for maximized state */}
							<div className='flex items-center gap-3'>
								<div className='relative'>
									<div className='w-12 h-12 rounded-full  border-2 border-base-300 bg-slate-800 dark:bg-base-100'>
										<Image
											alt='Assistant Avatar'
											src='/images/babagpt_bw.svg'
											width={128}
											height={128}
											className=''
											priority
										/>
									</div>
									{/* Online indicator */}
									<motion.div
										className='absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-base-200'
										animate={{
											scale: [1, 1.2, 1],
											opacity: [1, 0.8, 1],
										}}
										transition={{
											duration: 2,
											repeat: Infinity,
											ease: 'easeInOut',
										}}
									/>
								</div>
								<div className='flex flex-col'>
									<h2 className='text-base font-semibold leading-tight'>
										Baba AI Assistant
									</h2>
									<span className='text-xs text-base-content/60'>
										Online • Ready to help
									</span>
								</div>
							</div>
						</>
					)}

					{/* Control buttons */}
					<div
						className={`flex items-center gap-2 ${
							isMinimized ? 'absolute right-2' : ''
						}`}>
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
							onClick={toggleMinimize}
							className='p-1 hover:bg-base-300 rounded-full transition-colors'
							aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}>
							{isMinimized ? (
								<Maximize2 className='w-5 h-5' />
							) : (
								<Minimize2 className='w-5 h-5' />
							)}
						</motion.button>
						{!isMinimized && (
							<motion.button
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
								onClick={toggleAssistant}
								className='p-1 hover:bg-base-300 rounded-full transition-colors'
								aria-label='Close chat'>
								<X className='w-5 h-5' />
							</motion.button>
						)}
					</div>
				</div>

				{/* Chat Area - Fixed height container */}
				<motion.div
					className={`transition-all duration-200 ${
						isMinimized ? 'h-0' : 'h-[calc(100%-64px)]'
					} overflow-hidden`}
					initial={false}
					animate={{
						height: isMinimized ? 0 : 'calc(100% - 64px)',
					}}
					transition={{
						duration: 0.3,
						ease: 'easeInOut',
					}}>
					{!isMinimized && <AssistantChat />}
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};

export default AssistantPanel;
