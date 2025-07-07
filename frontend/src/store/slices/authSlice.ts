import { createSlice, PayloadAction, isRejectedWithValue } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { User as ApiUser, Token as ApiToken } from '../../services/types';

export type User = ApiUser;
export type Token = ApiToken;

interface AuthState {
  isAuthenticated: boolean;
  isGuest: boolean;
  user: User | null;
  token: string | null;
  loading: 'idle' | 'pending';
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isGuest: false,
  user: null,
  token: null,
  loading: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.isGuest = false;
      state.token = null;
      state.user = null;
    },
    setGuest: (state, action: PayloadAction<User>) => {
        state.isAuthenticated = true;
        state.isGuest = true;
        state.user = action.payload;
        state.token = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        api.endpoints.login.matchFulfilled,
        (state, { payload }: PayloadAction<Token>) => {
          state.token = payload.access_token;
          state.isAuthenticated = true;
          state.isGuest = false;
          state.loading = 'idle';
        }
      )
      .addMatcher(
        api.endpoints.getMe.matchFulfilled,
        (state, { payload }: PayloadAction<User>) => {
          state.user = payload;
          state.isAuthenticated = true;
          state.isGuest = false;
          state.loading = 'idle';
        }
      )
      .addMatcher(
        api.endpoints.getMe.matchRejected,
        (state, action) => {
            state.isAuthenticated = false;
            state.isGuest = false;
            state.token = null;
            state.user = null;
        }
      )
      .addMatcher(
        api.endpoints.updateMe.matchFulfilled,
        (state, { payload }: PayloadAction<User>) => {
            state.user = payload;
            state.loading = 'idle';
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.loading = 'pending';
          state.error = null;
        }
      )
      .addMatcher(
        isRejectedWithValue,
        (state, action) => {
          state.loading = 'idle';
          const errorPayload = action.payload as { data?: { detail?: string }; status?: number };
          state.error = errorPayload.data?.detail || 'An unknown error occurred';
        }
      );
  },
});

export const { logout, setGuest } = authSlice.actions;

export default authSlice.reducer; 