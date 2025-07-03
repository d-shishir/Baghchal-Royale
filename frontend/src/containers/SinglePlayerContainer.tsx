import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import SinglePlayerSetupScreen from '../screens/singleplayer/SinglePlayerSetupScreen';
import GameScreen from '../screens/game/GameScreen';
import { RootState } from '../store';
import { GameState, GameMove, localMove, selectPosition, resetGame, startAIGame } from '../store/slices/gameSlice';
import { isMoveValid, applyMove, checkWinCondition, getMovesForPiece, getAllValidMoves, PotentialMove } from '../game-logic/baghchal';
import { GuestModeAI, AIDifficulty } from '../game-logic/guestAI';
import { useCreateGameMutation, useMakeMoveMutation, useGetAIMoveMutation, useGetGameStateQuery } from '../services/api';
import { mapBackendStateToGameScreen, BackendGameState } from '../utils/gameStateMapper';

type GameMode = 'setup' | 'playing';

interface Player {
  id: string;
  username: string;
  rating: number;
  side: 'tigers' | 'goats';
}

const SinglePlayerContainer: React.FC = () => {
  console.log('SinglePlayerContainer: Before useNavigation');
  const navigation = useNavigation();
  console.log('SinglePlayerContainer: After useNavigation');
  const dispatch = useDispatch();
  
  // --- Global State & User Info ---
  const { user, guestMode } = useSelector((state: RootState) => state.auth);
  const localGameState = useSelector((state: RootState) => state.game);
  const isOnline = !!user && !guestMode;

  // --- Component State ---
  const [viewMode, setViewMode] = useState<GameMode>('setup');
  const [userSide, setUserSide] = useState<'tigers' | 'goats'>('goats');
  const [difficulty, setDifficulty] = useState<AIDifficulty>(AIDifficulty.MEDIUM);
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  // --- On-device AI ---
  const [ai] = useState(() => new GuestModeAI());

  // --- Backend (Online) State & API Hooks ---
  const [gameId, setGameId] = useState<string | null>(null);
  const [initialGameState, setInitialGameState] = useState<BackendGameState | null>(null);
  const [backendSelectedPosition, setBackendSelectedPosition] = useState<[number, number] | null>(null);
  const [createGame, { isLoading: isCreatingGame }] = useCreateGameMutation();
  const [makeMove] = useMakeMoveMutation();
  const [getAIMove] = useGetAIMoveMutation();
  const { data: gameStateResponse, refetch: refetchGameState } = useGetGameStateQuery(
    gameId || '',
    { skip: !gameId || !isOnline, pollingInterval: 2000 }
  );
  const backendGameState = useMemo(() => {
    if (gameStateResponse) {
      console.log('Raw gameStateResponse:', JSON.stringify(gameStateResponse, null, 2));
      // Handle structure - API response may not have nested data key
      const gameData = gameStateResponse.data ? (gameStateResponse.data.data || gameStateResponse.data) : gameStateResponse;
      console.log('Extracted gameData:', JSON.stringify(gameData, null, 2));
      const extractedState = {
        ...gameData,
        valid_actions: gameData.valid_actions || []
      };
      console.log('Extracted backendGameState:', JSON.stringify(extractedState, null, 2));
      return extractedState;
    } else {
      console.log('gameStateResponse is falsy:', gameStateResponse);
    }
    return null;
  }, [gameStateResponse]);

  useEffect(() => {
    if (backendGameState) {
      console.log('Received backend state:', JSON.stringify(backendGameState, null, 2));
    }
  }, [backendGameState]);

  // --- AI MOVE LOGIC ---
  // On-device AI
  useEffect(() => {
    if (isOnline || viewMode !== 'playing' || localGameState.gameOver) return;

    const aiSide = userSide === 'tigers' ? 'goats' : 'tigers';
    if (localGameState.currentPlayer === aiSide) {
      setIsAIThinking(true);
      const timer = setTimeout(() => {
        try {
            ai.setDifficulty(difficulty);
            const aiMove = ai.getMove(localGameState as GameState);
            if (aiMove) {
              const fullMove: GameMove = { ...aiMove, player_id: aiSide, timestamp: new Date().toISOString() };
              if (isMoveValid(localGameState as GameState, fullMove)) {
                const stateAfterMove = applyMove(localGameState as GameState, fullMove);
                const gameResult = checkWinCondition(stateAfterMove);
                dispatch(localMove({ ...stateAfterMove, nextPlayer: stateAfterMove.currentPlayer, ...gameResult }));
              } else {
                console.warn('AI generated an invalid move:', aiMove);
              }
            }
        } catch (error) {
            console.error("Error during AI turn:", error);
            Alert.alert("AI Error", "The AI encountered an unexpected error.");
        } finally {
            setIsAIThinking(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, viewMode, localGameState, userSide, difficulty, ai, dispatch]);

  // Backend AI
  useEffect(() => {
    if (!isOnline || viewMode !== 'playing' || !backendGameState || backendGameState.game_over) return;
    
    const aiSide = userSide === 'tigers' ? 'goats' : 'tigers';
    if (backendGameState.current_player === aiSide) {
      setIsAIThinking(true);
      const timer = setTimeout(async () => {
        try {
          await getAIMove({ game_id: gameId! }).unwrap();
          await refetchGameState();
        } catch (error) {
          console.error('Failed to get AI move:', error);
          Alert.alert('AI Error', 'The AI opponent encountered an error.');
        } finally {
          setIsAIThinking(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    } else {
        setIsAIThinking(false);
    }
  }, [isOnline, viewMode, backendGameState, userSide, gameId, getAIMove, refetchGameState]);


  // --- GAME ACTIONS ---
  const handleStartGame = useCallback(async (playerSide: 'tigers' | 'goats', selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setUserSide(playerSide);
    setDifficulty(selectedDifficulty as AIDifficulty);
    
    if (isOnline) {
      try {
        const response = await createGame({ mode: 'pvai', side: playerSide, difficulty: selectedDifficulty }).unwrap();
        setGameId(response.data.game_id);
        // @ts-ignore
        if (response.data.game_state) {
            // @ts-ignore
            setInitialGameState(response.data.game_state);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to start online game.');
        return;
      }
    } else {
      dispatch(startAIGame({ userSide: playerSide }));
    }
    setViewMode('playing');
  }, [isOnline, createGame, dispatch]);

  const handleSelectPosition = useCallback((pos: { row: number, col: number } | null) => {
    if (isOnline) {
      setBackendSelectedPosition(pos ? [pos.row, pos.col] : null);
    } else {
      dispatch(selectPosition(pos ? [pos.row, pos.col] : null));
    }
  }, [isOnline, dispatch]);

  const handleMove = useCallback(async (move: PotentialMove) => {
    if (isOnline) {
      if (!gameId) return;
      let apiMove: any = {};
      if (move.type === 'place') {
        apiMove = { action_type: 'place', row: move.to[0], col: move.to[1] };
      } else if (move.type === 'move') {
        apiMove = { action_type: 'move', from_row: move.from[0], from_col: move.from[1], to_row: move.to[0], to_col: move.to[1] };
      }
      try {
        await makeMove({ game_id: gameId, ...apiMove }).unwrap();
        setBackendSelectedPosition(null);
        await refetchGameState();
      } catch (error) {
        Alert.alert('Invalid Move', 'That move is not allowed.');
      }
    } else {
      const fullMove: GameMove = { ...move, player_id: localGameState.currentPlayer, timestamp: new Date().toISOString() };
      if (isMoveValid(localGameState as GameState, fullMove)) {
        const stateAfterMove = applyMove(localGameState as GameState, fullMove);
        const gameResult = checkWinCondition(stateAfterMove);
        dispatch(localMove({ ...stateAfterMove, nextPlayer: stateAfterMove.currentPlayer, ...gameResult }));
      } else {
        console.warn("Invalid move attempted:", move);
      }
    }
  }, [isOnline, gameId, makeMove, refetchGameState, localGameState, dispatch]);

  const handleQuitGame = useCallback(() => {
    Alert.alert('Quit Game', 'Are you sure you want to quit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Quit', style: 'destructive', onPress: () => {
          if (!isOnline) dispatch(resetGame());
          setViewMode('setup');
          setGameId(null);
      }},
    ]);
  }, [isOnline, dispatch]);

  const handleNewGame = useCallback(() => {
    if (!isOnline) {
      dispatch(resetGame());
    }
    setViewMode('setup');
    setGameId(null);
    setInitialGameState(null);
    setBackendSelectedPosition(null);
  }, [isOnline, dispatch]);

  const handleBack = useCallback(() => {
    if (viewMode === 'playing') {
      handleQuitGame();
    } else {
      navigation.goBack();
    }
  }, [viewMode, navigation, handleQuitGame]);

  
  // --- UI & RENDER LOGIC ---
  const validMoves = useMemo(() => {
    console.log('Calculating validMoves, isOnline:', isOnline);
    console.log('validMoves: backendGameState:', JSON.stringify(backendGameState, null, 2));
    console.log('validMoves: gameStateResponse:', JSON.stringify(gameStateResponse, null, 2));
    console.log('validMoves: initialGameState:', initialGameState);
    if (isOnline) {
        if (!backendGameState) {
            console.log('validMoves: backendGameState is falsy, returning empty array');
            return [];
        }
        console.log('validMoves: backendGameState.valid_actions:', backendGameState.valid_actions);
        const mapped = mapBackendStateToGameScreen(backendGameState, backendSelectedPosition);
        console.log('validMoves: Using backend state, validMoves length:', mapped.validMoves.length);
        return mapped.validMoves;
    } else {
        console.log('validMoves: Using local state, selectedPosition:', localGameState.selectedPosition);
        const movesToShow: PotentialMove[] = localGameState.selectedPosition
            ? getMovesForPiece(localGameState, localGameState.selectedPosition) || []
            : getAllValidMoves(localGameState) || [];
        console.log('validMoves: movesToShow length:', movesToShow.length);

        if (localGameState.selectedPosition) {
            // If a piece is selected, highlight the destination squares.
            console.log('validMoves: Piece selected, mapping destination squares');
            return movesToShow.map(move => ({ row: move.to[0], col: move.to[1] }));
        } else {
            // If no piece is selected, highlight the pieces that can be moved.
            console.log('validMoves: No piece selected, mapping source positions');
            const positionsToHighlight = movesToShow
                ?.map(m => (m.type === 'place' ? m.to : m.from))
                ?.filter((p): p is [number, number] => !!p) || [];
            console.log('validMoves: positionsToHighlight length:', positionsToHighlight.length);
            const uniquePositions = Array.from(new Set(positionsToHighlight.map(p => `${p[0]},${p[1]}`))).map(s => s.split(',').map(Number));
            console.log('validMoves: uniquePositions length:', uniquePositions.length);
            return uniquePositions.map(pos => ({ row: pos[0], col: pos[1] }));
        }
    }
  }, [isOnline, localGameState, backendGameState, backendSelectedPosition]);


  if (viewMode === 'setup') {
    return <SinglePlayerSetupScreen onStartGame={handleStartGame} onBack={handleBack} isLoading={isCreatingGame} />;
  }

  const aiPlayerName = `AI (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`;
  const humanPlayer: Player = { id: user?.id || 'user', username: user?.username || 'You', rating: 1200, side: userSide };
  const aiPlayer: Player = { id: 'ai', username: aiPlayerName, rating: 1200, side: userSide === 'tigers' ? 'goats' : 'tigers' };

  const finalGameState = isOnline
    ? backendGameState ? mapBackendStateToGameScreen(backendGameState, backendSelectedPosition) : null
    : localGameState;

  if (!finalGameState) return null; // Or a loading indicator

  return (
    <GameScreen
      gameMode="pvai"
      board={finalGameState.board}
      currentPlayer={finalGameState.currentPlayer}
      player1={userSide === 'tigers' ? humanPlayer : aiPlayer}
      player2={userSide === 'goats' ? humanPlayer : aiPlayer}
      userSide={userSide}
      selectedPosition={isOnline ? (backendSelectedPosition ? { row: backendSelectedPosition[0], col: backendSelectedPosition[1] } : null) : (localGameState.selectedPosition ? { row: localGameState.selectedPosition[0], col: localGameState.selectedPosition[1] } : null)}
      validMoves={validMoves}
      onMove={handleMove}
      onSelectPosition={handleSelectPosition}
      onQuitGame={handleQuitGame}
      onNewGame={handleNewGame}
      winner={finalGameState.winner}
      gameOver={finalGameState.gameOver}
      goatsCaptured={finalGameState.goatsCaptured}
      phase={finalGameState.phase}
      isAIThinking={isAIThinking}
    />
  );
};

export default SinglePlayerContainer; 