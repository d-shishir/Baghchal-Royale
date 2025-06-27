import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  username: string;
  rating: number;
  games_played: number;
  games_won: number;
  tiger_wins: number;
  goat_wins: number;
  created_at: string;
  bio?: string;
  country?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  isRegistering: boolean;
  guestMode: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  refreshToken: null,
  user: null,
  loading: false,
  error: null,
  isRegistering: false,
  guestMode: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Loading states
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    registerStart: (state) => {
      state.isRegistering = true;
      state.error = null;
    },
    
    // Success states
    loginSuccess: (state, action: PayloadAction<{
      access_token: string;
      refresh_token: string;
      user: User;
    }>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      state.user = action.payload.user;
      state.error = null;
      state.guestMode = false;
    },
    
    registerSuccess: (state, action: PayloadAction<{
      access_token: string;
      refresh_token: string;
      user: User;
    }>) => {
      state.isRegistering = false;
      state.isAuthenticated = true;
      state.token = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      state.user = action.payload.user;
      state.error = null;
      state.guestMode = false;
    },
    
    guestLogin: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = 'guest-token';
      state.refreshToken = 'guest-refresh-token';
      state.user = action.payload;
      state.error = null;
      state.guestMode = true;
    },
    
    // Failure states
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.error = action.payload;
      state.guestMode = false;
    },
    
    registerFailure: (state, action: PayloadAction<string>) => {
      state.isRegistering = false;
      state.error = action.payload;
    },
    
    // User actions
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.loading = false;
      state.error = null;
      state.isRegistering = false;
      state.guestMode = false;
    },
    
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    updateStats: (state, action: PayloadAction<{
      games_played?: number;
      games_won?: number;
      tiger_wins?: number;
      goat_wins?: number;
      rating?: number;
    }>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    updateToken: (state, action: PayloadAction<{
      access_token: string;
      refresh_token?: string;
    }>) => {
      state.token = action.payload.access_token;
      if (action.payload.refresh_token) {
        state.refreshToken = action.payload.refresh_token;
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  loginStart,
  registerStart,
  loginSuccess,
  registerSuccess,
  guestLogin,
  loginFailure,
  registerFailure,
  logout,
  updateProfile,
  updateStats,
  updateToken,
  clearError,
  setLoading,
} = authSlice.actions;

export default authSlice.reducer; 