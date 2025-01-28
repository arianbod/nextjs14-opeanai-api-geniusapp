import React from 'react';
import { X } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

/**
 * A small "chip" or "card" for each pinned message.
 * Display a snippet, plus "Jump" or "Unpin" actions.
 */
const PinnedPreviewItem = ({ message }) => {
	const { togglePinMessage } = useChat();

	// Show a small snippet of the content
	const snippet =
		message.content.length > 80
			? message.content.slice(0, 80) + '...'
			: message.content;

	const handleJump = () => {
		const target = document.getElementById(`message-${message.id}`);
		if (target) {
			target.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	};

	const handleUnpin = () => {
		togglePinMessage(message.id);
	};

	return (
		<div className='bg-base-100 dark:bg-gray-700 border border-base-300 dark:border-gray-600 rounded-md p-2 min-w-[180px] max-w-[250px] shadow-sm flex flex-col justify-between'>
			<p className='text-xs text-base-content/70 line-clamp-2 break-words'>
				{snippet}
			</p>
			<div className='flex justify-between items-center mt-2'>
				<button
					onClick={handleJump}
					className='text-[10px] text-primary hover:underline'
					title='Jump to pinned message in the chat'>
					Jump
				</button>
				<button
					onClick={handleUnpin}
					className='text-[10px] text-red-500 hover:underline flex items-center gap-1'
					title='Unpin this message'>
					<X className='w-3 h-3' />
					Unpin
				</button>
			</div>
		</div>
	);
};

export default PinnedPreviewItem;
