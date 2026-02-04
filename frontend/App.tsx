import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import * as SplashScreen from 'expo-splash-screen';

import { store, persistor } from './src/store';
import { theme } from './src/theme';
import RootNavigator from './src/navigation/MainNavigator';
import LoadingScreen from './src/components/LoadingScreen';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { AlertProvider } from './src/contexts/AlertContext';
import AnimatedSplash from './src/screens/AnimatedSplash';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // App initialization - simplified for development
        console.log('Initializing Baghchal Royale app...');
        
        // Artificially delay for better UX (optional, can be removed if fast enough)
        // await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('App initialization error:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onSplashAnimationComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <PaperProvider theme={theme}>
          <NotificationProvider>
            <AlertProvider>
              <View style={{ flex: 1 }}>
                <NavigationContainer>
                  <StatusBar style="auto" />
                  <RootNavigator />
                </NavigationContainer>
                {showSplash && (
                  <AnimatedSplash onAnimationComplete={onSplashAnimationComplete} />
                )}
              </View>
            </AlertProvider>
          </NotificationProvider>
        </PaperProvider>
      </PersistGate>
    </ReduxProvider>
  );
}
 