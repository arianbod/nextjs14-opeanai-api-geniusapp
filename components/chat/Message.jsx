import React, { memo, useState } from 'react';
import Image from 'next/legacy/image';
import toast from 'react-hot-toast';
import { Copy, Share2, MapPin, Star, StarOff, FileText } from 'lucide-react';

import { useChat } from '@/context/ChatContext';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * We now get pinned, starred, and notes from props
 * (passed in by MessageList). No more "messages.find(...)"
 */
const Message = ({
	messageId,
	role,
	content,
	timestamp,
	pinned = false,
	starred = false,
	notes = '',
	highlight = false,
}) => {
	const {
		activeChat,
		togglePinMessage,
		toggleStarMessage,
		updateMessageNotes,
	} = useChat();

	const isUser = role === 'user';

	// For inline note UI
	const [notesOpen, setNotesOpen] = useState(!!notes); // open if there is an existing note
	const [notesEditMode, setNotesEditMode] = useState(false);
	const [notesDraft, setNotesDraft] = useState(notes);

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		toast.success(
			`${isUser ? 'Your' : activeChat.model?.name || 'AI'} message copied!`
		);
	};

	const formatTimestamp = (ts) => {
		return new Date(ts).toLocaleTimeString();
	};

	// Handler to save notes
	const handleSaveNotes = async () => {
		await updateMessageNotes(messageId, notesDraft);
		setNotesEditMode(false);
	};

	return (
		<div
			id={`message-${messageId}`}
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
				{/* MESSAGE CONTENT */}
				<div className='w-full overflow-x-auto text-wrap'>
					<MarkdownRenderer
						content={content}
						isUser={isUser}
						copyToClipboard={copyToClipboard}
						activeChat={activeChat}
					/>
				</div>

				{/* INLINE NOTES */}
				{notesOpen ? (
					<div className='mt-3 bg-base-200 dark:bg-gray-700 p-2 rounded-lg transition-all'>
						<div className='flex items-center justify-between mb-1'>
							<span className='text-xs font-semibold text-base-content/60'>
								{notesEditMode ? 'Editing Note' : notes ? 'Note' : 'Add Note'}
							</span>
							<button
								onClick={() =>
									notesEditMode ? setNotesEditMode(false) : setNotesOpen(false)
								}
								className='text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'>
								{notesEditMode ? 'Cancel' : 'Hide'}
							</button>
						</div>

						{notesEditMode ? (
							<div className='flex flex-col gap-2'>
								<textarea
									className='w-full h-20 p-2 border dark:border-gray-600 rounded text-sm focus:outline-none bg-base-100 dark:bg-gray-800 text-base-content'
									value={notesDraft}
									onChange={(e) => setNotesDraft(e.target.value)}
								/>
								<div className='flex justify-end gap-2'>
									<button
										onClick={() => {
											setNotesDraft(notes);
											setNotesEditMode(false);
										}}
										className='px-3 py-1 text-sm bg-gray-300 dark:bg-gray-600 rounded hover:opacity-90'>
										Cancel
									</button>
									<button
										onClick={handleSaveNotes}
										className='px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600'>
										Save
									</button>
								</div>
							</div>
						) : (
							<div className='flex flex-col gap-2'>
								{notes ? (
									<p className='text-sm text-base-content/80 whitespace-pre-wrap'>
										{notes}
									</p>
								) : (
									<p className='text-sm text-base-content/50 italic'>
										No note yet.
									</p>
								)}
								<div className='flex justify-end'>
									<button
										onClick={() => {
											setNotesDraft(notes);
											setNotesEditMode(true);
										}}
										className='px-2 py-1 text-xs rounded hover:bg-base-300 dark:hover:bg-gray-600'>
										Edit
									</button>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className='mt-2 text-right'>
						<button
							onClick={() => setNotesOpen(true)}
							className='text-xs text-primary hover:underline'>
							{notes ? 'Show Note' : 'Add Note'}
						</button>
					</div>
				)}

				{/* FOOTER ROW: TIME + ACTIONS */}
				<div className='mt-3 pt-3 border-t border-base-300 dark:border-gray-700 flex justify-between items-center'>
					{/* TIMESTAMP */}
					<span
						className={`text-[11px] ${
							isUser
								? 'text-gray-600 dark:text-gray-400'
								: 'text-gray-500 dark:text-gray-500'
						}`}>
						{formatTimestamp(timestamp)}
					</span>

					<div className='flex items-center gap-2'>
						{/* COPY */}
						<button
							className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center gap-1'
							onClick={() => copyToClipboard(content)}
							title='Copy message'>
							<Copy
								size={14}
								className='text-gray-600 dark:text-gray-400'
							/>
						</button>

						{/* SHARE */}
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
								size={14}
								className='text-gray-600 dark:text-gray-400'
							/>
						</button>

						{/* PIN */}
						<button
							className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center gap-1'
							onClick={() => togglePinMessage(messageId)}
							title={pinned ? 'Unpin' : 'Pin this message'}>
							<MapPin
								size={14}
								className={
									pinned
										? 'text-green-600 dark:text-green-300'
										: 'text-gray-600 dark:text-gray-400'
								}
							/>
						</button>

						{/* STAR */}
						<button
							className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center gap-1'
							onClick={() => toggleStarMessage(messageId)}
							title={starred ? 'Unstar' : 'Star this message'}>
							{starred ? (
								<Star
									size={16}
									className='text-yellow-500'
									fill='currentColor'
								/>
							) : (
								<StarOff
									size={16}
									className='text-gray-600 dark:text-gray-400'
								/>
							)}
						</button>

						{/* NOTES ICON */}
						<button
							className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center gap-1'
							onClick={() => setNotesOpen((o) => !o)}
							title='Open/close notes'>
							<FileText
								size={14}
								className='text-gray-600 dark:text-gray-400'
							/>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default memo(Message);
