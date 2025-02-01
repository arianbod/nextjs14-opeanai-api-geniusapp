import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypePrism from 'rehype-prism-plus';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
	vs,
	vscDarkPlus,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

// Import languages
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/cjs/languages/prism/python';
import java from 'react-syntax-highlighter/dist/cjs/languages/prism/java';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import sql from 'react-syntax-highlighter/dist/cjs/languages/prism/sql';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/markdown';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import markup from 'react-syntax-highlighter/dist/cjs/languages/prism/markup';

// Register languages
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('markup', markup);
SyntaxHighlighter.registerLanguage('jsx', javascript);
SyntaxHighlighter.registerLanguage('html', markup);

// Import the enhanced CodeBlock component
import CodeBlock from './CodeBlock';

// Helper functions
const isRTL = (text) => {
	if (!text || typeof text !== 'string') return false;
	const rtlRegex =
		/[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
	return rtlRegex.test(text.trim()[0]);
};

const detectLanguage = (text) => {
	if (!text || typeof text !== 'string') return 'default';
	const persianRegex = /[\u0600-\u06FF]/;
	const arabicRegex = /[\u0627-\u064A]/;
	if (persianRegex.test(text)) return 'persian';
	if (arabicRegex.test(text)) return 'arabic';
	return 'default';
};

const extractTextContent = (node) => {
	if (typeof node === 'string') return node;
	if (Array.isArray(node)) return node.map(extractTextContent).join('');
	if (node?.props?.children) return extractTextContent(node.props.children);
	if (node?.props?.value) return node.props.value;
	return '';
};

// Custom inline code styling for variables
const VariableInline = ({ children }) => (
	<span className='font-bold text-indigo-600 underline'>{children}</span>
);

export default function MarkdownRenderer({
	content,
	isUser,
	copyToClipboard,
	activeChat,
	onAddToNote,
}) {
	const MarkdownComponents = {
		img: ({ src, alt }) => {
			const isGeneratedImage = alt?.toLowerCase().includes('generated image');
			if (!src) return null;
			return (
				<div className='my-4 max-w-2xl mx-auto'>
					<div className='relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800'>
						<img
							src={src}
							alt={alt || 'Generated image'}
							className='object-cover w-full rounded-lg'
							loading='lazy'
							onError={(e) => {
								console.error('Image load error:', src);
								e.target.src = '/placeholder-image.png';
							}}
						/>
						{isGeneratedImage && (
							<div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
								<button
									onClick={() => window.open(src, '_blank')}
									className='p-2 bg-black/50 hover:bg-black/70 rounded-full text-white'
									title='Open image in new tab'>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										className='h-4 w-4'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'>
										<path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
										<polyline points='15 3 21 3 21 9' />
										<line
											x1='10'
											y1='14'
											x2='21'
											y2='3'
										/>
									</svg>
								</button>
							</div>
						)}
					</div>
					{alt && (
						<p className='mt-2 text-sm text-center text-gray-500 dark:text-gray-400'>
							{alt}
						</p>
					)}
				</div>
			);
		},
		p: ({ children }) => {
			const text = extractTextContent(children);
			const rtl = isRTL(text);
			const lang = detectLanguage(text);
			return (
				<div
					className={`mb-4 last:mb-0 leading-7 text-gray-800 dark:text-gray-200 ${
						rtl ? 'text-right' : 'text-left'
					} ${lang === 'persian' ? 'font-persian' : ''} ${
						lang === 'arabic' ? 'font-arabic' : ''
					}`}
					dir={rtl ? 'rtl' : 'ltr'}>
					{children}
				</div>
			);
		},
		h3: ({ children }) => {
			const text = extractTextContent(children);
			const rtl = isRTL(text);
			const lang = detectLanguage(text);
			return (
				<h3
					className={`text-lg font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100 ${
						rtl ? 'text-right' : 'text-left'
					} ${lang === 'persian' ? 'font-persian' : ''} ${
						lang === 'arabic' ? 'font-arabic' : ''
					}`}
					dir={rtl ? 'rtl' : 'ltr'}>
					{children}
				</h3>
			);
		},
		hr: () => (
			<hr className='my-6 border-t border-gray-200 dark:border-gray-700' />
		),
		blockquote: ({ children }) => {
			const text = extractTextContent(children);
			const rtl = isRTL(text);
			const lang = detectLanguage(text);
			return (
				<blockquote
					className={`border-l-4 border-gray-200 dark:border-gray-700 pl-4 my-4 italic text-gray-700 dark:text-gray-300 ${
						rtl ? 'text-right border-r-4 pr-4 pl-0 border-l-0' : ''
					} ${lang === 'persian' ? 'font-persian' : ''} ${
						lang === 'arabic' ? 'font-arabic' : ''
					}`}
					dir={rtl ? 'rtl' : 'ltr'}>
					{children}
				</blockquote>
			);
		},
		ul: ({ children }) => (
			<ul className='list-disc pl-6 mb-4 space-y-2 text-gray-800 dark:text-gray-200'>
				{children}
			</ul>
		),
		ol: ({ children }) => (
			<ol className='list-decimal pl-6 mb-4 space-y-2 text-gray-800 dark:text-gray-200'>
				{children}
			</ol>
		),
		li: ({ children }) => {
			const text = extractTextContent(children);
			const rtl = isRTL(text);
			const lang = detectLanguage(text);
			return (
				<li
					className={`leading-relaxed ${rtl ? 'text-right' : 'text-left'} ${
						lang === 'persian' ? 'font-persian' : ''
					} ${lang === 'arabic' ? 'font-arabic' : ''}`}
					dir={rtl ? 'rtl' : 'ltr'}>
					{children}
				</li>
			);
		},
		table: ({ children }) => (
			<div className='w-full overflow-x-auto my-6'>
				<table className='w-full border-collapse bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700'>
					{children}
				</table>
			</div>
		),
		thead: ({ children }) => (
			<thead className='bg-gray-100 dark:bg-gray-800'>{children}</thead>
		),
		th: ({ children }) => {
			const text = extractTextContent(children);
			const rtl = isRTL(text);
			const lang = detectLanguage(text);
			return (
				<th
					className={`px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 ${
						rtl ? 'text-right' : 'text-left'
					} ${lang === 'persian' ? 'font-persian' : ''} ${
						lang === 'arabic' ? 'font-arabic' : ''
					}`}
					dir={rtl ? 'rtl' : 'ltr'}>
					{children}
				</th>
			);
		},
		td: ({ children }) => {
			const text = extractTextContent(children);
			const rtl = isRTL(text);
			const lang = detectLanguage(text);
			return (
				<td
					className={`px-6 py-4 text-sm border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 ${
						rtl ? 'text-right' : 'text-left'
					} ${lang === 'persian' ? 'font-persian' : ''} ${
						lang === 'arabic' ? 'font-arabic' : ''
					}`}
					dir={rtl ? 'rtl' : 'ltr'}>
					{children}
				</td>
			);
		},
		code({ node, inline, className, children, ...props }) {
			const codeContent = extractTextContent(children);
			if (inline) {
				if (!className || className === 'language-default') {
					return <VariableInline>{children}</VariableInline>;
				}
				return (
					<code
						className='bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm'
						{...props}>
						{children}
					</code>
				);
			} else {
				const match = /language-(\w+)/.exec(className || '');
				const language = match ? match[1] : 'text';
				return (
					<CodeBlock
						language={language}
						codeContent={codeContent}
						onAddToNote={onAddToNote}
					/>
				);
			}
		},
		math: ({ value }) => (
			<div className='py-2 overflow-x-auto'>
				<div
					className='katex-display'
					dangerouslySetInnerHTML={{ __html: value }}
				/>
			</div>
		),
		inlineMath: ({ value }) => (
			<span
				className='katex-inline'
				dangerouslySetInnerHTML={{ __html: value }}
			/>
		),
	};

	return (
		<ReactMarkdown
			remarkPlugins={[remarkMath, remarkGfm]}
			rehypePlugins={[rehypeKatex, [rehypePrism, { ignoreMissing: true }]]}
			components={MarkdownComponents}>
			{content}
		</ReactMarkdown>
	);
}
