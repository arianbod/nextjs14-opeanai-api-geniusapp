// components/chat/ChatPreview.jsx
import React from 'react';
import { MessageSquare, X, View } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useTranslations } from '@/context/TranslationContext';
import LocaleLink from '../hoc/LocalLink';
import Image from 'next/image';

const ChatPreview = ({ chatId, onClose }) => {
	const { previewMessages, previewLoading, chatList } = useChat();
	const { isRTL } = useTranslations();
	const messages = previewMessages[chatId] || [];
	const currentChat = chatList.find((chat) => chat.id === chatId);

	const handleOpenChat = () => {
		onClose();
	};

	// Prevent event propagation for the content area
	const handleContentClick = (e) => {
		e.stopPropagation();
	};

	const formatDate = (timestamp) => {
		return new Date(timestamp).toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<div
			className={`
                flex 
                flex-col 
                h-full 
                bg-base-100
                shadow-lg
                transition-all 
                duration-300
                ${isRTL ? 'border-r' : 'border-l'}
                border-base-200
            `}
			onClick={handleContentClick}>
			{/* Header */}
			<div className='sticky top-0 z-10 bg-base-100'>
				<div className='flex justify-between items-center p-4'>
					<div className='flex items-center gap-3'>
						{currentChat?.model && (
							<div className='w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/10 transition-shadow duration-300 hover:ring-primary/20'>
								<Image
									src={currentChat.avatar || '/images/default-avatar.png'}
									alt={currentChat.model}
									width={48}
									height={48}
									className='object-cover'
								/>
							</div>
						)}
						<div>
							<h3 className='text-lg font-medium text-base-content'>
								{currentChat?.title || 'Chat Preview'}
							</h3>
							<p className='text-sm text-base-content/60'>
								{messages[0] && formatDate(messages[0].timestamp)}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className='p-2 hover:bg-base-200 rounded-full transition-colors duration-200'
						aria-label='Close preview'>
						<X className='w-5 h-5' />
					</button>
				</div>

				{/* Quick Stats */}
				<div className='px-4 py-3 bg-base-200/50 border-y border-base-200'>
					<div className='flex items-center gap-2 text-sm text-base-content/70'>
						<MessageSquare className='w-4 h-4' />
						<span className='capitalize'>
							you have {messages.length}{' '}
							{messages.length > 1 ? 'prompts' : 'prompt'} in this conversation
						</span>
					</div>
				</div>
			</div>

			{/* Messages */}
			<div className='flex-1 overflow-y-auto'>
				{previewLoading ? (
					<div className='flex justify-center items-center h-32'>
						<div className='loading loading-spinner text-primary'></div>
					</div>
				) : messages.length > 0 ? (
					<div className='p-4 space-y-4'>
						{messages.map((msg) => (
							<div
								key={msg.id}
								className='group bg-base-100 hover:bg-base-200/50 rounded-lg p-4 transition-colors duration-200 border border-base-200'>
								<p className='text-sm leading-relaxed text-base-content'>
									{msg.content}
								</p>
								<span className='block mt-2 text-xs text-base-content/60'>
									{formatDate(msg.timestamp)}
								</span>
							</div>
						))}
					</div>
				) : (
					<div className='flex flex-col items-center justify-center h-32 text-base-content/60'>
						<MessageSquare className='w-8 h-8 mb-2 opacity-50' />
						<p className='text-sm'>No messages found</p>
					</div>
				)}
			</div>

			{/* Footer */}
			<div className='p-4 bg-base-100 border-t border-base-200 flex place-items-center place-content-center'>
				<LocaleLink
					href={`/chat/${chatId}`}
					onClick={handleOpenChat}
					className='flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-white font-bold rounded-lg transition-colors duration-200 hover:bg-primary/90 '>
					<span>View Full Conversation</span>
					{/* <View className='w-4 h-4' /> */}
				</LocaleLink>
			</div>
		</div>
	);
};

export default ChatPreview;
