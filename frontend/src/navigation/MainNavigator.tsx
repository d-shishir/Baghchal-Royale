import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from 'react-native';

// Import actions
import { logout } from '../store/slices/authSlice';
import { startLocalPVPGame } from '../store/slices/gameSlice';
import { RootState } from '../store';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import SinglePlayerContainer from '../containers/SinglePlayerContainer';
import GameContainer from '../containers/GameContainer';
import EditProfileModal from '../components/EditProfileModal';

// Import API hooks
import { useGetProfileQuery } from '../services/api';

// Define navigation types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  SinglePlayerSetup: undefined;
  MultiplayerSetup: undefined;
  Game: { gameId?: string; mode: 'pvp' | 'pvai' | 'pvp-local' };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

// Auth Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Home Screen Wrapper
const HomeScreenWrapper = ({ navigation }: any) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const guestMode = useSelector((state: RootState) => state.auth.guestMode);
  const dispatch = useDispatch();

  const handlePlaySinglePlayer = () => {
    navigation.navigate('SinglePlayerSetup');
  };

  const handlePlayLocalPVP = () => {
    dispatch(startLocalPVPGame());
    navigation.navigate('Game', { mode: 'pvp-local' });
  };

  const handlePlayMultiplayer = () => {
    if (guestMode) {
      Alert.alert(
        'Account Required',
        'Please create an account to play multiplayer games.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('MultiplayerSetup');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  const handleViewLeaderboard = () => {
    navigation.navigate('Leaderboard');
  };

  const handleShowGameRules = () => {
    Alert.alert(
      'Baghchal Rules',
      '🐯 4 Tigers vs 🐐 20 Goats\n\n• Tigers move first\n• Tigers win by capturing 5 goats\n• Goats win by blocking all tiger movements\n• Game has 2 phases: placement and movement'
    );
  };

  // Convert user to match expected interface
  const homeUser = user ? {
    username: user.username,
    rating: user.rating,
    games_played: user.games_played,
    games_won: user.games_won,
  } : undefined;

  return (
    <HomeScreen
      user={homeUser}
      onPlaySinglePlayer={handlePlaySinglePlayer}
      onPlayLocalPVP={handlePlayLocalPVP}
      onPlayMultiplayer={handlePlayMultiplayer}
      onViewProfile={handleViewProfile}
      onViewLeaderboard={handleViewLeaderboard}
      onShowGameRules={handleShowGameRules}
    />
  );
};

// Profile Screen Wrapper
const ProfileScreenWrapper = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const guestMode = useSelector((state: RootState) => state.auth.guestMode);
  const [showEditModal, setShowEditModal] = React.useState(false);
  
  // Get fresh profile data
  const { data: profileData, refetch: refetchProfile } = useGetProfileQuery(null, {
    skip: guestMode || !user,
  });

  const handleEditProfile = () => {
    if (guestMode) {
      Alert.alert(
        'Account Required',
        'Please create an account to edit your profile.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    // Refetch profile data to get updated information
    refetchProfile();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => dispatch(logout()) },
      ]
    );
  };

  const handleViewAchievement = () => {
    console.log('View achievements');
    Alert.alert('Coming Soon', 'Achievements will be available soon!');
  };

  // Mock game history with proper types
  const gameHistory = [
    {
      id: '1',
      opponent: 'AI',
      result: 'won' as const,
      date: '2024-01-15',
      duration: '15:30',
      side: 'tigers' as const,
      rating_change: +25,
    },
    {
      id: '2',
      opponent: 'Player123',
      result: 'lost' as const,
      date: '2024-01-14',
      duration: '22:45',
      side: 'goats' as const,
      rating_change: -18,
    },
    {
      id: '3',
      opponent: 'AI',
      result: 'won' as const,
      date: '2024-01-13',
      duration: '18:20',
      side: 'goats' as const,
      rating_change: +22,
    },
  ];

  // Use profile data from API if available, otherwise fall back to user from auth
  const currentUser = profileData || user;

  return (
    <>
      <ProfileScreen
        user={currentUser}
        guestMode={guestMode}
        gameHistory={gameHistory}
        onEditProfile={handleEditProfile}
        onLogout={handleLogout}
        onViewAchievement={handleViewAchievement}
      />
      <EditProfileModal
        visible={showEditModal}
        user={currentUser}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

// Leaderboard Screen Wrapper
const LeaderboardScreenWrapper = () => {
  const guestMode = useSelector((state: RootState) => state.auth.guestMode);

  if (guestMode) {
    return (
      <LeaderboardScreen 
        showGuestMessage={true}
        leaderboardData={[]}
        loading={false}
        error={null}
        onRefresh={() => {}}
      />
    );
  }

  return <LeaderboardScreen />;
};

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Leaderboard') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e74c3c',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#333',
        },
        headerShown: false,
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreenWrapper} />
      <MainTab.Screen name="Leaderboard" component={LeaderboardScreenWrapper} />
      <MainTab.Screen name="Profile" component={ProfileScreenWrapper} />
    </MainTab.Navigator>
  );
};

// Main Stack Navigator
const MainStackNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
      <MainStack.Screen name="SinglePlayerSetup" component={SinglePlayerContainer} />
      {/* TODO: Create Multiplayer setup screen */}
      {/* <MainStack.Screen name="MultiplayerSetup" component={MultiplayerSetupScreen} /> */}
      <MainStack.Screen name="Game" component={GameContainer} />
    </MainStack.Navigator>
  );
};

// Root Navigator
const RootNavigator = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      {isAuthenticated ? (
        <RootStack.Screen name="Main" component={MainStackNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

// Export AuthNavigator for use in RootNavigator
export { AuthNavigator };

// Export MainStackNavigator as the main navigator
export { MainStackNavigator };

export default RootNavigator; 