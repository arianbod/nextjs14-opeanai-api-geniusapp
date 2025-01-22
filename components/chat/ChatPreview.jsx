// components/chat/ChatPreview.jsx
import React from 'react';
import { MessageSquare, ChevronDown, ExternalLink, Clock } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useTranslations } from '@/context/TranslationContext';
import LocaleLink from '../hoc/LocalLink';
import Image from 'next/image';

const ChatPreview = ({ chatId, onClose }) => {
	const { previewMessages, previewLoading, chatList } = useChat();
	const { isRTL } = useTranslations();
	const messages = previewMessages[chatId] || [];

	// Get chat metadata from the chat list
	const currentChat = chatList.find((chat) => chat.id === chatId);

	return (
		<div
			className={`
            flex 
            flex-col 
            h-full 
            bg-base-200/95
            backdrop-blur-xl 
            border-l 
            border-base-300/50
            transition-all 
            duration-300
            ${isRTL ? 'border-r' : 'border-l'}
        `}>
			{/* Header */}
			<div className='sticky top-0 z-10 backdrop-blur-xl bg-base-200/50'>
				<div className='flex justify-between items-center p-4 border-b border-base-300/50'>
					<div className='flex items-center gap-3'>
						{currentChat?.model && (
							<div className='w-10 h-10 rounded-full overflow-hidden ring-2 ring-base-300/50'>
								<Image
									src={currentChat.avatar || '/images/default-avatar.png'}
									alt={currentChat.model}
									width={40}
									height={40}
									className='object-cover'
								/>
							</div>
						)}
						<div>
							<h3 className='text-base font-medium'>
								{currentChat?.title || 'Chat Preview'}
							</h3>
							<p className='text-sm text-base-content/60'>
								{currentChat?.model || 'AI Model'}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className='p-2 hover:bg-base-300/50 rounded-full transition-all duration-200'
						title='Close preview'>
						<ChevronDown className='w-5 h-5' />
					</button>
				</div>

				{/* Stats & Actions */}
				<div className='grid grid-cols-2 gap-4 p-4 border-b border-base-300/50'>
					<div className='flex flex-col items-center p-3 rounded-lg bg-base-300/30 backdrop-blur-sm'>
						<MessageSquare className='w-5 h-5 mb-1 text-primary/70' />
						<span className='text-sm font-medium'>{messages.length}</span>
						<span className='text-xs text-base-content/60'>Messages</span>
					</div>
					<div className='flex flex-col items-center p-3 rounded-lg bg-base-300/30 backdrop-blur-sm'>
						<Clock className='w-5 h-5 mb-1 text-primary/70' />
						<span className='text-sm font-medium'>
							{new Date(messages[0]?.timestamp).toLocaleDateString()}
						</span>
						<span className='text-xs text-base-content/60'>Started</span>
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
								className='group relative bg-base-300/30 hover:bg-base-300/50 rounded-lg p-4 transition-all duration-200'>
								<p className='text-sm leading-relaxed'>{msg.content}</p>
								<span className='block mt-2 text-xs text-base-content/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
									{new Date(msg.timestamp).toLocaleString()}
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

			{/* Action Footer */}
			<div className='p-4 border-t border-base-300/50 bg-base-200/50 backdrop-blur-sm'>
				<LocaleLink
					href={`/chat/${chatId}`}
					className='flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all duration-200'>
					<span>Open Full Chat</span>
					<ExternalLink className='w-4 h-4' />
				</LocaleLink>
			</div>
		</div>
	);
};

export default ChatPreview;
