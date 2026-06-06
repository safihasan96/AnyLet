import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { usePropertyStore } from './src/store/propertyStore';
import "./global.css"; // NativeWind v4 styling import

// A wrapper to handle initialization side effects inside the contexts
function AppContent() {
  const { isDark } = useTheme();
  const initializeAuth = useAuthStore(state => state.initializeListener);
  const fetchProperties = usePropertyStore(state => state.fetchProperties);
  const destroyProperties = usePropertyStore(state => state.destroyListener);

  useEffect(() => {
    // Start firebase auth state change observer
    const unsubscribeAuth = initializeAuth();

    // Start real-time listings observer
    const unsubscribeProperties = fetchProperties();

    return () => {
      unsubscribeAuth();
      destroyProperties();
    };
  }, [initializeAuth, fetchProperties, destroyProperties]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
