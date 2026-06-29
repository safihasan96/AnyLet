// LanguageContext.jsx
// i18n stub — ready for react-i18next integration when multi-language support is needed.
// Currently provides a no-op context to avoid breaking existing imports.
// TODO: Replace with full react-i18next setup when i18n is prioritised.

import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext({ language: 'en', setLanguage: () => {} });

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');
    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
