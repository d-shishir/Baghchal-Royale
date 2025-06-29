import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../store';
import LoadingScreen from '../components/LoadingScreen';
import { AuthNavigator, MainStackNavigator } from './MainNavigator';
import { useGetProfileQuery } from '../services/api';
import { updateProfile } from '../store/slices/authSlice';

// Component to load user profile data after login
const ProfileLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, guestMode, user } = useSelector((state: RootState) => state.auth);
  
  // Only fetch profile if authenticated and not in guest mode and user has temp-id
  const shouldFetchProfile = isAuthenticated && !guestMode && user?.id === 'temp-id';
  
  const {
    data: profileData,
    error: profileError,
    isLoading: profileLoading,
  } = useGetProfileQuery(undefined, {
    skip: !shouldFetchProfile,
  });

  useEffect(() => {
    if (profileData && shouldFetchProfile) {
      console.log('Updating user profile with data:', profileData);
      dispatch(updateProfile({
        id: profileData.id,
        username: profileData.username,
        email: profileData.email,
        rating: profileData.rating,
        games_played: profileData.games_played,
        games_won: profileData.games_won,
        tiger_wins: profileData.tiger_wins,
        goat_wins: profileData.goat_wins,
        created_at: profileData.created_at,
      }));
    }
  }, [profileData, shouldFetchProfile, dispatch]);

  useEffect(() => {
    if (profileError && shouldFetchProfile) {
      console.warn('Failed to load user profile:', profileError);
      // Don't crash the app, just log the error
      // The user can still use the app with basic profile data
    }
  }, [profileError, shouldFetchProfile]);

  return <>{children}</>;
};

const RootNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ProfileLoader>
      {isAuthenticated ? <MainStackNavigator /> : <AuthNavigator />}
    </ProfileLoader>
  );
};

export default RootNavigator; 