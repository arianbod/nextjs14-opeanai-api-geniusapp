import React, { useState } from 'react';
import {
	MessageSquare,
	X,
	Zap,
	Code,
	FileText,
	ChevronDown,
	ChevronUp,
} from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useTranslations } from '@/context/TranslationContext';
import LocaleLink from '../hoc/LocalLink';
import Image from 'next/image';

const ChatPreview = ({ chatId, avatarUrl, onClose }) => {
	const { previewMessages, previewLoading, chatList } = useChat();
	const { isRTL } = useTranslations();
	const messages = previewMessages[chatId] || [];
	const currentChat = chatList.find((chat) => chat.id === chatId);
	const [expandedMessages, setExpandedMessages] = useState({});

	const getChatLengthColor = (messagesCount) => {
		if (messagesCount > 20) return 'bg-error';
		if (messagesCount < 5) return 'bg-success';
		return 'bg-warning';
	};

	const analyzeTokenUsage = (messages) => {
		const totalChars = messages.reduce(
			(acc, msg) => acc + msg.content.length,
			0
		);
		if (totalChars > 6000)
			return { type: 'high', label: 'High Usage', icon: Zap };
		if (totalChars > 2000)
			return { type: 'moderate', label: 'Moderate', icon: Zap };
		return { type: 'light', label: 'Light Usage', icon: Zap };
	};

	const analyzeContentType = (messages) => {
		const codeBlockCount = messages.filter((msg) =>
			msg.content.includes('```')
		).length;
		if (codeBlockCount > 3)
			return { type: 'technical', label: 'Technical', icon: Code };
		return { type: 'general', label: 'General', icon: FileText };
	};

	const handleOpenChat = () => {
		onClose();
	};

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

	const toggleMessage = (messageId) => {
		setExpandedMessages((prev) => ({
			...prev,
			[messageId]: !prev[messageId],
		}));
	};

	// Character limit for message truncation
	const CHARACTER_LIMIT = 180;

	const StatBadge = ({ analysis }) => {
		const Icon = analysis.icon;
		return (
			<div className='flex items-center gap-1.5 text-base-content/70 min-w-fit'>
				<Icon className='w-4 h-4 shrink-0' />
				<span className='hidden sm:inline'>{analysis.label}</span>
				<span className='inline sm:hidden'>{analysis.label.split(' ')[0]}</span>
			</div>
		);
	};

	const MessageContent = ({ content, isExpanded, onClick }) => {
		const shouldTruncate = content.length > CHARACTER_LIMIT;
		const displayContent =
			shouldTruncate && !isExpanded
				? content.slice(0, CHARACTER_LIMIT) + '...'
				: content;

		return (
			<div className='relative'>
				<p className='text-sm leading-relaxed text-base-content'>
					{displayContent}
				</p>
				{shouldTruncate && (
					<button
						onClick={onClick}
						className='mt-2 text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1'>
						{isExpanded ? (
							<>
								Show Less <ChevronUp className='w-4 h-4' />
							</>
						) : (
							<>
								Show More <ChevronDown className='w-4 h-4' />
							</>
						)}
					</button>
				)}
			</div>
		);
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
						{currentChat && (
							<div className='relative w-12 h-12'>
								<Image
									src={avatarUrl}
									alt={currentChat.title || 'Chat avatar'}
									width={48}
									height={48}
									className='rounded-full object-cover ring-2 ring-primary/10 transition-shadow duration-300 hover:ring-primary/20'
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

				{/* Stats Section */}
				<div className='px-4 py-3 bg-base-200/50 border-y border-base-200'>
					<div className='flex items-center justify-between text-sm text-base-content/70 whitespace-nowrap'>
						<div className='flex items-center gap-1.5 min-w-fit'>
							<div className='relative'>
								<MessageSquare className='w-4 h-4 shrink-0' />
								<div
									className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${getChatLengthColor(
										messages.length
									)} ring-1 ring-base-100`}
								/>
							</div>
							<span className='sm:inline'>{messages.length} Prompts</span>
							<span className='inline sm:hidden'>{messages.length}</span>
						</div>
						<div className='h-4 w-px bg-base-content/20 shrink-0 mx-2'></div>
						<StatBadge analysis={analyzeTokenUsage(messages)} />
						<div className='h-4 w-px bg-base-content/20 shrink-0 mx-2'></div>
						<StatBadge analysis={analyzeContentType(messages)} />
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
					<div className='relative p-4'>
						{/* Timeline Container with Start/End Markers */}
						<div className='relative'>
							{/* Start Marker */}
							<div className='absolute left-8 top-0 -translate-x-1/2 -translate-y-1/2 z-10'>
								<div className='w-2 h-2 rounded-full bg-primary'></div>
								<div className='absolute top-0 left-1/2 w-px h-3 bg-gradient-to-b from-primary to-transparent'></div>
							</div>

							{/* Vertical Timeline Line */}
							<div className='absolute left-8 top-0 bottom-0 w-px bg-base-300/30'></div>

							{/* End Marker */}
							<div className='absolute left-8 bottom-0 -translate-x-1/2 translate-y-1/2 z-10'>
								<div className='absolute bottom-0 left-1/2 w-px h-3 bg-gradient-to-t from-primary to-transparent'></div>
								<div className='w-2 h-2 rounded-full bg-primary'></div>
							</div>

							<div className='space-y-4 pt-8 pb-8'>
								{messages.map((msg, index) => (
									<LocaleLink
										href={`/chat/${chatId}?targetMessageId=${msg.id}`}
										key={msg.id}
										className='block w-full'>
										<div className='group relative flex items-start gap-4 bg-base-100 hover:bg-base-200 rounded-lg p-4 transition-colors duration-200 border border-base-200'>
											{/* Timeline Dot */}
											<div className='w-4 h-4 mt-2 rounded-full bg-primary/20 border-2 border-primary/40 shrink-0'></div>

											<div className='flex-1 min-w-0'>
												<MessageContent
													content={msg.content}
													isExpanded={expandedMessages[msg.id]}
													onClick={(e) => {
														e.preventDefault();
														toggleMessage(msg.id);
													}}
												/>
												<span className='block mt-2 text-xs text-base-content/60'>
													{formatDate(msg.timestamp)}
												</span>
											</div>
										</div>
									</LocaleLink>
								))}
							</div>
						</div>
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
					className='flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-white font-bold rounded-lg transition-colors duration-200 hover:bg-primary/90'>
					<span>View Full Conversation</span>
				</LocaleLink>
			</div>
		</div>
	);
};

export default ChatPreview;
