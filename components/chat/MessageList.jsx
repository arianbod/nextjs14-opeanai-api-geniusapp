import React, { memo, useEffect, useRef, useCallback, useState } from 'react';
import { throttle } from 'lodash';
import { ArrowUp, ArrowDown, MessageSquare, Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation'; // For Next.js 15
import Message from './Message';

const MessageList = ({ messages, isLoading, messagesEndRef }) => {
	const scrollContainerRef = useRef(null);
	const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
	const [hasNewContent, setHasNewContent] = useState(false);
	const lastProcessedMessageCount = useRef(0);
	const lastScrollPositionRef = useRef(0);

	const searchParams = useSearchParams();
	const targetMessageId = searchParams.get('targetMessageId');

	// SCROLL CONFIG
	const LINE_HEIGHT = 24;
	const SCROLL_THRESHOLD = 150;

	const isScrolledUp = useCallback(() => {
		if (!scrollContainerRef.current) return false;
		const { scrollTop, scrollHeight, clientHeight } =
			scrollContainerRef.current;
		return scrollHeight - (scrollTop + clientHeight) > SCROLL_THRESHOLD;
	}, []);

	const performContentScroll = useCallback(() => {
		if (!scrollContainerRef.current || !isAutoScrollEnabled || isScrolledUp())
			return;

		const container = scrollContainerRef.current;
		const messageElements = container.getElementsByClassName('message-line');
		if (messageElements.length === 0) return;

		const lastMessage = messageElements[messageElements.length - 1];
		const lastMessageRect = lastMessage.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();

		const messageVisibleHeight = Math.min(
			lastMessageRect.bottom - containerRect.top,
			lastMessageRect.height
		);
		if (messageVisibleHeight < lastMessageRect.height) {
			const currentScroll = container.scrollTop;
			container.scrollTop = currentScroll + LINE_HEIGHT;
			lastScrollPositionRef.current = currentScroll + LINE_HEIGHT;
		}
	}, [isAutoScrollEnabled, isScrolledUp]);

	// On new messages, attempt auto-scroll
	useEffect(() => {
		if (
			messages.length > lastProcessedMessageCount.current &&
			isAutoScrollEnabled
		) {
			performContentScroll();
		}
	}, [messages, performContentScroll, isAutoScrollEnabled]);

	const handleScroll = useCallback(
		throttle(() => {
			const up = isScrolledUp();
			if (up && isAutoScrollEnabled) {
				setIsAutoScrollEnabled(false);
			}
			setHasNewContent(
				up && messages.length > lastProcessedMessageCount.current
			);

			if (scrollContainerRef.current) {
				lastScrollPositionRef.current = scrollContainerRef.current.scrollTop;
			}
		}, 5000),
		[messages.length, isAutoScrollEnabled, isScrolledUp]
	);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (container) {
			container.addEventListener('scroll', handleScroll, { passive: true });
			return () => container.removeEventListener('scroll', handleScroll);
		}
	}, [handleScroll]);

	// When messages complete loading
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

	// Scroll to "targetMessageId" if provided in URL
	useEffect(() => {
		if (!targetMessageId) return;
		if (!scrollContainerRef.current) return;

		const scrollToTarget = () => {
			const targetElement = document.getElementById(
				`message-${targetMessageId}`
			);
			if (targetElement) {
				targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		};
		setTimeout(scrollToTarget, 100);
	}, [targetMessageId, messages]);

	// Toggle auto-scroll
	const toggleAutoScroll = useCallback(() => {
		setIsAutoScrollEnabled((prev) => {
			if (!prev) {
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

	// Optional date-grouping helpers
	const formatDateDivider = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

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
							!isSameDay(
								messages[index].timestamp,
								messages[index - 1]?.timestamp
							);
						const isTargeted = message.id === targetMessageId;

						return (
							<div
								key={message.id}
								id={`message-${message.id}`}>
								{showDateDivider && (
									<div className='flex items-center gap-2 my-2'>
										<div className='h-px flex-1 bg-base-300/30'></div>
										<span className='text-xs font-medium text-base-content/50'>
											{formatDateDivider(message.timestamp)}
										</span>
										<div className='h-px flex-1 bg-base-300/30'></div>
									</div>
								)}

								<div className='message-line animate-fade-in opacity-0'>
									<Message
										messageId={message.id}
										role={message.role}
										content={message.content}
										timestamp={message.timestamp}
										pinned={message.pinned}
										starred={message.starred}
										notes={message.notes}
										highlight={isTargeted}
									/>
								</div>
							</div>
						);
					})}
					{messages.length > 0 && (
						<div className='flex flex-col items-center py-6 opacity-0 animate-fade-in'>
							<div
								className={`
                  flex items-center justify-center 
                  w-6 h-6 rounded-full 
                  ${isLoading ? 'bg-primary/10' : 'bg-base-200/50'}
                  transition-all duration-500
                  ${isLoading ? 'animate-pulse' : ''}
                `}>
								<div
									className={`
                    ${isLoading ? 'animate-spin' : ''}
                    transition-transform duration-500
                    ${isLoading ? 'scale-75' : 'scale-100'}
                  `}>
									{isLoading ? (
										<div className='w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full' />
									) : (
										<Check className='w-3 h-3 text-primary' />
									)}
								</div>
							</div>
							<div className='flex items-center gap-2 mt-2'>
								<div
									className={`
                    h-px w-12 
                    transition-all duration-500
                    ${
											isLoading
												? 'bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse'
												: 'bg-gradient-to-r from-transparent via-base-300/30 to-transparent'
										}
                  `}
								/>
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Auto-scroll toggle */}
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
