// components/assistant/AssistantButton.jsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
	const [position, setPosition] = useState(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [isMobile, setIsMobile] = useState(false);

	// Check if device is mobile
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Calculate initial position
	const calculateInitialPosition = useCallback(() => {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const buttonWidth = 280;
		const buttonHeight = 72; // Increased for better touch target
		const margin = 24;

		return {
			x: viewportWidth - buttonWidth - margin,
			y: viewportHeight - buttonHeight - margin,
		};
	}, []);

	// Initialize position on mount and handle window resize
	useEffect(() => {
		const savedPosition = localStorage.getItem('assistantButtonPosition');

		if (savedPosition) {
			setPosition(JSON.parse(savedPosition));
		} else {
			setPosition(calculateInitialPosition());
		}

		const handleResize = () => {
			if (!localStorage.getItem('assistantButtonPosition')) {
				setPosition(calculateInitialPosition());
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [calculateInitialPosition]);

	useEffect(() => {
		const hidden = localStorage.getItem('assistantButtonHidden');
		if (hidden === 'true') {
			setIsButtonVisible(false);
		}
	}, []);

	// Handle touch/mouse events for dragging
	const handleStart = useCallback(
		(e) => {
			if (isMobile) return; // Disable dragging on mobile

			const clientX = e.type.includes('mouse')
				? e.clientX
				: e.touches[0].clientX;
			const clientY = e.type.includes('mouse')
				? e.clientY
				: e.touches[0].clientY;

			if (e.target.closest('.drag-handle')) {
				setIsDragging(true);
				setDragStart({
					x: clientX - position.x,
					y: clientY - position.y,
				});
			}
		},
		[position, isMobile]
	);

	const handleMove = useCallback(
		(e) => {
			if (!isDragging || !position || isMobile) return;

			const clientX = e.type.includes('mouse')
				? e.clientX
				: e.touches[0].clientX;
			const clientY = e.type.includes('mouse')
				? e.clientY
				: e.touches[0].clientY;

			const newPosition = {
				x: clientX - dragStart.x,
				y: clientY - dragStart.y,
			};

			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;
			const buttonWidth = 280;
			const buttonHeight = 72;

			newPosition.x = Math.max(
				0,
				Math.min(viewportWidth - buttonWidth, newPosition.x)
			);
			newPosition.y = Math.max(
				0,
				Math.min(viewportHeight - buttonHeight, newPosition.y)
			);

			setPosition(newPosition);
		},
		[isDragging, dragStart, position, isMobile]
	);

	const handleEnd = useCallback(() => {
		if (isDragging) {
			setIsDragging(false);
			localStorage.setItem('assistantButtonPosition', JSON.stringify(position));
		}
	}, [isDragging, position]);

	// Add and remove event listeners
	useEffect(() => {
		// Mouse events
		document.addEventListener('mousedown', handleStart);
		document.addEventListener('mousemove', handleMove);
		document.addEventListener('mouseup', handleEnd);

		// Touch events
		document.addEventListener('touchstart', handleStart, { passive: true });
		document.addEventListener('touchmove', handleMove, { passive: false });
		document.addEventListener('touchend', handleEnd);

		return () => {
			// Clean up mouse events
			document.removeEventListener('mousedown', handleStart);
			document.removeEventListener('mousemove', handleMove);
			document.removeEventListener('mouseup', handleEnd);

			// Clean up touch events
			document.removeEventListener('touchstart', handleStart);
			document.removeEventListener('touchmove', handleMove);
			document.removeEventListener('touchend', handleEnd);
		};
	}, [handleStart, handleMove, handleEnd]);

	const hideButtonTemporarily = () => {
		setIsButtonVisible(false);
		setIsDialogOpen(false);
	};

	const hideButtonPermanently = () => {
		setIsButtonVisible(false);
		localStorage.setItem('assistantButtonHidden', 'true');
		setIsDialogOpen(false);
	};

	if (!isButtonVisible || !position) return null;

	return (
		<>
			<div
				className='fixed z-50'
				style={{
					transform: `translate(${position.x}px, ${position.y}px)`,
					cursor:
						isDragging && !isMobile
							? 'grabbing'
							: isMobile
							? 'default'
							: 'grab',
				}}>
				{/* Close button */}
				<button
					onClick={() => setIsDialogOpen(true)}
					className='absolute -top-2 -right-2 p-1 rounded-full bg-base-100 shadow-md hover:bg-base-200 transition-colors z-30'
					aria-label='Hide Assistant Button'>
					<X className='w-3 h-3' />
				</button>

				{/* Main button */}
				<motion.button
					onClick={toggleAssistant}
					className='flex items-center gap-3 p-3 pr-6 rounded-lg bg-white text-primary shadow-lg hover:shadow-xl transition-all duration-300 drag-handle border border-gray-200'
					whileHover={{ scale: isMobile ? 1 : 1.02 }}
					whileTap={{ scale: isMobile ? 0.98 : 0.98 }}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}>
					{/* Avatar container with online indicator */}
					<div className='relative'>
						<div className='w-12 h-12 rounded-full overflow-hidden border-2 border-primary relative'>
							<div className='absolute inset-0 bg-green-800' />
							<Image
								alt='Assistant Avatar'
								src='/images/babagpt_bw.svg'
								width={48}
								height={48}
								className='relative z-10 object-contain'
								priority
							/>
						</div>
						{/* Online indicator */}
						<div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white' />
					</div>

					{/* Text content */}
					<div className='flex flex-col items-start'>
						<span className='text-sm font-medium text-gray-900'>
							Baba AI Assistant
						</span>
						<span className='text-xs text-green-600'>Online</span>
					</div>
				</motion.button>
			</div>

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
