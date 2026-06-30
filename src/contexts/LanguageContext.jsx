// LanguageContext.jsx
// i18n stub — ready for react-i18next integration when multi-language support is needed.
// Currently provides a no-op context to avoid breaking existing imports.
// TODO: Replace with full react-i18next setup when i18n is prioritised.

import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext({ language: 'en', setLanguage: () => {} });

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');
    // Dummy t function that just returns the key, avoiding 't is not a function' crashes
    const t = (key) => {
        // Simple mapping for common terms if needed, otherwise return key
        const terms = {
            'explore': 'Explore',
            'messages': 'Messages',
            'profile': 'Profile',
            'search': 'Search'
        };
        return terms[key] || key;
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
