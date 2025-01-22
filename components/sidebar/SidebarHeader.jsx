// components/SidebarHeader.jsx
import React, { memo } from 'react';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import Link from 'next/link';
import Image from 'next/image';
import ShowTokenAmount from '../token/ShowTokenAmount';
import { useChat } from '@/context/ChatContext';
import { useTranslations } from '@/context/TranslationContext';
import { useParams } from 'next/navigation';
import LocaleLink from '../hoc/LocalLink';

const SidebarHeader = () => {
	const { resetChat } = useChat();
	const { dict } = useTranslations();
	const params = useParams();
	return (
		<div className='flex flex-col py-6 px-6'>
			<div className='flex flex-col items-center justify-between mb-4'>
				<div className=' flex flex-col items-center gap-4'>
					<LocaleLink
						className='flex gap-4 place-items-center'
						onClick={() => resetChat()}
						href={`/chat`}>
						<div className='relative w-16 h-16  '>
							<Image
								alt='logo'
								src='/images/babagpt_bw.svg'
								width={64}
								height={64}
								// fill='contain'

								className='rounded-full shadow-lg bg-slate-800 w-16 h-16 '
							/>
						</div>
						<h1 className='text-2xl tracking-wide capitalize font-semibold'>
							{dict.global.title}
						</h1>
						{/* <Link
							onClick={() => resetChat()}
							href={`/${params.lang}/chat`}
							className='text-2xl tracking-wide capitalize font-semibold'>
						</Link> */}
					</LocaleLink>
					<div className='flex flex-col'>
						<div className='flex gap-2  place-items-center justify-center'>
							<ThemeToggle />
							<LanguageToggle />
						</div>
						{/* <ShowTokenAmount /> */}
					</div>
				</div>
			</div>
		</div>
	);
};

export default memo(SidebarHeader);
