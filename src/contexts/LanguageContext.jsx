// LanguageContext.jsx
// i18n stub — ready for react-i18next integration when multi-language support is needed.
// Provides a passthrough `t(key)` function so all existing consumers work without crashing.
// TODO: Replace with full react-i18next setup when i18n is prioritised.

import { createContext, useContext, useState, useCallback } from 'react';

// Minimal translation map for Bangladesh-specific labels used across the UI.
// Expand this object when adding real i18n support.
const translations = {
    en: {
        // Bottom nav
        explore:          'Explore',
        map:              'Map',
        messages:         'Messages',
        profile:          'Profile',
        // Settings
        settings:         'Settings',
        dark_mode:        'Dark Mode',
        language:         'Language',
        notifications:    'Notifications',
        sign_out:         'Sign Out',
        // Home hero
        hero_title:       'Find your',
        hero_perfect:     'perfect',
        hero_space:       'space in',
        hero_seconds:     'seconds',
        search_placeholder: 'Search by area, district or property type...',
        search:           'Search',
    },
    bn: {
        // Bottom nav
        explore:          'এক্সপ্লোর',
        map:              'মানচিত্র',
        messages:         'বার্তা',
        profile:          'প্রোফাইল',
        // Settings
        settings:         'সেটিংস',
        dark_mode:        'ডার্ক মোড',
        language:         'ভাষা',
        notifications:    'বিজ্ঞপ্তি',
        sign_out:         'সাইন আউট',
        // Home hero
        hero_title:       'আপনার',
        hero_perfect:     'আদর্শ',
        hero_space:       'বাড়ি খুঁজুন',
        hero_seconds:     'মুহূর্তে',
        search_placeholder: 'এলাকা, জেলা বা সম্পত্তির ধরন দিয়ে খুঁজুন...',
        search:           'খুঁজুন',
    },
};


const defaultT = (key) => translations.en[key] ?? key;

const LanguageContext = createContext({
    language: 'en',
    setLanguage: () => {},
    t: defaultT,
});

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');

    const t = useCallback(
        (key) => translations[language]?.[key] ?? translations.en[key] ?? key,
        [language]
    );

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

