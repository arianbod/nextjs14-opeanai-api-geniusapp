// components/assistant/TypingIndicator.jsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = () => {
	return (
		<div className='flex items-center gap-1 px-3 py-2 bg-base-200 rounded-lg w-16'>
			{[0, 1, 2].map((i) => (
				<motion.div
					key={i}
					className='w-2 h-2 bg-primary rounded-full'
					initial={{ y: 0 }}
					animate={{ y: [-2, 2, -2] }}
					transition={{
						duration: 0.6,
						repeat: Infinity,
						delay: i * 0.2,
						ease: 'easeInOut',
					}}
				/>
			))}
		</div>
	);
};

export default TypingIndicator;
