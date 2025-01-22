import Image from 'next/image';
import { useParams } from 'next/navigation';
import React, { memo } from 'react';
import LocaleLink from '../hoc/LocalLink';
import { ChevronRight } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useTranslations } from '@/context/TranslationContext';

const SingleChat = ({ persona, avatarUrl, chatTitle, chatId, onSelect }) => {
	const params = useParams();
	const { toggleChatPreview } = useChat();
	const { isRTL } = useTranslations();

	const handlePreviewClick = (e) => {
		e.preventDefault();
		e.stopPropagation();
		toggleChatPreview(chatId);
	};

	const isActive = params?.chatId === chatId;

	return (
		<li className='group relative flex items-center rounded-xl hover:bg-base-300 transition-colors'>
			<LocaleLink
				href={`/chat/${chatId}`}
				className={`flex flex-1 items-center py-2 px-3 gap-3 w-full
                    ${isActive ? 'bg-base-300' : ''}`}
				onClick={onSelect}>
				{/* Persona avatar */}
				<div className='flex items-center justify-center h-8 w-8 relative rounded-full overflow-hidden flex-shrink-0'>
					<Image
						src={avatarUrl}
						alt={persona?.name || 'Model Avatar'}
						width={32}
						height={32}
						className='object-cover rounded-full'
					/>
				</div>

				{/* Chat title */}
				<span className='text-sm font-medium truncate flex-1'>{chatTitle}</span>
			</LocaleLink>

			{/* Preview button */}
			<button
				onClick={handlePreviewClick}
				className={`opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 hover:bg-base-300 rounded-full transition-all duration-200
                    ${isRTL ? 'rotate-180' : ''}`}
				title='Show chat preview'>
				<ChevronRight className='w-5 h-5' />
			</button>
		</li>
	);
};

export default memo(SingleChat);
