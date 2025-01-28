import React, { memo, useEffect, useRef, useCallback, useState } from 'react';
import { throttle } from 'lodash';
import { ArrowUp, ArrowDown, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'next/navigation'; // Updated for Next.js 15

import Message from './Message';

const MessageList = ({ messages, isLoading, messagesEndRef }) => {
	const scrollContainerRef = useRef(null);
	const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
	const [hasNewContent, setHasNewContent] = useState(false);
	const lastProcessedMessageCount = useRef(0);
	const lastScrollPositionRef = useRef(0);

	// Updated routing for Next.js 15
	// Using searchParams hook instead of router.query
	const searchParams = useSearchParams();
	const targetMessageId = searchParams.get('targetMessageId');

	// Scroll configuration constants
	const LINE_HEIGHT = 24; // Standard line height for message content
	const SCROLL_THRESHOLD = 150; // Pixels from bottom to trigger auto-scroll behavior

	// Determines if the user has scrolled up significantly from the bottom
	const isScrolledUp = useCallback(() => {
		if (!scrollContainerRef.current) return false;
		const { scrollTop, scrollHeight, clientHeight } =
			scrollContainerRef.current;
		return scrollHeight - (scrollTop + clientHeight) > SCROLL_THRESHOLD;
	}, []);

	// Handles smooth content scrolling animation
	const performContentScroll = useCallback(() => {
		if (!scrollContainerRef.current || !isAutoScrollEnabled || isScrolledUp())
			return;

		const container = scrollContainerRef.current;
		const messageElements = container.getElementsByClassName('message-line');
		if (messageElements.length === 0) return;

		const lastMessage = messageElements[messageElements.length - 1];
		const lastMessageRect = lastMessage.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();

		// Calculate visible portion of the last message
		const messageVisibleHeight = Math.min(
			lastMessageRect.bottom - containerRect.top,
			lastMessageRect.height
		);

		// Scroll if message is partially visible
		if (messageVisibleHeight < lastMessageRect.height) {
			const currentScroll = container.scrollTop;
			container.scrollTop = currentScroll + LINE_HEIGHT;
			lastScrollPositionRef.current = currentScroll + LINE_HEIGHT;
		}
	}, [isAutoScrollEnabled, isScrolledUp]);

	// Handle new message arrivals
	useEffect(() => {
		if (
			messages.length > lastProcessedMessageCount.current &&
			isAutoScrollEnabled
		) {
			performContentScroll();
		}
	}, [messages, performContentScroll, isAutoScrollEnabled]);

	// Throttled scroll handler to manage scroll state and new content indicators
	const handleScroll = useCallback(
		throttle(() => {
			const isUp = isScrolledUp();
			if (isUp && isAutoScrollEnabled) {
				setIsAutoScrollEnabled(false);
			}
			setHasNewContent(
				isUp && messages.length > lastProcessedMessageCount.current
			);

			if (scrollContainerRef.current) {
				lastScrollPositionRef.current = scrollContainerRef.current.scrollTop;
			}
		}, 5000),
		[messages.length, isAutoScrollEnabled, isScrolledUp]
	);

	// Set up scroll event listener
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (container) {
			container.addEventListener('scroll', handleScroll, { passive: true });
			return () => container.removeEventListener('scroll', handleScroll);
		}
	}, [handleScroll]);

	// Handle new message tracking and auto-scroll behavior
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		if (messages.length > lastProcessedMessageCount.current) {
			if (isScrolledUp()) {
				setHasNewContent(true);
			} else if (isAutoScrollEnabled) {
				performContentScroll();
			}
		}

		// Reset state when message stream completes
		if (!isLoading) {
			lastProcessedMessageCount.current = messages.length;
			setHasNewContent(false);
		}
	}, [
		messages.length,
		isLoading,
		isAutoScrollEnabled,
		isScrolledUp,
		performContentScroll,
	]);

	// Handle scrolling to targeted message
	useEffect(() => {
		if (!targetMessageId) return;
		if (!scrollContainerRef.current) return;

		// Delayed scroll to ensure DOM is ready
		const scrollToTarget = () => {
			const targetElement = document.getElementById(
				`message-${targetMessageId}`
			);
			if (targetElement) {
				targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		};

		// Add small delay to ensure render completion
		setTimeout(scrollToTarget, 100);
	}, [targetMessageId, messages]);

	// Toggle auto-scroll functionality
	const toggleAutoScroll = useCallback(() => {
		setIsAutoScrollEnabled((prev) => {
			if (!prev) {
				// Immediately scroll to bottom when enabling
				const container = scrollContainerRef.current;
				if (container) {
					container.scrollTop = container.scrollHeight - container.clientHeight;
					lastProcessedMessageCount.current = messages.length;
					setHasNewContent(false);
				}
			}
			return !prev;
		});
	}, [messages.length]);

	/**
	 * ADDED: Helper to format date as "Month Day, Year".
	 * Adjust to your preference or localization.
	 */
	const formatDateDivider = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	/**
	 * ADDED: Helper to see if two timestamps are on the same day
	 */
	const isSameDay = (ts1, ts2) => {
		const d1 = new Date(ts1);
		const d2 = new Date(ts2);
		return (
			d1.getDate() === d2.getDate() &&
			d1.getMonth() === d2.getMonth() &&
			d1.getFullYear() === d2.getFullYear()
		);
	};

	return (
		<div className='relative flex flex-col w-full h-full'>
			<div
				ref={scrollContainerRef}
				className='flex flex-col overflow-y-auto space-y-4 backdrop-blur-lg z-0 pt-20 pb-24'>
				<div className='w-full max-w-3xl mx-auto flex flex-col gap-4'>
					{messages.map((message, index) => {
						const showDateDivider =
							index === 0 ||
							!isSameDay(message.timestamp, messages[index - 1].timestamp);

						return (
							<div										
								key={message.id}
								id={`message-${message.id}`}>
								{/* Show a small date divider if needed */}
								{showDateDivider && (
									<div className='text-center my-2'>
										<span className='bg-base-200 text-sm px-2 py-1 rounded text-base-content/70'>
											{formatDateDivider(message.timestamp)}
										</span>
									</div>
								)}

								<div className='message-line animate-fade-in opacity-0'>
									<Message
										messageId={message.id}
										role={message.role}
										content={message.content}
										timestamp={message.timestamp}
									/>
								</div>
							</div>
						);
					})}
					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Auto-scroll toggle button */}
			{(hasNewContent || !isAutoScrollEnabled) && (
				<button
					onClick={toggleAutoScroll}
					className={`fixed bottom-80 right-6 p-3 rounded-full shadow-lg transition-all duration-500 
            ${
							isAutoScrollEnabled
								? 'bg-base-content/10 hover:bg-base-content/20'
								: 'bg-base-300 hover:bg-base-200'
						} 
            ${hasNewContent ? 'opacity-100' : 'opacity-70'}
            transform transition-transform duration-500 ease-in-out
            hover:scale-110`}
					aria-label={
						isAutoScrollEnabled ? 'Disable auto-scroll' : 'Enable auto-scroll'
					}>
					<div className='flex items-center space-x-1'>
						{isAutoScrollEnabled ? (
							<ArrowUp className='w-5 h-5 text-base-content' />
						) : (
							<>
								<ArrowDown className='w-5 h-5 text-base-content' />
								{hasNewContent && (
									<MessageSquare className='w-4 h-4 text-warning transition-opacity duration-1000 ease-in-out' />
								)}
							</>
						)}
					</div>
				</button>
			)}
		</div>
	);
};

export default memo(MessageList);
