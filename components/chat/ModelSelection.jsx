// @/components/ModelSelection.js

import React, { useState, useMemo, memo, useEffect } from 'react';
import SearchComponent from './SearchComponent';
import { AIPersonas } from '@/lib/Personas';
import { useChat } from '@/context/ChatContext';
import { motion } from 'framer-motion';
import PersonaSuggester from './PersonaSuggester';
import ModelCard from './ModelCard';
import { useTranslations } from '@/context/TranslationContext';

// ModelCard component remains unchanged as it fits well with our UX goals

const ModelSelection = () => {
	const { model, handleModelSelect, chatList } = useChat();
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const { t } = useTranslations(); // Destructure only 't' as 'dict' is not used directly
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		// Initial check
		checkMobile();

		// Add event listener
		window.addEventListener('resize', checkMobile);

		// Cleanup
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	const AvailableAIPersonas = useMemo(
		() => AIPersonas.filter((persona) => persona.showOnModelSelection === true),
		[]
	);

	// Dynamically get unique categories from personas
	const categories = useMemo(() => {
		const uniqueCategories = new Set(['all']);
		AvailableAIPersonas.forEach((persona) => {
			if (persona.categories && Array.isArray(persona.categories)) {
				persona.categories.forEach(
					(category) =>
						uniqueCategories.add(category.toLowerCase().replace(/\s+/g, '_')) // Normalize to lowercase and underscores
				);
			}
		});
		return Array.from(uniqueCategories).map((category) => ({
			id: category,
			name:
				category === 'all'
					? t('modelSelection.categories.all')
					: t(`modelSelection.categories.${category}`),
		}));
	}, [AvailableAIPersonas, t]);

	// Filter and sort personas
	const filteredPersonas = useMemo(() => {
		let filtered = AvailableAIPersonas;

		// Apply search filter
		if (searchTerm) {
			const lowerSearch = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(persona) =>
					persona.name.toLowerCase().includes(lowerSearch) ||
					persona.description?.toLowerCase().includes(lowerSearch) ||
					persona.features?.bestFor?.some((feature) =>
						feature.toLowerCase().includes(lowerSearch)
					)
			);
		}

		// Apply category filter
		if (selectedCategory !== 'all') {
			filtered = filtered.filter((persona) =>
				persona.categories
					?.map((cat) => cat.toLowerCase().replace(/\s+/g, '_'))
					.includes(selectedCategory)
			);
		}

		// Sort by rating and then by name
		return filtered.sort((a, b) => {
			if (a.rating !== b.rating) return b.rating - a.rating;
			return a.name.localeCompare(b.name);
		});
	}, [AvailableAIPersonas, searchTerm, selectedCategory]);

	// Get recently used models
	const recentModels = useMemo(() => {
		if (!chatList?.length) return [];
		const recentModelIds = new Set();
		const recent = [];

		for (const chat of chatList) {
			if (recent.length >= 2) break;
			if (!recentModelIds.has(chat.modelCodeName)) {
				const modelPersona = AvailableAIPersonas.find(
					(p) => p.modelCodeName === chat.modelCodeName
				);
				if (modelPersona) {
					recent.push(modelPersona);
					recentModelIds.add(chat.modelCodeName);
				}
			}
		}

		return recent;
	}, [chatList, AvailableAIPersonas]);

	return (
		<div className='min-h-screen w-full bg-base-100'>
			<SearchComponent
				onSearch={setSearchTerm}
				placeholder={t('modelSelection.searchPlaceholder')}
			/>

			<div className='max-w-4xl mx-auto px-6 py-8'>
				{/* Recent Models */}
				{!isMobile &&
					recentModels.length > 0 &&
					!searchTerm &&
					selectedCategory === 'all' && (
						<div className='mb-8 hidden lg:block'>
							<h2 className='text-lg font-semibold mb-4 text-base-content font-persian'>
								{t('modelSelection.recent')}
							</h2>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								{recentModels.map((persona) => (
									<ModelCard
										key={persona.key}
										persona={persona}
										onSelect={handleModelSelect}
										isSelected={model?.key === persona.key}
									/>
								))}
							</div>
						</div>
					)}

				<PersonaSuggester onSelect={handleModelSelect} />

				{/* Categories */}
				<div className='mb-8 overflow-x-auto mx-auto flex place-items-center place-content-center'>
					<div className='flex gap-2 pb-2 flex-wrap select-none place-content-center mx-auto'>
						{categories.map((category) => (
							<button
								key={category.id}
								onClick={() => setSelectedCategory(category.id)}
								className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                                    transition-colors duration-200 ${
																			selectedCategory === category.id
																				? 'bg-base-300 text-base-content'
																				: 'bg-base-200 text-base-content/70 hover:bg-base-300'
																		}`}>
								{category.name}
							</button>
						))}
					</div>
				</div>

				{/* All Models */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
					{filteredPersonas.map((persona) => (
						<ModelCard
							key={persona.key}
							persona={persona}
							onSelect={handleModelSelect}
							isSelected={model?.key === persona.key}
						/>
					))}
				</div>

				{/* Empty State */}
				{filteredPersonas.length === 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className='text-center py-12'>
						<p className='text-base-content/60'>
							{t('modelSelection.noModelsFound')}
						</p>
					</motion.div>
				)}
			</div>
		</div>
	);
};

export default memo(ModelSelection);
