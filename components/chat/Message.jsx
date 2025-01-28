// Message.jsx

import React, { memo } from 'react';
import Image from 'next/legacy/image';
import toast from 'react-hot-toast';
import { Copy, Share2 } from 'lucide-react'; // Added Share2

import { useChat } from '@/context/ChatContext';
import MarkdownRenderer from './MarkdownRenderer';

const Message = ({
	messageId,
	role,
	content,
	timestamp,
	highlight = false,
}) => {
	const { activeChat } = useChat();
	const isUser = role === 'user';

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		toast.success(
			`${isUser ? 'Your' : activeChat.model.name} message copied to clipboard`
		);
	};

	const formatTimestamp = (timestamp) => {
		return new Date(timestamp).toLocaleTimeString();
	};

	// Add a "pulse" or "border" or "shadow" if highlight is true
	// (Feel free to adjust styling as you like)
	return (
		<div
			className={`w-full max-w-[97vw] lg:max-w-3xl flex gap-0 mx-auto ${
				isUser ? 'justify-end' : ''
			}`}>
			{!isUser && (
				<div className='w-1/12'>
					<Image
						src={activeChat.avatar}
						alt={role}
						width={40}
						height={40}
						objectFit='contain'
						className='rounded-full bg-gray-900 dark:bg-gray-800 p-1 w-8 h-8 max-h-16 mt-2'
					/>
				</div>
			)}

			<div
				className={`flex flex-col mb-4 rounded-lg p-4 transition-all
          ${isUser ? 'w-1/2 bg-gray-100 dark:bg-gray-800' : 'w-11/12'}
          ${
						highlight
							? 'border-2 border-yellow-400 dark:border-yellow-500 shadow-md shadow-yellow-200'
							: ''
					}
        `}>
				<div className='flex justify-between items-center w-full mb-2'>
					<span
						className={`text-xs ${
							isUser
								? 'text-gray-600 dark:text-gray-400'
								: 'text-gray-500 dark:text-gray-500'
						}`}>
						{formatTimestamp(timestamp)}
					</span>

					<div className='flex items-center gap-2'>
						{/* COPY BUTTON */}
						<button
							className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center gap-1'
							onClick={() => copyToClipboard(content)}
							title='Copy message'>
							<span className='text-[10px] text-gray-600 dark:text-gray-400'>
								Copy
							</span>
							<Copy
								size={12}
								className='text-gray-600 dark:text-gray-400'
							/>
						</button>

						{/* SHARE BUTTON */}
						<button
							className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center gap-1'
							onClick={() => {
								const currentUrl =
									window.location.origin + window.location.pathname;
								const shareUrl = `${currentUrl}?targetMessageId=${messageId}`;
								navigator.clipboard.writeText(shareUrl);
								toast.success('Shareable link copied!');
							}}
							title='Share this message'>
							<Share2
								size={12}
								className='text-gray-600 dark:text-gray-400'
							/>
							<span className='text-[10px] text-gray-600 dark:text-gray-400'>
								Share
							</span>
						</button>
					</div>
				</div>

				<div className='w-full overflow-x-auto text-wrap'>
					<MarkdownRenderer
						content={content}
						isUser={isUser}
						copyToClipboard={copyToClipboard}
						activeChat={activeChat}
					/>
				</div>
			</div>
		</div>
	);
};

export default memo(Message);
