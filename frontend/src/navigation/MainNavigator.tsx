import React from "react";
import {
  createStackNavigator,
  StackNavigationProp,
} from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameState } from "../game-logic/baghchal";
import { theme as staticTheme, useAppTheme } from "../theme";

// Screens
import HomeScreen from "../screens/home/HomeScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import GameScreen from "../screens/game/GameScreen";
import SinglePlayerSetupScreen from "../screens/singleplayer/SinglePlayerSetupScreen";
import MultiplayerSetupScreen from "../screens/multiplayer/MultiplayerSetupScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";

// Navigation types
export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList };
  SinglePlayerSetup: undefined;
  MultiplayerSetup: undefined;
  Game: {
    gameId: string;
    playerSide?: "TIGER" | "GOAT";
    aiDifficulty?: "EASY" | "MEDIUM" | "HARD";
    gameMode?: "ai" | "local";
    initialGameState?: GameState;
  };
};

export type RootStackParamList = {
  Main: undefined;
};

// Navigation prop types
export type GameScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  "Game"
>;

const MainTab = createBottomTabNavigator<MainTabParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

// Main Tab Navigator - simplified for offline mode
const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>["name"] = "home";
          if (route.name === "Home") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Profile")
            iconName = focused ? "person-circle" : "person-circle-outline";
          else if (route.name === "Settings")
            iconName = focused ? "settings" : "settings-outline";
          return <Ionicons name={iconName} size={size + 4} color={color} />;
        },
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
      <MainTab.Screen name="Settings" component={SettingsScreen} />
    </MainTab.Navigator>
  );
};

// Main Stack Navigator
const MainStackNavigator = () => {
  const theme = useAppTheme();
  
  return (
    <MainStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background }, 
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        }
      }}
    >
      <MainStack.Screen 
        name="MainTabs" 
        component={MainTabNavigator} 
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="SinglePlayerSetup"
        component={SinglePlayerSetupScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="MultiplayerSetup"
        component={MultiplayerSetupScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="Game" 
        component={GameScreen} 
        options={{ headerShown: false }}
      />
    </MainStack.Navigator>
  );
};

// Root Navigator - No auth check, direct to main
const RootNavigator = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={MainStackNavigator} />
    </RootStack.Navigator>
  );
};

export default RootNavigator;
