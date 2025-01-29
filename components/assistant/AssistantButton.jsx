// components/assistant/AssistantButton.jsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MessageCircleQuestion, X } from 'lucide-react';
import { useAssistant } from '@/context/AssistantContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';

const AssistantButton = () => {
	const { toggleAssistant, isOpen } = useAssistant();
	const [isButtonVisible, setIsButtonVisible] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [showWelcome, setShowWelcome] = useState(true);
	const [isMobile, setIsMobile] = useState(false);
	const [bounds, setBounds] = useState({
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
	});
	const buttonRef = useRef(null);

	// Check screen size
	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobile(window.innerWidth < 640); // sm breakpoint
		};

		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);
		return () => window.removeEventListener('resize', checkScreenSize);
	}, []);

	// Hide welcome message after delay
	useEffect(() => {
		const timer = setTimeout(() => {
			setShowWelcome(false);
		}, 5000);
		return () => clearTimeout(timer);
	}, []);

	// Calculate initial position and bounds
	useEffect(() => {
		const calculatePositionAndBounds = () => {
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Adjust button size based on screen size
			const buttonWidth = isMobile ? 48 : buttonRef.current?.offsetWidth || 280;
			const buttonHeight = isMobile
				? 48
				: buttonRef.current?.offsetHeight || 72;
			const margin = isMobile ? 16 : 24;

			setBounds({
				left: margin,
				top: margin,
				right: viewportWidth - buttonWidth - margin,
				bottom: viewportHeight - buttonHeight - margin,
			});

			const savedPosition = localStorage.getItem('assistantButtonPosition');
			if (savedPosition) {
				const parsed = JSON.parse(savedPosition);
				const x = Math.min(
					Math.max(parsed.x, margin),
					viewportWidth - buttonWidth - margin
				);
				const y = Math.min(
					Math.max(parsed.y, margin),
					viewportHeight - buttonHeight - margin
				);
				setPosition({ x, y });
			} else {
				setPosition({
					x: viewportWidth - buttonWidth - margin,
					y: viewportHeight - buttonHeight - margin,
				});
			}
		};

		calculatePositionAndBounds();

		let resizeTimer;
		const handleResize = () => {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(calculatePositionAndBounds, 100);
		};

		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
			clearTimeout(resizeTimer);
		};
	}, [isMobile]);

	useEffect(() => {
		const hidden = localStorage.getItem('assistantButtonHidden');
		if (hidden === 'true') {
			setIsButtonVisible(false);
		}
	}, []);

	const handleDragEnd = (event, info) => {
		const newPosition = {
			x: Math.min(Math.max(info.point.x, bounds.left), bounds.right),
			y: Math.min(Math.max(info.point.y, bounds.top), bounds.bottom),
		};
		setPosition(newPosition);
		localStorage.setItem(
			'assistantButtonPosition',
			JSON.stringify(newPosition)
		);
	};

	const hideButtonTemporarily = () => {
		setIsButtonVisible(false);
		setIsDialogOpen(false);
	};

	const hideButtonPermanently = () => {
		setIsButtonVisible(false);
		localStorage.setItem('assistantButtonHidden', 'true');
		setIsDialogOpen(false);
	};

	if (!isButtonVisible) return null;

	return (
		<>
			<motion.div
				ref={buttonRef}
				className='fixed z-50 touch-none'
				initial={{ x: position.x, y: position.y, scale: 0.8, opacity: 0 }}
				animate={{ x: position.x, y: position.y, scale: 1, opacity: 1 }}
				transition={{ type: 'spring', duration: 0.7 }}
				drag
				dragConstraints={bounds}
				dragElastic={0}
				dragMomentum={false}
				onDragEnd={handleDragEnd}>
				{/* Welcome Message - Only show on desktop */}
				<AnimatePresence>
					{showWelcome && !isMobile && (
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							className='absolute -top-16 right-0 bg-white p-3 rounded-lg shadow-md text-sm whitespace-nowrap'>
							👋 Hi! How can I help you today?
						</motion.div>
					)}
				</AnimatePresence>

				{/* Close button */}
				<button
					onClick={() => setIsDialogOpen(true)}
					className='absolute -top-2 -right-2 p-1 rounded-full bg-base-100 shadow-md hover:bg-base-200 transition-colors z-30'
					aria-label='Hide Assistant Button'>
					<X className='w-3 h-3' />
				</button>

				{/* Main button - Responsive design */}
				<motion.div
					className={`group select-none flex items-center ${
						isMobile
							? 'p-0 rounded-full bg-white shadow-lg hover:shadow-xl'
							: 'gap-3 p-3 pr-6 rounded-lg bg-white/95 backdrop-blur-sm text-primary shadow-lg hover:shadow-xl border border-gray-200'
					} transition-all duration-300 cursor-move`}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={toggleAssistant}>
					{/* Avatar container with online indicator */}
					<div className='relative'>
						<Image
							alt='Assistant Avatar'
							src='/images/babagpt_bw.svg'
							width={isMobile ? 48 : 48}
							height={isMobile ? 48 : 48}
							className={`z-10 select-none relative z-10 object-contain ${
								isMobile ? 'w-12 h-12 p-2' : 'w-8 h-8 p-1'
							} bg-slate-700 rounded-full`}
							priority
						/>
						{/* Animated online indicator */}
						<motion.div
							className={`z-20 select-none absolute bottom-0 right-0 bg-green-500 rounded-full border-2 border-white ${
								isMobile ? 'w-4 h-4' : 'w-3 h-3'
							}`}
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

					{/* Text content - Only show on desktop */}
					{!isMobile && (
						<div className='flex flex-col items-start'>
							<span className='select-none text-sm font-medium text-gray-900'>
								Baba AI Assistant
							</span>
							<div className='flex items-center gap-2'>
								<span className='text-xs text-green-600 select-none'>
									Online
								</span>
								<span className='text-xs text-gray-400 select-none'>
									• Typically responds instantly
								</span>
							</div>

							{/* Hover message */}
							<span className='absolute left-1/2 -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
								Click to chat with me
							</span>
						</div>
					)}

					{/* Mobile tooltip */}
					{isMobile && (
						<span className='absolute left-1/2 -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
							AI Assistant
						</span>
					)}
				</motion.div>
			</motion.div>

			<AlertDialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hide Assistant Button?</AlertDialogTitle>
						<AlertDialogDescription>
							Choose how long you want to hide the assistant button.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className='flex flex-col sm:flex-row gap-2'>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={hideButtonTemporarily}>
							Hide for now
						</AlertDialogAction>
						<AlertDialogAction
							onClick={hideButtonPermanently}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
							Hide forever
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

export default AssistantButton;
