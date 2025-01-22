// components/chat/ChatPreview.jsx
import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

const ChatPreview = ({ chatId, onClose }) => {
	const { previewMessages, previewLoading } = useChat();
	const messages = previewMessages[chatId] || [];

	return (
		<div className='flex flex-col h-full'>
			<div className='flex justify-between items-center p-4 border-b border-base-300'>
				<h3 className='text-lg font-semibold'>Chat Questions</h3>
				<button
					onClick={onClose}
					className='p-2 hover:bg-base-300 rounded-full transition-colors'>
					<ChevronDown className='w-5 h-5' />
				</button>
			</div>

			<div className='flex-1 overflow-y-auto p-4'>
				{previewLoading ? (
					<div className='flex justify-center items-center h-full'>
						<div className='loading loading-spinner'></div>
					</div>
				) : messages.length > 0 ? (
					<ul className='space-y-4'>
						{messages.map((msg) => (
							<li
								key={msg.id}
								className='bg-base-200 rounded-lg p-4'>
								<p className='text-sm mb-2'>{msg.content}</p>
								<span className='text-xs text-base-content/60'>
									{new Date(msg.timestamp).toLocaleString()}
								</span>
							</li>
						))}
					</ul>
				) : (
					<p className='text-center text-base-content/60'>No messages found</p>
				)}
			</div>
		</div>
	);
};

export default ChatPreview;
