import React from "react";
import {
  createStackNavigator,
  StackNavigationProp,
} from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import { RootState } from "../store";
import { useGetMeQuery } from "../services/api";
import { GameState } from "../game-logic/baghchal";

// Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import HomeScreen from "../screens/home/HomeScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import LeaderboardScreen from "../screens/leaderboard/LeaderboardScreen";
import FriendsScreen from "../screens/friends/FriendsScreen";
import GameScreen from "../screens/game/GameScreen";
import SinglePlayerSetupScreen from "../screens/singleplayer/SinglePlayerSetupScreen";
import MultiplayerSetupScreen from "../screens/multiplayer/MultiplayerSetupScreen";
import TournamentsScreen from "../screens/tournaments/TournamentsScreen"; // Assuming you will create this
import TournamentDetailsScreen from "../screens/tournaments/TournamentDetailsScreen"; // Assuming you will create this
import LoadingScreen from "../components/LoadingScreen";
import FeedbackScreen from "../screens/feedback/FeedbackScreen";

// Navigation types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Friends: undefined;
  Tournaments: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList };
  SinglePlayerSetup: undefined;
  MultiplayerSetup: undefined;
  Game: {
    gameId: string;
    playerSide?: "TIGER" | "GOAT";
    aiDifficulty?: "EASY" | "MEDIUM" | "HARD";
    matchId?: string;
    opponentId?: string;
    gameMode?: "ai" | "online" | "local";
    initialGameState?: GameState;
  };
  TournamentDetails: { tournamentId: string };
  Feedback: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Loading: undefined;
};

// Navigation prop types
export type GameScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  "Game"
>;

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Main Tab Navigator
const MainTabNavigator = () => (
  <MainTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: React.ComponentProps<typeof Ionicons>["name"] = "home";
        if (route.name === "Home") iconName = focused ? "home" : "home-outline";
        else if (route.name === "Friends")
          iconName = focused ? "people" : "people-outline";
        else if (route.name === "Tournaments")
          iconName = focused ? "trophy" : "trophy-outline";
        else if (route.name === "Leaderboard")
          iconName = focused ? "stats-chart" : "stats-chart-outline";
        else if (route.name === "Profile")
          iconName = focused ? "person-circle" : "person-circle-outline";
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <MainTab.Screen name="Home" component={HomeScreen} />
    <MainTab.Screen name="Friends" component={FriendsScreen} />
    {/* <MainTab.Screen name="Tournaments" component={TournamentsScreen} /> */}
    <MainTab.Screen name="Leaderboard" component={LeaderboardScreen} />
    <MainTab.Screen name="Profile" component={ProfileScreen} />
  </MainTab.Navigator>
);

// Main Stack Navigator
const MainStackNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
    <MainStack.Screen
      name="SinglePlayerSetup"
      component={SinglePlayerSetupScreen}
      options={{ title: "New AI Game" }}
    />
    <MainStack.Screen
      name="MultiplayerSetup"
      component={MultiplayerSetupScreen}
    />
    <MainStack.Screen name="Game" component={GameScreen} />
    <MainStack.Screen
      name="TournamentDetails"
      component={TournamentDetailsScreen}
      options={{ title: "Tournament Details" }}
    />
    <MainStack.Screen
      name="Feedback"
      component={FeedbackScreen}
      options={{ title: "Submit Feedback" }}
    />
  </MainStack.Navigator>
);

// Root Navigator
const RootNavigator = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const token = useSelector((state: RootState) => state.auth.token);

  // Use getMe query to validate token and fetch user data
  const { isLoading } = useGetMeQuery(undefined, {
    skip: !token, // Skip if no token
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="Main" component={MainStackNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

export default RootNavigator;
