import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  // Theme and appearance
  darkMode: boolean;
  
  // Modals and overlays
  showGameRules: boolean;
  showSettings: boolean;
  showProfileModal: boolean;
  showLeaderboard: boolean;
  
  // Notifications
  notifications: Notification[];
  
  // Navigation
  activeTab: string;
  
  // Game UI
  showMoveHistory: boolean;
  boardRotation: number;
  enableSoundEffects: boolean;
  enableVibration: boolean;
  
  // Network status
  isOnline: boolean;
  
  // Performance
  enableAnimations: boolean;
  
  hasSeenOnboarding: boolean;
}

const initialState: UIState = {
  darkMode: true,
  
  showGameRules: false,
  showSettings: false,
  showProfileModal: false,
  showLeaderboard: false,
  
  notifications: [],
  
  activeTab: 'home',
  
  showMoveHistory: false,
  boardRotation: 0,
  enableSoundEffects: true,
  enableVibration: true,
  
  isOnline: true,
  
  enableAnimations: true,
  
  hasSeenOnboarding: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    
    // Modals
    setShowGameRules: (state, action: PayloadAction<boolean>) => {
      state.showGameRules = action.payload;
    },
    setShowSettings: (state, action: PayloadAction<boolean>) => {
      state.showSettings = action.payload;
    },
    setShowProfileModal: (state, action: PayloadAction<boolean>) => {
      state.showProfileModal = action.payload;
    },
    setShowLeaderboard: (state, action: PayloadAction<boolean>) => {
      state.showLeaderboard = action.payload;
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Navigation
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    
    // Game UI
    setShowMoveHistory: (state, action: PayloadAction<boolean>) => {
      state.showMoveHistory = action.payload;
    },
    setBoardRotation: (state, action: PayloadAction<number>) => {
      state.boardRotation = action.payload;
    },
    setEnableSoundEffects: (state, action: PayloadAction<boolean>) => {
      state.enableSoundEffects = action.payload;
    },
    setEnableVibration: (state, action: PayloadAction<boolean>) => {
      state.enableVibration = action.payload;
    },
    
    // Network
    setIsOnline: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    
    // Performance
    setEnableAnimations: (state, action: PayloadAction<boolean>) => {
      state.enableAnimations = action.payload;
    },
    
    setHasSeenOnboarding: (state, action: PayloadAction<boolean>) => {
      state.hasSeenOnboarding = action.payload;
    },
    
    // Reset UI state
    resetUI: () => initialState,
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  setShowGameRules,
  setShowSettings,
  setShowProfileModal,
  setShowLeaderboard,
  addNotification,
  removeNotification,
  clearNotifications,
  setActiveTab,
  setShowMoveHistory,
  setBoardRotation,
  setEnableSoundEffects,
  setEnableVibration,
  setIsOnline,
  setEnableAnimations,
  setHasSeenOnboarding,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer; 