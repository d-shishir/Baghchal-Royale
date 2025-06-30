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
  } = useGetProfileQuery(null, {
    skip: !shouldFetchProfile,
  });

  useEffect(() => {
    if (profileData && shouldFetchProfile) {
      dispatch(updateProfile(profileData));
    }
  }, [profileData, shouldFetchProfile, dispatch]);

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