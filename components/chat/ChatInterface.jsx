import React, { memo, useEffect, useRef, useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import AILoadingIndicator from './AILoadingIndicator';
import { useChat } from '@/context/ChatContext';
import Header from './Header';
import toast from 'react-hot-toast';
import { FaSearch, FaRegLightbulb } from 'react-icons/fa';
import { ArrowUp } from 'lucide-react';
import { useTranslations } from '@/context/TranslationContext';
import { usePreferences } from '@/context/preferencesContext';
import ImageGenerationDisplay from './ImageGeneartionDisplay';
import { nanoid } from 'nanoid';

import PinnedPreviewItem from './PinnedPreviewItem'; // <-- new import

const IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ChatInterface = () => {
	// ---- HOOKS & CONTEXT ----
	const {
		messages,
		setMessages, // (If used elsewhere in your code)
		isGenerating,
		user,
		activeChat,
		model,
		processUserMessage, // function from ChatContext that handles final message sending
		imageGeneration,
		forceImageGeneration,
	} = useChat();

	const { dict, t, isRTL } = useTranslations();
	const { showSidebar, isMobile } = usePreferences();

	// ---- LOCAL STATE ----
	const [inputText, setInputText] = useState('');
	const [uploadedFile, setUploadedFile] = useState(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	const messagesEndRef = useRef(null);
	const abortControllerRef = useRef(null);

	// Greeting logic states
	const [greetingIndex, setGreetingIndex] = useState(0);
	const [showGreeting, setShowGreeting] = useState(true);
	const [selectedSuggestion, setSelectedSuggestion] = useState(null);

	// ---- GREETING / SUGGESTION LOGIC ----
	const standardGreetings = [
		{
			title: t('chatInterface.greetings.askAnythingTitle'),
			subtitle: t('chatInterface.greetings.askAnythingSubtitle'),
		},
		{
			title: t('chatInterface.greetings.sparkCreativityTitle'),
			subtitle: t('chatInterface.greetings.sparkCreativitySubtitle'),
		},
		{
			title: t('chatInterface.greetings.researchExplainTitle'),
			subtitle: t('chatInterface.greetings.researchExplainSubtitle'),
		},
		{
			title: t('chatInterface.greetings.getInsightsTitle'),
			subtitle: t('chatInterface.greetings.getInsightsSubtitle'),
		},
		{
			title: t('chatInterface.greetings.boostProductivityTitle'),
			subtitle: t('chatInterface.greetings.boostProductivitySubtitle'),
		},
	];

	const standardSuggestions = [
		t('chatInterface.suggestions.machineLearning'),
		t('chatInterface.suggestions.writeEmail'),
		t('chatInterface.suggestions.timeManagement'),
	];

	const perplexityQuestions = [
		[
			t('chatInterface.perplexityQuestions.weatherNY'),
			t('chatInterface.perplexityQuestions.restaurantsDubai'),
			t('chatInterface.perplexityQuestions.getToTimesSquare'),
		],
		[
			t('chatInterface.perplexityQuestions.resetIphone'),
			t('chatInterface.perplexityQuestions.easyChickenRecipes'),
			t('chatInterface.perplexityQuestions.loseBellyFat'),
		],
		[
			t('chatInterface.perplexityQuestions.iphoneVsSamsung'),
			t('chatInterface.perplexityQuestions.bestWashingMachine'),
			t('chatInterface.perplexityQuestions.amazonPrimeDeals'),
		],
	];

	const greetings =
		!model || !model.showOnModelSelection
			? standardGreetings
			: model.provider === 'perplexity'
			? perplexityQuestions
			: standardGreetings;

	// Interval to change greeting
	useEffect(() => {
		const interval = setInterval(() => {
			if (!selectedSuggestion) {
				setShowGreeting(false);
				setTimeout(() => {
					setGreetingIndex((prev) => (prev + 1) % greetings.length);
					setShowGreeting(true);
				}, 300);
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [greetings.length, selectedSuggestion]);

	// ---- PINNED MESSAGES PREVIEW ----
	// We keep pinned messages in normal chronological order in `MessageList`,
	// but also show a pinned "preview bar" if any pinned messages exist:
	const pinnedMessages = messages.filter((m) => m.pinned);

	// ---- SCROLLING ----
	const scrollToBottom = () => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
		}
	};

	useEffect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	}, [messages]);

	// ---- SUGGESTION HANDLER ----
	const handleQuestionClick = (question) => {
		setInputText(question);
		setSelectedSuggestion(question);
	};

	// ---- RENDERING GREETINGS ----
	const renderPostSelectionHint = (chosenText) => (
		<div className='flex flex-col space-y-6 w-full max-w-xl mx-auto px-4 pt-64 text-center'>
			<div className='p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg'>
				<h2 className='text-2xl font-bold text-gray-800 dark:text-gray-50 mb-3'>
					{t('chatInterface.postSelectionHint.greatChoice')}
				</h2>
				<p className='text-sm text-gray-600 dark:text-gray-300 mb-3'>
					{t('chatInterface.postSelectionHint.youSelected')}{' '}
					<span className='font-medium text-gray-700 dark:text-gray-300'>
						{chosenText}
					</span>
				</p>
				<div className='text-sm text-gray-600 dark:text-gray-300 flex flex-wrap justify-center items-center gap-2'>
					{t('chatInterface.postSelectionHint.refineRequest')}
					<div className='p-2 text-gray-400 hover:text-white rounded-full bg-base-200'>
						<ArrowUp className='w-6 h-6' />
					</div>
					{t('chatInterface.postSelectionHint.sendIcon')}
				</div>
			</div>
		</div>
	);

	const renderPerplexityGreeting = () => {
		if (selectedSuggestion) {
			return renderPostSelectionHint(selectedSuggestion);
		}
		const currentQuestions = greetings[greetingIndex];
		return (
			<div className='flex flex-col space-y-6 w-full max-w-xl mx-auto px-4 pt-64'>
				<div className='text-center space-y-2'>
					<h2 className='text-2xl font-bold text-gray-800 dark:text-gray-100'>
						{t('chatInterface.perplexityGreeting.needInspiration')}{' '}
						<FaSearch className='inline-block ml-1 text-blue-500' />
					</h2>
					<p className='text-sm text-gray-600 dark:text-gray-400'>
						{t('chatInterface.perplexityGreeting.clickExample')}
					</p>
				</div>
				<div className='space-y-4'>
					<div className='space-y-2'>
						{currentQuestions.map((question, idx) => (
							<button
								key={idx}
								onClick={() => handleQuestionClick(question)}
								className='w-full text-left px-4 py-3 rounded-lg bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600 shadow-sm'>
								<span className='flex items-center text-gray-700 dark:text-gray-300'>
									<FaRegLightbulb className='mr-2 text-yellow-500' />
									{question}
								</span>
							</button>
						))}
					</div>
				</div>
				<div className='text-center text-sm text-gray-500 dark:text-gray-400'>
					{t('chatInterface.perplexityGreeting.followUp')}
				</div>
			</div>
		);
	};

	const renderStandardGreeting = () => {
		if (selectedSuggestion) {
			return renderPostSelectionHint(selectedSuggestion);
		}
		const currentGreeting = greetings[greetingIndex];
		return (
			<div className='flex flex-col items-center justify-center space-y-6 text-center px-4 max-w-xl mx-auto pt-64'>
				<div className='space-y-4'>
					<h2 className='text-2xl font-bold text-gray-800 dark:text-gray-50'>
						{currentGreeting.title}
					</h2>
					<p className='text-gray-600 dark:text-gray-300 text-base'>
						{currentGreeting.subtitle}
					</p>
				</div>
				<div className='space-y-2 w-full'>
					<p className='text-sm text-gray-600 dark:text-gray-400'>
						{t('chatInterface.standardGreeting.needIdeas')}
					</p>
					{standardSuggestions.map((suggestion, idx) => (
						<button
							key={idx}
							onClick={() => handleQuestionClick(suggestion)}
							className='w-full text-left px-4 py-3 rounded-lg bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600 shadow-sm'>
							<span className='flex items-center text-gray-700 dark:text-gray-300'>
								<FaRegLightbulb className='mr-2 text-yellow-500' />
								{suggestion}
							</span>
						</button>
					))}
				</div>
				<div className='mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2'>
					<span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
					{t('chatInterface.standardGreeting.ready')}
				</div>
			</div>
		);
	};

	// ---- FILE UPLOAD LOGIC ----
	const handleFileUpload = async (file) => {
		if (!file) {
			setUploadedFile(null);
			return;
		}
		if (file.size > MAX_FILE_SIZE) {
			toast.error(t('chatInterface.errors.fileSizeExceeded') || 'File too big');
			return;
		}
		try {
			setIsUploading(true);
			setUploadProgress(0);
			abortControllerRef.current = new AbortController();

			const reader = new FileReader();
			reader.onprogress = (event) => {
				if (event.lengthComputable) {
					const progress = (event.loaded / event.total) * 100;
					setUploadProgress(progress);
				}
			};
			const fileContent = await new Promise((resolve, reject) => {
				reader.onloadend = () => resolve(reader.result);
				reader.onerror = () =>
					reject(
						new Error(
							t('chatInterface.errors.failedToReadFile') ||
								'Failed to read file'
						)
					);
				if (file.type.startsWith('text/')) {
					reader.readAsText(file);
				} else {
					reader.readAsDataURL(file);
				}
			});

			setUploadedFile({
				name: file.name,
				type: file.type,
				content: fileContent.split(',')[1] || fileContent,
				extension: file.name.split('.').pop().toLowerCase(),
				isText: file.type.startsWith('text/'),
			});
			setIsUploading(false);
			setUploadProgress(100);
			toast.success(
				t('chatInterface.uploadSuccess', { fileName: file.name }) ||
					`Uploaded ${file.name}`
			);
		} catch (error) {
			console.error('Error uploading file:', error);
			toast.error(
				t('chatInterface.errors.fileProcessingError') || 'File error'
			);
			setIsUploading(false);
			setUploadProgress(0);
			setUploadedFile(null);
		}
	};

	const cancelUpload = () => {
		if (abortControllerRef.current) {
			setIsUploading(false);
			setUploadProgress(0);
			setUploadedFile(null);
			toast.error(
				t('chatInterface.errors.uploadCanceled') || 'Upload canceled'
			);
			abortControllerRef.current = null;
		}
	};

	const removeFile = () => {
		setUploadedFile(null);
		setUploadProgress(0);
		setIsUploading(false);
		toast.success(t('chatInterface.errors.fileRemoved') || 'File removed');
	};

	// ---- SUBMIT ----
	const handleSubmit = (e) => {
		e.preventDefault();
		processUserMessage(inputText, uploadedFile);

		// Clear states
		setInputText('');
		setUploadedFile(null);
		setUploadProgress(0);
		setSelectedSuggestion(null);
	};

	// ---- RENDER ----
	return (
		<div className='w-full max-w-3xl mx-auto rounded-xl no-scrollbar min-h-screen relative'>
			<div className='absolute inset-0 bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 -z-10'></div>

			<div className='relative flex flex-col transition-colors duration-300 min-h-screen'>
				{/* Header bar (unchanged) */}
				<Header msgLen={messages.length} />

				{/* STICKY PINNED PREVIEW BAR BELOW HEADER */}
				{/** If we have pinned messages, show a small horizontal scroller of pinned chips */}
				{pinnedMessages.length > 0 && (
					<div
						className='
              sticky
              top-[4rem]  /* Right below the header which is ~4rem high */
              z-20
              bg-base-200/90
              border-b border-base-300
              px-4 py-2
              backdrop-blur-md
              flex items-center gap-3
            '>
						<span className='text-sm font-semibold text-primary'>
							{pinnedMessages.length === 1
								? 'Pinned Message'
								: 'Pinned Messages'}
						</span>

						<div className='flex gap-2 overflow-x-auto'>
							{pinnedMessages.map((msg) => (
								<PinnedPreviewItem
									key={msg.id}
									message={msg}
								/>
							))}
						</div>
					</div>
				)}

				{/* MAIN CONTENT: MESSAGES */}
				{messages.length > 0 ? (
					<div className='flex-grow animate-fade-in-down px-4 pb-20'>
						<MessageList
							messages={messages}
							isLoading={isGenerating || isUploading}
							messagesEndRef={messagesEndRef}
						/>
						{(isGenerating || isUploading || imageGeneration.isGenerating) && (
							<div className='mx-4 my-2'>
								<AILoadingIndicator />
							</div>
						)}
						{imageGeneration.isGenerating && (
							<div className='mx-4 my-2'>
								<ImageGenerationDisplay
									isLoading={true}
									prompt={imageGeneration.prompt}
								/>
							</div>
						)}
					</div>
				) : (
					<div className='h-[40vh] w-full flex items-center justify-center'>
						{/* 
              If there's no messages, show your greeting. 
              This is the same logic you had in the 'else' block.
            */}
						<div
							className={`transition-opacity duration-300 ${
								showGreeting ? 'opacity-100' : 'opacity-0'
							}`}>
							{isGenerating || isUploading ? (
								<div className='mx-4 my-2'>
									<AILoadingIndicator />
								</div>
							) : model?.provider === 'perplexity' ? (
								renderPerplexityGreeting()
							) : (
								renderStandardGreeting()
							)}
						</div>
					</div>
				)}

				{/* FIXED MESSAGE INPUT AT BOTTOM */}
				<div
					className={`fixed bottom-0 transition-all left-0 right-0 mx-auto ${
						!isMobile && showSidebar
							? isRTL
								? '-translate-x-60'
								: 'translate-x-60'
							: ''
					}`}>
					<MessageInput
						msgLen={messages.length}
						inputText={inputText}
						setInputText={setInputText}
						handleSubmit={handleSubmit}
						isPending={
							isGenerating || isUploading || imageGeneration.isGenerating
						}
						disabled={
							!model ||
							isGenerating ||
							isUploading ||
							imageGeneration.isGenerating
						}
						modelName={model?.name || t('chatInterface.defaultModelName')}
						onFileUpload={handleFileUpload}
						uploadProgress={uploadProgress}
						isUploading={isUploading}
						uploadedFile={uploadedFile}
						onCancelUpload={cancelUpload}
						onRemoveFile={removeFile}
					/>
				</div>
			</div>
		</div>
	);
};

export default memo(ChatInterface);
