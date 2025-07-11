import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';
import * as T from './types';
import { GameStatus } from '../game-logic/baghchal';
import { aPI_URL } from '../config';

console.log('🚀 API requests will be sent to:', aPI_URL);

const baseQuery = fetchBaseQuery({
  baseUrl: aPI_URL,
  timeout: 15000,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQuery,
  tagTypes: ['User', 'Friendship', 'Game', 'Move', 'AIGame', 'AIMove', 'Tournament', 'Report', 'Feedback', 'Leaderboard'],
  endpoints: (builder) => ({
    // Auth
    register: builder.mutation<T.User, T.UserCreate>({
      query: (credentials) => ({
        url: '/api/v1/auth/register',
        method: 'POST',
        body: credentials,
      }),
    }),
    login: builder.mutation<T.Token, T.Login>({
      query: (credentials) => {
        const body = new URLSearchParams();
        body.append('username', credentials.username);
        body.append('password', credentials.password);
        return {
          url: '/api/v1/auth/login',
          method: 'POST',
          body: body.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        };
      },
    }),
    getMe: builder.query<T.User, void>({
      query: () => '/api/v1/users/me',
      providesTags: ['User'],
    }),
    updateMe: builder.mutation<T.User, T.UserUpdate>({
      query: (updates) => ({
        url: '/api/v1/users/me',
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['User'],
    }),

    // Users
    getUserById: builder.query<T.User, string>({
      query: (userId) => `/api/v1/users/${userId}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    searchUsers: builder.query<T.User[], string>({
      query: (query) => `/api/v1/users/search?query=${encodeURIComponent(query)}`,
    }),
    getLeaderboard: builder.query<T.User[], void>({
      query: () => '/api/v1/users/leaderboard',
      providesTags: ['Leaderboard'],
    }),

    // Friendships
    getMyFriends: builder.query<T.Friendship[], void>({
      query: () => '/api/v1/friends/',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ friendship_id }) => ({ type: 'Friendship' as const, id: friendship_id })),
              { type: 'Friendship', id: 'LIST' },
            ]
          : [{ type: 'Friendship', id: 'LIST' }],
    }),
    createFriendship: builder.mutation<T.Friendship, { user_id_1: string; user_id_2: string }>({
      query: (body) => ({
        url: '/api/v1/friends/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Friendship', id: 'LIST' }],
    }),
    updateFriendship: builder.mutation<T.Friendship, { friendship_id: string; status: T.FriendshipStatus }>({
        query: ({ friendship_id, status }) => ({
            url: `/api/v1/friends/${friendship_id}`,
            method: 'PUT',
            body: { status }
        }),
        invalidatesTags: (result, error, { friendship_id }) => [{ type: 'Friendship', id: 'LIST' }],
    }),
    deleteFriendship: builder.mutation<void, { friendship_id: string }>({
      query: ({ friendship_id }) => ({
        url: `/api/v1/friends/${friendship_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { friendship_id }) => [{ type: 'Friendship', id: friendship_id }, { type: 'Friendship', id: 'LIST' }],
    }),

    // Games
    createGame: builder.mutation<T.Game, T.GameCreate>({
      query: (data) => ({
        url: '/api/v1/games/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Game'],
    }),
    getGames: builder.query<T.Game[], { status?: GameStatus } | void>({
      query: (params) => ({
        url: '/api/v1/games/',
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ game_id }) => ({ type: 'Game' as const, id: game_id })),
              { type: 'Game', id: 'LIST' },
            ]
          : [{ type: 'Game', id: 'LIST' }],
    }),
    getGameById: builder.query<T.Game, string>({
      query: (gameId) => `/api/v1/games/${gameId}`,
      providesTags: (result, error, id) => [{ type: 'Game', id }],
    }),
    updateGame: builder.mutation<T.Game, { gameId: string; data: T.GameUpdate }>({
      query: ({ gameId, data }) => ({
        url: `/api/v1/games/${gameId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { gameId }) => [{ type: 'Game', id: gameId }],
    }),

    // Moves
    createMove: builder.mutation<T.Move, T.MoveCreate>({
        query: (data) => ({
            url: '/api/v1/moves/',
            method: 'POST',
            body: data,
        }),
        invalidatesTags: ['Move'],
    }),
    getMoves: builder.query<T.Move[], string>({
        query: (gameId) => `/api/v1/moves/${gameId}`,
        providesTags: ['Move'],
    }),

    // AI
    getAIMove: builder.mutation<{ move: T.PotentialMove; ai_game_id: string }, { difficulty: string; game_state: T.GameState, user_id: string, ai_game_id?: string, player_side: string }>({
      query: (data) => ({
        url: '/api/v1/ai/move',
        method: 'POST',
        body: data,
      }),
    }),

    // AI Games
    createAIGame: builder.mutation<T.AIGame, T.AIGameCreate>({
        query: (data) => ({
            url: '/api/v1/ai-games/',
            method: 'POST',
            body: data
        }),
        invalidatesTags: ['AIGame'],
    }),

    // Tournaments
    createTournament: builder.mutation<T.Tournament, T.TournamentCreate>({
        query: (data) => ({
            url: '/api/v1/tournaments/',
            method: 'POST',
            body: data
        }),
        invalidatesTags: ['Tournament'],
    }),
    getTournaments: builder.query<T.Tournament[], void>({
        query: () => '/api/v1/tournaments/',
        providesTags: ['Tournament'],
    }),
    getTournamentById: builder.query<T.Tournament, string>({
        query: (id) => `/api/v1/tournaments/${id}`,
        providesTags: (result, error, id) => [{ type: 'Tournament', id }],
    }),
    updateTournament: builder.mutation<T.Tournament, {id: string, data: T.TournamentUpdate}>({
        query: ({id, data}) => ({
            url: `/api/v1/tournaments/${id}`,
            method: 'PUT',
            body: data,
        }),
        invalidatesTags: (result, error, { id }) => [{ type: 'Tournament', id }],
    }),
    createTournamentEntry: builder.mutation<T.TournamentEntry, {tournId: string, data: T.TournamentEntryCreate}>({
        query: ({tournId, data}) => ({
            url: `/api/v1/tournaments/${tournId}/entries`,
            method: 'POST',
            body: data,
        }),
        invalidatesTags: ['Tournament'],
    }),
    getTournamentEntries: builder.query<T.TournamentEntry[], string>({
        query: (tournId) => `/api/v1/tournaments/${tournId}/entries`,
        providesTags: ['Tournament'],
    }),
    createTournamentMatch: builder.mutation<T.TournamentMatch, {tournId: string, data: T.TournamentMatchCreate}>({
        query: ({tournId, data}) => ({
            url: `/api/v1/tournaments/${tournId}/matches`,
            method: 'POST',
            body: data,
        }),
        invalidatesTags: ['Tournament'],
    }),
    getTournamentMatches: builder.query<T.TournamentMatch[], string>({
        query: (tournId) => `/api/v1/tournaments/${tournId}/matches`,
        providesTags: ['Tournament'],
    }),

    // Reports
    createReport: builder.mutation<T.Report, T.ReportCreate>({
        query: (data) => ({
            url: '/api/v1/reports/',
            method: 'POST',
            body: data,
        }),
    }),

    // Feedback
    createFeedback: builder.mutation<T.Feedback, T.FeedbackCreate>({
        query: (data) => ({
            url: '/api/v1/feedback/',
            method: 'POST',
            body: data,
        }),
    }),
  }),
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useGetMeQuery,
    useUpdateMeMutation,
    useGetUserByIdQuery,
    useSearchUsersQuery,
    useGetLeaderboardQuery,
    useGetMyFriendsQuery,
    useCreateFriendshipMutation,
    useUpdateFriendshipMutation,
    useDeleteFriendshipMutation,
    useCreateGameMutation,
    useGetGamesQuery,
    useGetGameByIdQuery,
    useUpdateGameMutation,
    useCreateMoveMutation,
    useGetMovesQuery,
    useGetAIMoveMutation,
    useCreateAIGameMutation,
    useCreateTournamentMutation,
    useGetTournamentsQuery,
    useGetTournamentByIdQuery,
    useUpdateTournamentMutation,
    useCreateTournamentEntryMutation,
    useGetTournamentEntriesQuery,
    useCreateTournamentMatchMutation,
    useGetTournamentMatchesQuery,
    useCreateReportMutation,
    useCreateFeedbackMutation,
} = api;

// Export WebSocket services
export { matchmakingSocket, gameSocket } from './websocket'; 