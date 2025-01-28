'use client';

import React, { memo, useState, useEffect, useRef } from 'react';
import SidebarHeader from './SidebarHeader';
import MobileHeader from './MobileHeader';
import TokenSection from './TokenSection';
import { useAuth } from '@/context/AuthContext';
import { FaBars } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { BsPinAngle, BsPinAngleFill } from 'react-icons/bs';
import { HiChevronRight, HiChevronLeft } from 'react-icons/hi';
import { useChat } from '@/context/ChatContext';
import { useTranslations } from '@/context/TranslationContext';
import SingleChat from './SingleChat';
import ChatPreview from '../chat/ChatPreview';
import { AIPersonas } from '@/lib/Personas';
import MemberProfile from './member-profile/MemberProfile';
import { PenBoxIcon, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import LocaleLink from '../hoc/LocalLink';
import { usePreferences } from '@/context/preferencesContext';
import toast from 'react-hot-toast';

/**
 * CHANGED: more flexible date category function.
 * If the difference in days < 1 => Today,
 * if < 2 => Yesterday, if < 7 => Last 7 days, etc.
 */
const getDateCategory = (timestamp) => {
	const now = new Date();
	const date = new Date(timestamp);
	const diffTime = now - date;
	const diffDays = diffTime / (1000 * 60 * 60 * 24);

	if (diffDays < 0) {
		// If local time is behind or something else, treat as 'Today'
		return 'Today';
	}
	if (diffDays < 1) return 'Today';
	if (diffDays < 2) return 'Yesterday';
	if (diffDays < 7) return 'Last 7 days';
	if (diffDays < 14) return 'Last 14 days';
	if (diffDays < 17) return 'Last 17 days';
	if (diffDays < 30) return 'Last 30 days';
	return 'Older';
};

const Sidebar = () => {
	const { isPinned, setIsHovered, isHovered, showSidebar, setSidebarPinned } =
		usePreferences();
	const { user } = useAuth();
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
	const {
		chatList,
		resetChat,
		showChatPreview,
		previewChatId,
		toggleChatPreview,
	} = useChat();
	const { dict, isRTL } = useTranslations();
	const [isMobile, setIsMobile] = useState(false);
	const [isTablet, setIsTablet] = useState(false);
	const params = useParams();
	const previewRef = useRef(null);
	const sidebarRef = useRef(null);

	/**
	 * CHANGED: We rely on chat.updatedAt or createdAt as the "timestamp".
	 * If you prefer updatedAt as "last activity," be sure to pass that
	 * to getDateCategory below.
	 */
	const groupChatsByDate = () => {
		const groups = {
			Today: [],
			Yesterday: [],
			'Last 7 days': [],
			'Last 30 days': [],
			Older: [],
		};

		chatList.forEach((chat) => {
			// Decide which date field you want to use for grouping:
			const relevantDate = chat.updatedAt || chat.createdAt;
			const category = getDateCategory(relevantDate);

			// Make sure category is one of the keys above
			if (!groups[category]) {
				groups[category] = [];
			}
			groups[category].push(chat);
		});

		// Sort chats within each group by date descending
		Object.keys(groups).forEach((key) => {
			groups[key].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
		});

		return groups;
	};

	// Click outside handler for preview
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				showChatPreview &&
				previewRef.current &&
				!previewRef.current.contains(event.target) &&
				!event.target.closest('[data-chat-item]') &&
				!event.target.closest('[data-preview-button]')
			) {
				toggleChatPreview(null);
			}
		};

		if (showChatPreview) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showChatPreview, toggleChatPreview]);

	// Enhanced responsive detection
	useEffect(() => {
		const checkResponsive = () => {
			setIsMobile(window.innerWidth < 768);
			setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
		};

		checkResponsive();
		window.addEventListener('resize', checkResponsive);
		return () => window.removeEventListener('resize', checkResponsive);
	}, []);

	if (!user) return null;

	const getPersonaByChat = (chat) => {
		if (!chat?.provider || !chat?.modelCodeName) return null;
		return AIPersonas.find(
			(p) =>
				p.provider === chat.provider && p.modelCodeName === chat.modelCodeName
		);
	};

	const handleMouseEnter = () => {
		if (!isPinned) setIsHovered(true);
	};

	const handleMouseLeave = () => {
		if (!isPinned) {
			setIsHovered(false);
			// Close chat preview when sidebar is closed
			toggleChatPreview(null);
		}
	};

	const handleCloseSidebars = () => {
		setMobileSidebarOpen(false);
		toggleChatPreview(null);
	};

	// Calculate sidebar and preview positioning classes
	const sidebarPositionClass = isRTL ? 'right-0' : 'left-0';
	const previewPositionClass = isRTL ? 'right-80' : 'left-80';
	const closeButtonPositionClass = isRTL ? 'left-0' : 'right-0';

	return (
		<>
			{/* Mobile Menu Button */}
			<div
				className={`
          lg:hidden 
          fixed 
          top-3 
          z-50 
          ${sidebarPositionClass}
          ${mobileSidebarOpen ? 'hidden' : ''}
        `}>
				<button
					onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
					className='p-4 bg-base-200/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-base-300/80 active:scale-95 transition-all'>
					{mobileSidebarOpen ? (
						<MdClose className='w-6 h-6' />
					) : (
						<FaBars className='w-6 h-6' />
					)}
				</button>
			</div>

			{/* Desktop Hover Area */}
			{!isPinned && (
				<div
					className={`hidden lg:flex fixed ${sidebarPositionClass} top-0 w-8 h-full z-30 items-center hover:bg-base-300/20 transition-colors`}
					onMouseEnter={handleMouseEnter}>
					<div
						className={`
              flex items-center gap-2 px-1 py-3 
              ${isRTL ? 'rounded-l-lg' : 'rounded-r-lg'} 
              bg-base-300/40 hover:bg-base-300/60 transition-colors
            `}>
						{isRTL ? (
							<HiChevronLeft className='w-6 h-6 text-base-content/50' />
						) : (
							<HiChevronRight className='w-6 h-6 text-base-content/50' />
						)}
					</div>
				</div>
			)}

			{/* Main Sidebar Container */}
			<div
				ref={sidebarRef}
				onMouseLeave={handleMouseLeave}
				className={`
          fixed 
          inset-y-0 
          ${sidebarPositionClass}
          z-40 
          flex
          ${isMobile || isTablet ? 'w-full md:w-80' : 'w-80'}
          transform
          ${
						mobileSidebarOpen
							? 'translate-x-0'
							: isRTL
							? 'translate-x-full'
							: '-translate-x-full'
					}
          ${
						isPinned || isHovered
							? 'lg:translate-x-0'
							: isRTL
							? 'lg:translate-x-full'
							: 'lg:-translate-x-full'
					}
          transition-transform 
          duration-300 
          ease-out
        `}>
				{/* Sticky Close Button for Mobile */}
				{isMobile && mobileSidebarOpen && (
					<button
						onClick={handleCloseSidebars}
						className={`
              absolute 
              ${closeButtonPositionClass} 
              top-1/2 
              transform 
              -translate-y-1/2
              ${isRTL ? '-translate-x-1' : 'translate-x-1'}
              bg-base-200 
              p-4 
              rounded-full 
              shadow-lg 
              hover:bg-base-300 
              z-50
            `}>
						<MdClose className='w-6 h-6' />
					</button>
				)}

				{/* Main Sidebar */}
				<div className='flex flex-col h-full bg-base-200/95 backdrop-blur-xl border-r border-base-300/50 relative w-80'>
					{/* Pin Button */}
					<button
						className={`hidden lg:flex absolute top-4 ${
							isRTL ? 'left-4' : 'right-4'
						} items-center justify-center hover:bg-base-300 rounded-full transition-colors p-2 z-50`}
						onClick={() => setSidebarPinned(!isPinned)}
						title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}>
						{isPinned ? (
							<BsPinAngleFill className='w-5 h-5' />
						) : (
							<BsPinAngle className='w-5 h-5' />
						)}
					</button>

					{/* Conditional Header */}
					{isMobile ? <MobileHeader /> : <SidebarHeader />}

					{/* Token Section */}
					<TokenSection className='px-4 py-2 mb-2' />

					{/* Chat List */}
					<div className='flex-1 overflow-y-auto px-2'>
						<div className='flex items-center justify-between mb-4'>
							<h3 className='text-md font-semibold text-base-content/50'>
								{dict.sidebar.conversations}
							</h3>
							<LocaleLink
								onClick={() => {
									resetChat();
									handleCloseSidebars();
								}}
								href='/chat'
								className='flex items-center gap-4 text-primary hover:bg-base-300 rounded-full transition-colors p-2'>
								<PenBoxIcon className='w-6 h-6' />
							</LocaleLink>
						</div>

						{Object.entries(groupChatsByDate()).map(([category, chats]) => {
							if (chats.length === 0) return null;

							return (
								<div
									key={category}
									className='mb-2'>
									{/* Minimal date divider */}
									<div className='flex items-center gap-2 my-2'>
										<div className='h-px flex-1 bg-base-300/30'></div>
										<span className='text-xs font-medium text-base-content/50'>
											{category}
										</span>
										<div className='h-px flex-1 bg-base-300/30'></div>
									</div>

									{/* Chat items */}
									<ul className='space-y-2 w-full'>
										{chats.map((chat) => {
											const persona = getPersonaByChat(chat);
											const avatarUrl =
												persona?.avatar || '/images/default-avatar.png';
											const chatTitle = chat.title.replace(`"`, '');

											return (
												<SingleChat
													key={chat.id}
													chatId={chat.id}
													persona={persona}
													avatarUrl={avatarUrl}
													chatTitle={chatTitle}
													onSelect={handleCloseSidebars}
												/>
											);
										})}
									</ul>
								</div>
							);
						})}
					</div>

					{/* Account Section */}
					<MemberProfile />
				</div>

				{/* Chat Preview - Desktop & Tablet */}
				{showChatPreview && !isMobile && (
					<>
						{/* Close Button for Preview */}
						<button
							onClick={() => toggleChatPreview(null)}
							className={`
                fixed 
                top-4 
                ${isRTL ? 'left-4' : 'right-4'}
                z-40
                p-2 
                bg-base-300/80 
                hover:bg-base-300 
                text-base-content
                hover:text-primary
                rounded-full 
                transition-all 
                duration-200
                backdrop-blur-sm
                shadow-lg
              `}
							style={{
								[isRTL ? 'marginLeft' : 'marginRight']: '320px',
							}}>
							<X className='w-5 h-5' />
						</button>
						<div
							ref={previewRef}
							className={`
                w-80 
                h-full 
                fixed 
                top-0 
                ${previewPositionClass}
                transform 
                transition-transform 
                duration-300 
                ease-out
                ${
									showChatPreview
										? 'translate-x-0'
										: isRTL
										? '-translate-x-full'
										: 'translate-x-full'
								}
                z-30
              `}>
							<ChatPreview
								chatId={previewChatId}
								avatarUrl={
									// If the chat is in chatList, find it and get the persona avatar
									// else fallback
									(chatList.find((c) => c.id === previewChatId) &&
										getPersonaByChat(
											chatList.find((c) => c.id === previewChatId)
										)?.avatar) ||
									'/images/default-avatar.png'
								}
								onClose={() => toggleChatPreview(null)}
							/>
						</div>
					</>
				)}
			</div>

			{/* Mobile Overlay - Closes on any click */}
			{mobileSidebarOpen && (
				<div
					className='fixed inset-0 bg-black/50 backdrop-blur-[2px] z-30 lg:hidden transition-opacity duration-200'
					onClick={handleCloseSidebars}
				/>
			)}

			{/* Chat Preview - Mobile */}
			{showChatPreview && isMobile && (
				<>
					<div
						className='fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40'
						onClick={() => toggleChatPreview(null)}
					/>
					<div className='fixed inset-x-0 bottom-0 h-2/3 bg-base-200 rounded-t-xl shadow-lg transform transition-all duration-300 ease-out z-50'>
						<ChatPreview
							chatId={previewChatId}
							avatarUrl={
								(chatList.find((c) => c.id === previewChatId) &&
									getPersonaByChat(chatList.find((c) => c.id === previewChatId))
										?.avatar) ||
								'/images/default-avatar.png'
							}
							onClose={() => toggleChatPreview(null)}
						/>
					</div>
				</>
			)}
		</>
	);
};

export default memo(Sidebar);
