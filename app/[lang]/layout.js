// app/layout.jsx
import '../globals.css';
import { GoogleAnalytics } from '@next/third-parties/google'
import Providers from './providers';
import { Toaster } from 'react-hot-toast';
import en from '@/lib/dic/en.json';
import { getDictionary } from '@/lib/dictionary';
import { Vazirmatn, Noto_Sans_Arabic } from 'next/font/google';
import { supportedLanguages, RTL_LANGUAGES } from '@/lib/supportedLanguages';

// Initialize the fonts
const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-vazirmatn',
  preload: true,
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});

// Fix: Changed from Vazirmatn to Noto_Sans_Arabic
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-noto-sans-arabic',
  preload: true,
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});


export async function generateStaticParams() {
  return supportedLanguages.map(lang => ({ lang }));
}

export const metadata = {
  title: en.global.title,
  description: en.global.description,
};

export default async function RootLayout({ params, children }) {
  const resolvedParams = await Promise.resolve(params);
  const lang = resolvedParams.lang;
  if (lang === 'api') {
    return children;
  }
  const dict = await getDictionary(lang);
  const isRTL = RTL_LANGUAGES.includes(lang);

  // Updated font selection logic
  const fontClass = lang === "fa" ? vazirmatn.variable :
    lang === "ar" ? notoSansArabic.variable :
      vazirmatn.variable;

  // Updated className logic for different languages
  const getFontFamily = (lang) => {
    switch (lang) {
      case 'fa':
        return 'var(--font-vazirmatn)';
      case 'ar':
        return 'var(--font-noto-sans-arabic)';
      default:
        return 'var(--font-vazirmatn)';
    }
  };

  return (
    <html lang={lang} dir={isRTL ? 'rtl' : 'ltr'} className={fontClass}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
          crossOrigin="anonymous"
        />
        <style>{`
          :root {
            --font-family: ${getFontFamily(lang)};
          }
          body {
            font-family: var(--font-family);
          }
        `}</style>
      </head>
      <body
        className={`
          ${isRTL ? 'rtl text-right' : 'ltr text-left'}
          flex 
          max-w-full 
          overflow-x-hidden 
          overflow-y-auto 
          min-h-full
        `}
      >
        <Providers translations={dict} lang={lang}>
          <Toaster
            position="top-center"
            containerClassName={isRTL ? 'rtl' : 'ltr'}
            toastOptions={{
              className: isRTL ? 'rtl' : 'ltr',
            }}
          />
          {children}
        </Providers>
        <GoogleAnalytics gaId="G-3T0PFBNMPY" />
      </body>
    </html>
  );
}
