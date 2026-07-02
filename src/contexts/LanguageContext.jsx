// LanguageContext.jsx
// i18n context — uses translations.js for English / Bengali support.

import { createContext, useContext, useState } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext({ language: 'en', setLanguage: () => {} });

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');

    const t = (key) => {
        return translations[language]?.[key] ?? translations['en']?.[key] ?? key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
