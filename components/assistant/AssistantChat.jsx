'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useAssistant } from '@/context/AssistantContext';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const AssistantChat = () => {
	const { messages, sendMessage, isLoading } = useAssistant();
	const { user } = useAuth();
	const [input, setInput] = useState('');
	const messagesEndRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		sendMessage(input);
		setInput('');
	};

	return (
		<div className='flex flex-col h-full'>
			{/* Messages */}
			<div className='flex-1 overflow-y-auto p-4 space-y-4'>
				{messages.map((message) => (
					<motion.div
						key={message.id}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className={`flex ${
							message.role === 'user' ? 'justify-end' : 'justify-start'
						}`}>
						<div
							className={`max-w-[80%] p-3 rounded-lg ${
								message.role === 'user'
									? 'bg-primary text-primary-content ml-4'
									: 'bg-base-200 text-base-content mr-4'
							}`}>
							{message.content}
						</div>
					</motion.div>
				))}
				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			<form
				onSubmit={handleSubmit}
				className='border-t border-base-300 p-4'>
				<div className='flex items-center gap-2'>
					<input
						type='text'
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder='Type your message...'
						className='flex-1 bg-base-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
						disabled={isLoading}
					/>
					<button
						type='submit'
						disabled={!input.trim() || isLoading}
						className='p-2 bg-primary text-primary-content rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'>
						<Send className='w-5 h-5' />
					</button>
				</div>
			</form>
		</div>
	);
};

export default AssistantChat;
