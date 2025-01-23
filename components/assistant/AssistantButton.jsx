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

	// Calculate initial position
	const calculateInitialPosition = useCallback(() => {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const buttonWidth = 280; // Wider to accommodate the new design
		const buttonHeight = 64; // Taller for the avatar and text
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

	// Handle mouse down event to start dragging
	const handleMouseDown = useCallback(
		(e) => {
			if (e.target.closest('.drag-handle')) {
				setIsDragging(true);
				setDragStart({
					x: e.clientX - position.x,
					y: e.clientY - position.y,
				});
			}
		},
		[position]
	);

	// Handle mouse move event during dragging
	const handleMouseMove = useCallback(
		(e) => {
			if (isDragging && position) {
				const newPosition = {
					x: e.clientX - dragStart.x,
					y: e.clientY - dragStart.y,
				};

				const viewportWidth = window.innerWidth;
				const viewportHeight = window.innerHeight;
				const buttonWidth = 280;
				const buttonHeight = 64;

				newPosition.x = Math.max(
					0,
					Math.min(viewportWidth - buttonWidth, newPosition.x)
				);
				newPosition.y = Math.max(
					0,
					Math.min(viewportHeight - buttonHeight, newPosition.y)
				);

				setPosition(newPosition);
			}
		},
		[isDragging, dragStart, position]
	);

	// Handle mouse up event to stop dragging
	const handleMouseUp = useCallback(() => {
		if (isDragging) {
			setIsDragging(false);
			localStorage.setItem('assistantButtonPosition', JSON.stringify(position));
		}
	}, [isDragging, position]);

	// Add and remove event listeners
	useEffect(() => {
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		document.addEventListener('mousedown', handleMouseDown);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			document.removeEventListener('mousedown', handleMouseDown);
		};
	}, [handleMouseMove, handleMouseUp, handleMouseDown]);

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
					cursor: isDragging ? 'grabbing' : 'grab',
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
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}>
					{/* Avatar container with online indicator */}
					<div className='relative'>
						<div className='w-10 h-10 rounded-full overflow-hidden border-2 border-primary'>
							<Image
								alt='Assistant Avatar'
								src='/images/babagpt_bw.svg'
								width={64}
								height={64}
								// fill='contain'
								className='bg-green-800 w-full h-full object-cover'
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
