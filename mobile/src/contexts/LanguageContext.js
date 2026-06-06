import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        // Load persisted language
        AsyncStorage.getItem('app-language').then(val => {
            if (val) setLanguage(val);
        });
    }, []);

    const changeLanguage = async (lang) => {
        setLanguage(lang);
        await AsyncStorage.setItem('app-language', lang);
    };

    const t = (key) => {
        return translations[language]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;
