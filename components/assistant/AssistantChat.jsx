// components/assistant/AssistantChat.jsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Paperclip, Smile } from 'lucide-react';
import { useAssistant } from '@/context/AssistantContext';
import { motion, AnimatePresence } from 'framer-motion';
import TypingIndicator from './TypingIndicator';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

const ChatMessage = ({ message, isLast }) => {
	const isUser = message.role === 'user';

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
			{/* {!isUser && (
				<div className='flex-shrink-0 w-12 h-12 rounded-full mr-2'>
					<Image
						alt='Assistant Avatar'
						src='/images/babagpt_bw.svg'
						width={32}
						height={32}
						className='object-contain bg-base-200'
					/>
				</div>
			)} */}

			<div
				className={`relative max-w-[80%] p-3 rounded-lg ${
					isUser
						? 'bg-primary text-primary-content ml-4'
						: 'bg-base-200 text-base-content mr-4'
				}`}>
				{/* Message content with Markdown support */}
				<div className='prose prose-sm max-w-none'>
					<ReactMarkdown
						components={{
							code: ({ node, inline, className, children, ...props }) => {
								if (inline) {
									return (
										<code
											className='px-1 py-0.5 rounded bg-base-300'
											{...props}>
											{children}
										</code>
									);
								}
								return (
									<pre className='p-3 rounded-lg bg-base-300 overflow-x-auto'>
										<code {...props}>{children}</code>
									</pre>
								);
							},
						}}>
						{message.content}
					</ReactMarkdown>
				</div>

				{/* Timestamp and status */}
				<div
					className={`absolute ${isUser ? 'left-0' : 'right-0'} -bottom-5 
                     text-xs text-base-content/60 whitespace-nowrap
                     opacity-0 group-hover:opacity-100 transition-opacity`}>
					{new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					})}
					{isUser && isLast && (
						<span className='ml-1'>
							{message.status === 'sent' ? '✓' : '✓✓'}
						</span>
					)}
				</div>
			</div>

			{/* {isUser && (
				<div className='flex-shrink-0 w-8 h-8 rounded-full overflow-hidden ml-2'>
					<div className='w-full h-full bg-primary text-primary-content flex items-center justify-center text-sm font-semibold'>
						You
					</div>
				</div>
			)} */}
		</motion.div>
	);
};

const AssistantChat = () => {
	const { messages, sendMessage, isLoading } = useAssistant();
	const [input, setInput] = useState('');
	const [isComposing, setIsComposing] = useState(false);
	const messagesEndRef = useRef(null);
	const inputRef = useRef(null);

	const scrollToBottom = (behavior = 'smooth') => {
		messagesEndRef.current?.scrollIntoView({ behavior });
	};

	useEffect(() => {
		scrollToBottom(messages.length === 1 ? 'auto' : 'smooth');
	}, [messages, isLoading]);

	// Focus input on mount
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		sendMessage(input);
		setInput('');
		// Immediate scroll on user message
		scrollToBottom('auto');
	};

	const handleKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
			handleSubmit(e);
		}
	};

	return (
		<div className='flex flex-col h-full'>
			{/* Welcome message */}
			{messages.length === 0 && (
				<div className='flex-1 flex items-center justify-center p-4 text-center text-base-content/60'>
					<div>
						<h3 className='text-lg font-semibold mb-2'>
							Welcome to Baba AI Assistant
						</h3>
						<p className='text-sm'>How can I help you today?</p>
					</div>
				</div>
			)}

			{/* Messages */}
			<div className='flex-1 overflow-y-auto p-4 space-y-6'>
				{messages.map((message, index) => (
					<ChatMessage
						key={message.id}
						message={message}
						isLast={index === messages.length - 1}
					/>
				))}

				{/* Typing Indicator */}
				<AnimatePresence>
					{isLoading && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							className='flex justify-start'>
							<TypingIndicator />
						</motion.div>
					)}
				</AnimatePresence>
				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			<form
				onSubmit={handleSubmit}
				className='border-t border-base-300 p-4'>
				<div className='flex place-items-center gap-2'>
					<div className='flex-1 relative'>
						<textarea
							ref={inputRef}
							rows={1}
							value={input}
							onChange={(e) => {
								setInput(e.target.value);
								e.target.style.height = 'auto';
								e.target.style.height =
									Math.min(e.target.scrollHeight, 150) + 'px';
							}}
							onKeyDown={handleKeyDown}
							onCompositionStart={() => setIsComposing(true)}
							onCompositionEnd={() => setIsComposing(false)}
							placeholder='Type your message...'
							className='w-full bg-base-200 rounded-lg px-4 py-2 pr-24 min-h-[40px] max-h-[150px] resize-none
                       focus:outline-none focus:ring-2 focus:ring-primary'
							disabled={isLoading}
						/>
						{/* <div className='absolute right-2 bottom-2 flex items-center gap-2'>
							<button
								type='button'
								className='p-1 hover:bg-base-300 rounded-full transition-colors text-base-content/60'
								disabled={isLoading}>
								<Smile className='w-4 h-4' />
							</button>
							<button
								type='button'
								className='p-1 hover:bg-base-300 rounded-full transition-colors text-base-content/60'
								disabled={isLoading}>
								<Paperclip className='w-4 h-4' />
							</button>
						</div> */}
					</div>
					<motion.button
						type='submit'
						disabled={!input.trim() || isLoading}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className='p-2 bg-primary text-primary-content rounded-lg disabled:opacity-50 
                     disabled:cursor-not-allowed flex-shrink-0 transition-colors
                     hover:bg-primary/90'>
						<Send className='w-5 h-5' />
					</motion.button>
				</div>
			</form>
		</div>
	);
};

export default AssistantChat;
