import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Simplified types for offline mode
export interface User {
    user_id: string;
    username: string;
    email?: string;
    country?: string;
    role: "USER" | "ADMIN" | "MODERATOR";
    status: "OFFLINE" | "ONLINE" | "INGAME";
    rating: number;
    level: number;
    xp: number;
    achievements: string[];
    games_played: number;
    wins: number;
    losses: number;
    created_at: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isGuest: boolean;
  user: User | null;
  token: string | null;
  loading: 'idle' | 'pending';
  error: string | null;
}

/** Total XP maps to levels: 0–99 → L1, 100–199 → L2, … (matches Profile progress UI). */
function syncLevelFromXp(user: User) {
  user.level = Math.floor(user.xp / 100) + 1;
}

// Default offline user
const defaultOfflineUser: User = {
  user_id: 'local-user',
  username: 'Player',
  email: 'local@offline.app',
  country: 'Nepal',
  role: 'USER',
  status: 'OFFLINE',
  rating: 1000,
  level: 1,
  xp: 0,
  achievements: [],
  games_played: 0,
  wins: 0,
  losses: 0,
  created_at: new Date().toISOString(),
};

const initialState: AuthState = {
  isAuthenticated: true, // Always authenticated in offline mode
  isGuest: false,
  user: defaultOfflineUser,
  token: null,
  loading: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // In offline mode, logout just resets to default user
      state.user = defaultOfflineUser;
    },
    setGuest: (state, action: PayloadAction<User>) => {
        state.isAuthenticated = true;
        state.isGuest = true;
        state.user = action.payload;
        state.token = null;
    },
    updateLocalUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        syncLevelFromXp(state.user);
      }
    },
    incrementWins: (state) => {
      if (state.user) {
        state.user.wins += 1;
        state.user.games_played += 1;
        state.user.xp += 50;
        syncLevelFromXp(state.user);
      }
    },
    incrementLosses: (state) => {
      if (state.user) {
        state.user.losses += 1;
        state.user.games_played += 1;
        state.user.xp += 10;
        syncLevelFromXp(state.user);
      }
    },
    grantAdReward: (state, action: PayloadAction<{ amount?: number } | undefined>) => {
      if (state.user) {
        const amount = action.payload?.amount ?? 25;
        state.user.xp += amount;
        syncLevelFromXp(state.user);
      }
    },
  },
  // No extraReducers - removed all API dependencies
});

export const { logout, setGuest, updateLocalUser, incrementWins, incrementLosses, grantAdReward } = authSlice.actions;

export default authSlice.reducer; 