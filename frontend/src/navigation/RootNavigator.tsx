import React from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../store';
import LoadingScreen from '../components/LoadingScreen';
import { AuthNavigator, MainStackNavigator } from './MainNavigator';

const RootNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  if (loading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <MainStackNavigator /> : <AuthNavigator />;
};

export default RootNavigator; 