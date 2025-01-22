// /lib/dictionary.js
import { supportedLanguages } from "./supportedLanguages";

const dictionaries = supportedLanguages.reduce((acc, locale) => {
    acc[locale] = () => import(`@/lib/dic/${locale}.json`).then(module => module.default);
    return acc;
}, {});

export const getDictionary = async (locale) => {
    // Skip dictionary loading for API routes
    if (!locale || locale === 'api') {
        return {};
    }

    if (!dictionaries[locale]) {
        // Default to 'en' if unsupported locale
        return dictionaries['en']();
    }
    return dictionaries[locale]();
};