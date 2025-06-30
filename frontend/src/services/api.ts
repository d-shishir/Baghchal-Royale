import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Constants from 'expo-constants';
import { RootState } from '../store';
import { User } from '../store/slices/authSlice';

// Function to determine API base URL
const getBaseUrl = () => {
  // Production URL (replace with your actual production URL)
  const prodUrl = 'https://api.baghchal-royale.com';

  // Development: Use the host machine's IP address
  // The 'hostUri' is typically in the format '192.168.1.100:8081'
  const hostUri = Constants.expoConfig?.hostUri;
  const devUrl = hostUri ? `http://${hostUri.split(':')[0]}:8000` : 'http://localhost:8000';

  // Use the production URL in production, otherwise use the development URL
  // __DEV__ is a global variable set by React Native/Expo
  return __DEV__ ? devUrl : prodUrl;
};

const baseUrl = getBaseUrl();

// Log the base URL for debugging purposes
console.log('🚀 API requests will be sent to:', baseUrl);

const baseQuery = fetchBaseQuery({
  baseUrl,
  timeout: 15000, // 15 second timeout
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    const isGuest = (getState() as RootState).auth.guestMode;
    
    // For guest users, don't send authorization header to avoid 401 errors
    if (token && !isGuest) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    // Only set Content-Type to JSON if not already set
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQuery,
  tagTypes: ['User', 'Game', 'Stats', 'Leaderboard'],
  endpoints: (builder) => ({
    // Authentication endpoints
    register: builder.mutation<
      { 
        id: string;
        username: string;
        email: string;
        message: string;
      },
      { email: string; username: string; password: string }
    >({
      query: (credentials) => ({
        url: '/api/v1/auth/register',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    
    login: builder.mutation<
      { access_token: string; token_type: string },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: new URLSearchParams({username: credentials.email, password: credentials.password}),
      }),
      invalidatesTags: ['User'],
    }),
    
    logout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/api/v1/users/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    
    getProfile: builder.query<{
      id: string;
      email: string;
      username: string;
      created_at: string;
      games_played: number;
      games_won: number;
      tiger_wins: number;
      goat_wins: number;
      rating: number;
    }, null>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    
    updateProfile: builder.mutation<
      { success: boolean; message: string },
      { username?: string; bio?: string; country?: string }
    >({
      query: (updates) => ({
        url: '/api/v1/users/profile',
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['User'],
    }),
    
    searchUsers: builder.query<
      Array<{
        id: string;
        username: string;
        rating: number;
        games_played: number;
      }>,
      { query: string; limit?: number }
    >({
      query: ({ query, limit = 10 }) => 
        `/api/v1/users/search?query=${encodeURIComponent(query)}&limit=${limit}`,
      providesTags: ['User'],
    }),
    
    getUserProfile: builder.query<{
      id: string;
      username: string;
      created_at: string;
      games_played: number;
      games_won: number;
      tiger_wins: number;
      goat_wins: number;
      rating: number;
    }, string>({
      query: (userId) => `/api/v1/users/${userId}/profile`,
      providesTags: ['User'],
    }),
    
    getUserStats: builder.query<{
      username: string;
      games_played: number;
      games_won: number;
      tiger_wins: number;
      goat_wins: number;
      rating: number;
      win_rate: number;
    }, void>({
      query: () => '/api/v1/users/stats',
      providesTags: ['Stats'],
    }),
    
    getLeaderboard: builder.query<
      {
        success: boolean;
        message: string;
        data: Array<{
          username: string;
          rating: number;
          games_played: number;
          games_won: number;
          tiger_wins: number;
          goat_wins: number;
          win_rate: number;
        }>;
      },
      { limit?: number; offset?: number; sort_by?: 'rating' | 'games_won' | 'games_played' }
    >({
      query: ({ limit = 50, offset = 0, sort_by = 'rating' }) => 
        `/api/v1/users/leaderboard?limit=${limit}&offset=${offset}&sort_by=${sort_by}`,
      providesTags: ['Leaderboard'],
    }),
    
    // Game endpoints
    createGame: builder.mutation<
      {
        success: boolean;
        message: string;
        data: {
          game_id: string;
          mode: string;
          player_side: string;
          status: string;
        };
      },
      { mode: 'pvp' | 'pvai'; side?: 'tigers' | 'goats'; difficulty?: 'easy' | 'medium' | 'hard' }
    >({
      query: (gameData) => ({
        url: '/api/v1/games/create',
        method: 'POST',
        body: gameData,
      }),
      invalidatesTags: ['Game'],
    }),
    
    getGameState: builder.query({
      query: (gameId) => `/games/${gameId}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['Game'],
    }),
    
    makeMove: builder.mutation<
      {
        success: boolean;
        message: string;
        data: {
          game_id: string;
          board: number[][];
          phase: string;
          current_player: string;
          goats_placed: number;
          goats_captured: number;
          game_over: boolean;
          winner: string | null;
        };
      },
      {
        game_id: string;
        action_type: 'place' | 'move';
        row?: number;
        col?: number;
        from_row?: number;
        from_col?: number;
        to_row?: number;
        to_col?: number;
      }
    >({
      query: ({ game_id, ...move }) => ({
        url: `/api/v1/games/${game_id}/move`,
        method: 'POST',
        body: move,
      }),
      invalidatesTags: ['Game'],
    }),
    
    getAIMove: builder.mutation<{
      success: boolean;
      message: string;
      data: {
        game_id: string;
        board: number[][];
        phase: string;
        current_player: string;
        goats_placed: number;
        goats_captured: number;
        game_over: boolean;
        winner: string | null;
      };
    }, { game_id: string }>({
      query: ({ game_id }) => ({
        url: `/api/v1/games/${game_id}/ai-move`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Game'],
    }),
    
    getAvailableGames: builder.query<{
      success: boolean;
      data: Array<{
        game_id: string;
        mode: string;
        status: string;
        winner: string | null;
        created_at: string;
      }>;
    }, void>({
      query: () => '/api/v1/games',
      providesTags: ['Game'],
    }),
    
    resetGame: builder.mutation<
      { success: boolean; message: string },
      { game_id: string }
    >({
      query: ({ game_id }) => ({
        url: `/api/v1/games/${game_id}/reset`,
        method: 'GET',
      }),
      invalidatesTags: ['Game'],
    }),
    
    getAIStatus: builder.query<{
      ai_available: boolean;
      system_info?: any;
      active_games?: number;
      ai_games?: number;
      message?: string;
    }, void>({
      query: () => '/api/v1/games/ai/status',
      providesTags: ['Game'],
    }),
    
    // Health check
    healthCheck: builder.query<{
      message: string;
      version: string;
      status: string;
      features: string[];
    }, void>({
      query: () => '/health',
    }),
  }),
});

export const {
  // Auth hooks
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useSearchUsersQuery,
  useGetUserProfileQuery,
  useGetUserStatsQuery,
  useGetLeaderboardQuery,
  
  // Game hooks
  useCreateGameMutation,
  useGetGameStateQuery,
  useMakeMoveMutation,
  useGetAIMoveMutation,
  useGetAvailableGamesQuery,
  useResetGameMutation,
  useGetAIStatusQuery,
  
  // Utility hooks
  useHealthCheckQuery,
} = api; 