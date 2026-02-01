// Stubbed API module for offline mode
// This file is kept for import compatibility but provides no functionality

// Empty export to satisfy imports from files that used to use the API
export const api = {
  reducerPath: 'api',
  reducer: undefined,
  middleware: undefined,
  endpoints: {},
};

// Export empty hooks - these will be removed from components that used them
export const useRegisterMutation = () => [() => {}, { isLoading: false }] as const;
export const useLoginMutation = () => [() => {}, { isLoading: false }] as const;
export const useGetMeQuery = () => ({ data: null, isLoading: false, error: null });
export const useUpdateMeMutation = () => [() => {}, { isLoading: false }] as const;
export const useGetUserByIdQuery = () => ({ data: null, isLoading: false });
export const useSearchUsersQuery = () => ({ data: [], isLoading: false });
export const useGetLeaderboardQuery = () => ({ data: { leaderboard: [] }, isLoading: false, isFetching: false, error: null, refetch: () => {} });
export const useGetMyFriendsQuery = () => ({ data: [], isLoading: false, refetch: () => {} });
export const useCreateFriendshipMutation = () => [() => {}, { isLoading: false }] as const;
export const useUpdateFriendshipMutation = () => [() => {}, { isLoading: false }] as const;
export const useDeleteFriendshipMutation = () => [() => {}, { isLoading: false }] as const;
export const useCreateGameMutation = () => [() => {}, { isLoading: false }] as const;
export const useGetGamesQuery = () => ({ data: [], isLoading: false });
export const useGetGameByIdQuery = () => ({ data: null, isLoading: false });
export const useUpdateGameMutation = () => [() => {}, { isLoading: false }] as const;
export const useCreateMoveMutation = () => [() => {}, { isLoading: false }] as const;
export const useGetMovesQuery = () => ({ data: [], isLoading: false });
export const useGetAIMoveMutation = () => [() => {}, { isLoading: false }] as const;
export const useCreateAIGameMutation = () => [() => {}, { isLoading: false }] as const;
export const useGetAIGamesQuery = () => ({ data: [], isLoading: false });
export const useUpdateAIGameMutation = () => [() => {}, { isLoading: false }] as const;
export const useCreateTournamentMutation = () => [() => {}, { isLoading: false }] as const;
export const useGetTournamentsQuery = () => ({ data: [], isLoading: false });
export const useGetTournamentByIdQuery = () => ({ data: null, isLoading: false });
export const useUpdateTournamentMutation = () => [() => {}, { isLoading: false }] as const;
export const useCreateTournamentEntryMutation = () => [() => {}, { isLoading: false }] as const;
export const useGetTournamentEntriesQuery = () => ({ data: [], isLoading: false });
export const useCreateTournamentMatchMutation = () => [() => {}, { isLoading: false }] as const;
export const useGetTournamentMatchesQuery = () => ({ data: [], isLoading: false });
export const useCreateReportMutation = () => [() => {}, { isLoading: false }] as const;
export const useCreateFeedbackMutation = () => [() => {}, { isLoading: false }] as const;

// Stubbed WebSocket exports (kept for import compatibility)
export const matchmakingSocket = {
  connect: () => {},
  disconnect: () => {},
  isConnected: () => false,
};

export const gameSocket = {
  connect: () => {},
  disconnect: () => {},
  sendMove: () => {},
  makeMove: () => {},
  forfeit: () => {},
  isConnected: () => false,
}; 