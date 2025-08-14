import { GameState, PotentialMove } from "../game-logic/baghchal";

export type { GameState, PotentialMove };

export enum BackendGameStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
}

// Alias for API compatibility
export { BackendGameStatus as GameStatus };


// General
export interface Token {
    access_token: string;
    token_type: string;
}

// User
export interface User {
    user_id: string;
    email: string;
    username: string;
    country?: string;
    role: "USER" | "ADMIN" | "MODERATOR";
    status: "OFFLINE" | "ONLINE" | "INGAME";
    rating: number;
    level: number;
    xp: number;
    achievements: string[];
    games_played?: number;
    wins?: number;
    losses?: number;
    win_rate?: number;
    created_at: string;
    last_login?: string;
}

export interface LeaderboardResponse {
    leaderboard: User[];
    my_rank?: number | null;
}

export interface UserCreate {
    email: string;
    username: string;
    password: string;
    is_superuser?: boolean;
    country?: string;
    level?: number;
    xp?: number;
    achievements?: string[];
}

export interface UserUpdate {
    email?: string;
    username?: string;
    country?: string;
    password?: string;
}

export interface Login {
    username: string;
    password: string;
}

// Player - a leaner version of User for game contexts
export interface Player {
    user_id: string;
    username: string;
}

// Friendship
export enum FriendshipStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED',
}

export interface Friendship {
    friendship_id: string;
    user_id_1: string;
    user_id_2: string;
    status: FriendshipStatus;
    created_at: string;
    user1: User;
    user2: User;
}

export interface FriendshipCreate {
    user_id_1: string;
    user_id_2: string;
}

// Game
export interface Game {
    game_id: string;
    player_goat_id: string;
    player_tiger_id: string;
    status: BackendGameStatus;
    created_at: string;
    ended_at?: string;
    
    // These are nested objects that might not always be present
    player_goat: Player;
    player_tiger: Player;
    winner_id?: string | null;
    
    // The full game state, crucial for local games and reconstructing online games
    game_state: GameState;
}

export interface GameCreate {
    player_goat_id: string;
    player_tiger_id: string;
}

export interface GameUpdate {
    status?: BackendGameStatus;
    winner_id?: string;
}

// Move
export interface Move {
    move_id: string;
    game_id: string;
    move_number: number;
    player_id: string;
    move_type: string;
    from_row?: number;
    from_col?: number;
    to_row: number;
    to_col: number;
    created_at: string;
    player: User;
}

export interface MoveCreate {
    game_id: string;
    move_number: number;
    player_id: string;
    move_type: string;
    from_row?: number;
    from_col?: number;
    to_row: number;
    to_col: number;
}

// AI Game
export interface AIGame {
    ai_game_id: string;
    user_id: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    user_side: "TIGER" | "GOAT";
    status: "IN_PROGRESS" | "COMPLETED";
    winner?: string;
    game_duration?: number;
    started_at: string;
    user: User;
}

export interface AIGameCreate {
    user_id: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    user_side: "TIGER" | "GOAT";
}

// Tournament
export interface Tournament {
    tournament_id: string;
    name: string;
    description?: string;
    max_participants: number;
    start_date: string;
    end_date: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    created_at: string;
}

export interface TournamentCreate {
    name: string;
    description?: string;
    max_participants: number;
    start_date: string;
    end_date: string;
}

export interface TournamentUpdate {
    name?: string;
    description?: string;
    max_participants?: number;
    start_date?: string;
    end_date?: string;
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

export interface TournamentEntry {
    tournament_entry_id: string;
    tournament_id: string;
    user_id: string;
    joined_at: string;
    user: User;
}

export interface TournamentEntryCreate {
    tournament_id: string;
    user_id: string;
}

export interface TournamentMatch {
    tournament_match_id: string;
    tournament_id: string;
    round_number: number;
    player_1_id: string;
    player_2_id: string;
    game_id?: string;
    player_1: User;
    player_2: User;
    game?: Game;
}

export interface TournamentMatchCreate {
    tournament_id: string;
    round_number: number;
    player_1_id: string;
    player_2_id: string;
}

// Report
export interface Report {
    report_id: string;
    reporter_id: string;
    reported_user_id: string;
    category: "CHEATING" | "HARASSMENT" | "BUG" | "OTHER";
    description: string;
    status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
    created_at: string;
    reporter: User;
    reported_user: User;
}

export interface ReportCreate {
    reporter_id: string;
    reported_user_id: string;
    category: "CHEATING" | "HARASSMENT" | "BUG" | "OTHER";
    description: string;
}

// Feedback
export interface Feedback {
    feedback_id: string;
    user_id: string;
    subject: string;
    message: string;
    created_at: string;
    user: User;
}

export interface FeedbackCreate {
    user_id: string;
    subject: string;
    message: string;
} 