import { PotentialMove, Position } from './baghchal';

/**
 * AI Difficulty Levels
 */
export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

/**
 * Configuration for AI behavior
 */
export interface AIConfig {
  difficulty: AIDifficulty;
  timeLimit: number; // milliseconds
  maxDepth: number;
  useTranspositionTable: boolean;
  useQuiescence: boolean;
  useMoveOrdering: boolean;
}

/**
 * Transposition table entry for caching evaluated positions
 */
export interface TranspositionEntry {
  hash: string;
  depth: number;
  score: number;
  flag: 'exact' | 'lowerbound' | 'upperbound';
  bestMove?: PotentialMove;
}

/**
 * Result of an AI search
 */
export interface SearchResult {
  move: PotentialMove | null;
  score: number;
  depth: number;
  nodesSearched: number;
  timeElapsed: number;
}

/**
 * Represents a sequence of tiger captures in a single turn
 */
export interface CaptureChain {
  positions: Position[]; // Sequence of positions the tiger moves through
  capturedGoats: Position[]; // Positions of goats captured
  startPos: Position;
  endPos: Position;
}

/**
 * Move with metadata for AI evaluation
 */
export interface ScoredMove {
  move: PotentialMove;
  score: number;
  isCapture?: boolean;
  captureCount?: number;
}

/**
 * Gets default config for a difficulty level
 */
export function getDefaultConfig(difficulty: AIDifficulty): AIConfig {
  switch (difficulty) {
    case AIDifficulty.EASY:
      return {
        difficulty,
        timeLimit: 50,
        maxDepth: 3,
        useTranspositionTable: false,
        useQuiescence: false,
        useMoveOrdering: false,
      };
    case AIDifficulty.MEDIUM:
      return {
        difficulty,
        timeLimit: 200,
        maxDepth: 6,
        useTranspositionTable: true,
        useQuiescence: false,
        useMoveOrdering: true,
      };
    case AIDifficulty.HARD:
      return {
        difficulty,
        timeLimit: 1000,
        maxDepth: 12,
        useTranspositionTable: true,
        useQuiescence: true,
        useMoveOrdering: true,
      };
  }
}
