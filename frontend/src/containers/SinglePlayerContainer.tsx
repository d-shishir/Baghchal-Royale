import React, { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import SinglePlayerSetupScreen from '../screens/singleplayer/SinglePlayerSetupScreen';
import GameScreen from '../screens/game/GameScreen';
import { useCreateGameMutation, useMakeMoveMutation, useGetAIMoveMutation, useGetGameStateQuery } from '../services/api';
import { RootState } from '../store';

type GameMode = 'setup' | 'playing';

interface Player {
  id: string;
  username: string;
  rating: number;
  side: 'tigers' | 'goats';
}

interface BackendGameState {
  game_id: string;
  board: number[][];
  current_player: 'tigers' | 'goats';
  phase: 'placement' | 'movement';
  goats_placed: number;
  goats_captured: number;
  game_over: boolean;
  winner: 'tigers' | 'goats' | null;
  valid_actions: Array<{
    type: string;
    row?: number;
    col?: number;
    from_row?: number;
    from_col?: number;
    to_row?: number;
    to_col?: number;
  }>;
}

const SinglePlayerContainer: React.FC = () => {
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [gameMode, setGameMode] = useState<GameMode>('setup');
  const [gameId, setGameId] = useState<string | null>(null);
  const [userSide, setUserSide] = useState<'tigers' | 'goats'>('goats');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [createGame, { isLoading: isCreating }] = useCreateGameMutation();
  const [makeMove] = useMakeMoveMutation();
  const [getAIMove] = useGetAIMoveMutation();
  
  // Fetch game state from backend
  const { data: gameStateResponse, refetch: refetchGameState } = useGetGameStateQuery(
    gameId || '', 
    { 
      skip: !gameId,
      pollingInterval: 2000, // Poll every 2 seconds
    }
  );

  const gameState = gameStateResponse?.data as BackendGameState | undefined;

  const handleStartGame = useCallback(async (
    playerSide: 'tigers' | 'goats', 
    selectedDifficulty: 'easy' | 'medium' | 'hard'
  ) => {
    try {
      setUserSide(playerSide);
      setDifficulty(selectedDifficulty);
      
      const response = await createGame({
        mode: 'pvai',
        side: playerSide,
        difficulty: selectedDifficulty,
      }).unwrap();

      setGameId(response.data.game_id);
      setGameMode('playing');
    } catch (error) {
      console.error('Failed to create game:', error);
      Alert.alert(
        'Error',
        'Failed to start the game. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [createGame]);

  const handleMove = useCallback(async (move: any) => {
    if (!gameId) return;

    console.log('🚀 handleMove called:', { gameId, move });

    try {
      console.log('📡 Sending move to API...');
      const result = await makeMove({
        game_id: gameId,
        ...move,
      }).unwrap();
      
      console.log('✅ Move API response:', result);
      
      // Refetch game state after move
      await refetchGameState();
      console.log('🔄 Game state refetched');
    } catch (error) {
      console.error('❌ Failed to make move:', error);
      Alert.alert(
        'Invalid Move',
        'That move is not allowed. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [gameId, makeMove, refetchGameState]);

  const handleRequestAIMove = useCallback(async () => {
    if (!gameId || !gameState) return;

    // Determine AI side based on user side
    const aiSide = userSide === 'tigers' ? 'goats' : 'tigers';
    
    // Only request AI move if it's AI's turn
    if (gameState.current_player !== aiSide) {
      console.log('Not AI turn:', { 
        current_player: gameState.current_player, 
        userSide,
        aiSide,
        shouldBeAITurn: gameState.current_player === aiSide
      });
      return;
    }

    try {
      await getAIMove({ game_id: gameId }).unwrap();
      // Refetch game state after AI move
      await refetchGameState();
    } catch (error) {
      console.error('Failed to get AI move:', error);
      Alert.alert(
        'AI Error',
        'The AI opponent encountered an error. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [gameId, getAIMove, refetchGameState, gameState, userSide]);

  // Auto-trigger AI moves when it's AI's turn
  useEffect(() => {
    if (!gameState || gameState.game_over) return;
    
    // Determine AI side based on user side
    const aiSide = userSide === 'tigers' ? 'goats' : 'tigers';
    
    // Trigger AI move if it's AI's turn
    if (gameState.current_player === aiSide) {
      const timer = setTimeout(() => {
        handleRequestAIMove();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState?.current_player, userSide, gameState?.game_over, handleRequestAIMove]);

  const handleQuitGame = useCallback(() => {
    Alert.alert(
      'Quit Game',
      'Are you sure you want to quit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => {
            setGameMode('setup');
            setGameId(null);
          },
        },
      ]
    );
  }, []);

  const handleRestartGame = useCallback(async () => {
    try {
      // Create a new game with the same settings
      const response = await createGame({
        mode: 'pvai',
        side: userSide,
        difficulty: difficulty,
      }).unwrap();

      setGameId(response.data.game_id);
    } catch (error) {
      console.error('Failed to restart game:', error);
      Alert.alert(
        'Error',
        'Failed to restart the game. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [createGame, userSide, difficulty]);

  const handleBack = useCallback(() => {
    if (gameMode === 'playing') {
      handleQuitGame();
    } else {
      navigation.goBack();
    }
  }, [gameMode, navigation, handleQuitGame]);

  // Create player objects for game screen
  const player1: Player = {
    id: user?.id || 'user',
    username: user?.username || 'Player',
    rating: user?.rating || 1200,
    side: userSide,
  };

  const aiPlayer: Player = {
    id: 'ai',
    username: `AI (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`,
    rating: difficulty === 'easy' ? 1000 : difficulty === 'medium' ? 1400 : 1800,
    side: userSide === 'tigers' ? 'goats' : 'tigers',
  };

  if (gameMode === 'setup') {
    return (
      <SinglePlayerSetupScreen
        onStartGame={handleStartGame}
        onBack={handleBack}
        isLoading={isCreating}
      />
    );
  }

  return (
    <GameScreen
      gameMode="single"
      player1={player1}
      player2={aiPlayer}
      userSide={userSide}
      gameState={gameState}
      onMove={handleMove}
      onQuitGame={handleQuitGame}
      onRequestAIMove={handleRequestAIMove}
      onRestartGame={handleRestartGame}
    />
  );
};

export default SinglePlayerContainer; 