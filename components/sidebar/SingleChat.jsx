// components/sidebar/SingleChat.jsx
import Image from 'next/image';
import { useParams } from 'next/navigation';
import React, { memo } from 'react';
import LocaleLink from '../hoc/LocalLink';
import { ChevronRight } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useTranslations } from '@/context/TranslationContext';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

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
		<li
			className={`
            relative 
            flex 
            items-center 
            rounded-xl 
            transition-all 
            duration-300 
            group
            hover:bg-base-300/50
            ${isActive ? 'bg-base-300/50 shadow-sm' : ''}
        `}>
			<LocaleLink
				href={`/chat/${chatId}`}
				className='flex flex-1 items-center py-3 px-3 min-w-0' // min-w-0 helps with text truncation
				onClick={onSelect}>
				{/* Persona avatar with tooltip */}
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className='relative flex-shrink-0 group-hover:scale-105 transition-transform duration-300'>
								<div className='w-10 h-10 rounded-full overflow-hidden ring-2 ring-base-300/50 group-hover:ring-primary/20'>
									<Image
										src={avatarUrl}
										alt={persona?.name || 'Model Avatar'}
										width={40}
										height={40}
										className='object-cover'
									/>
								</div>
								{/* Online indicator */}
								<div className='absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full ring-2 ring-base-100' />
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p className='text-sm'>{persona?.name || 'AI Model'}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{/* Chat info - using flex-1 and min-w-0 for proper text truncation */}
				<div className='flex-1 min-w-0 ml-3'>
					<h3 className='font-medium text-sm truncate'>{chatTitle}</h3>
					<p className='text-xs text-base-content/60 truncate'>
						{persona?.role || 'Assistant'}
					</p>
				</div>
			</LocaleLink>

			{/* Preview button with tooltip */}
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={handlePreviewClick}
							className={`
                                flex-shrink-0
                                opacity-0 
                                group-hover:opacity-100 
                                focus:opacity-100 
                                p-2 
                                mr-2
                                hover:bg-primary/10 
                                rounded-full 
                                transition-all 
                                duration-300
                                ${isRTL ? 'rotate-180' : ''}
                                ${isActive ? 'text-primary' : ''}
                            `}>
							<ChevronRight className='w-5 h-5' />
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Show chat preview</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</li>
	);
};

export default memo(SingleChat);
