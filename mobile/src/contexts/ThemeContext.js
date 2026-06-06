import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const { colorScheme, setColorScheme } = useColorScheme();

    useEffect(() => {
        AsyncStorage.getItem('app-theme').then(val => {
            if (val) {
                setColorScheme(val);
            }
        });
    }, [setColorScheme]);

    const toggleTheme = async () => {
        const next = colorScheme === 'dark' ? 'light' : 'dark';
        setColorScheme(next);
        await AsyncStorage.setItem('app-theme', next);
    };

    return (
        <ThemeContext.Provider value={{ isDark: colorScheme === 'dark', toggleTheme, theme: colorScheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
