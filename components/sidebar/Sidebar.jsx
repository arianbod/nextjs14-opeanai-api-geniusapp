'use client';

import React, { memo, useState, useEffect } from 'react';
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
import { PenBoxIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import LocaleLink from '../hoc/LocalLink';
import { usePreferences } from '@/context/preferencesContext';

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
		if (!chat.provider || !chat.modelCodeName) return null;
		return AIPersonas.find(
			(p) =>
				p.provider === chat.provider && p.modelCodeName === chat.modelCodeName
		);
	};

	const handleMouseEnter = () => {
		if (!isPinned) setIsHovered(true);
	};

	const handleMouseLeave = () => {
		if (!isPinned) setIsHovered(false);
	};

	const handleCloseSidebars = () => {
		setMobileSidebarOpen(false);
		toggleChatPreview(null);
	};

	// Calculate sidebar and preview positioning classes
	const sidebarPositionClass = isRTL ? 'right-0' : 'left-0';
	const previewPositionClass = isRTL ? 'right-80' : 'left-80';

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
						className={`flex items-center gap-2 px-1 py-3 ${
							isRTL ? 'rounded-l-lg' : 'rounded-r-lg'
						} bg-base-300/40 hover:bg-base-300/60 transition-colors`}>
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
						<ul className='space-y-2 w-full'>
							{chatList.map((chat) => {
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

					{/* Account Section */}
					<MemberProfile />
				</div>

				{/* Chat Preview - Desktop & Tablet */}
				{showChatPreview && !isMobile && (
					<div
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
							onClose={() => toggleChatPreview(null)}
						/>
					</div>
				)}
			</div>

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
							onClose={() => toggleChatPreview(null)}
						/>
					</div>
				</>
			)}

			{/* Mobile Overlay */}
			{mobileSidebarOpen && (
				<div
					className='fixed inset-0 bg-black/50 backdrop-blur-[2px] z-30 lg:hidden transition-opacity duration-200'
					onClick={handleCloseSidebars}
				/>
			)}
		</>
	);
};

export default memo(Sidebar);
