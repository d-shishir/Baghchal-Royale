import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GameBoard from '../../components/game/GameBoard';

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

interface GameScreenProps {
  gameMode: 'single' | 'multiplayer';
  player1: Player;
  player2?: Player;
  userSide: 'tigers' | 'goats';
  gameState?: BackendGameState;
  onMove: (move: any) => void;
  onQuitGame: () => void;
  onRequestAIMove?: () => void;
  onRestartGame?: () => void;
}

const { width, height } = Dimensions.get('window');

const GameScreen: React.FC<GameScreenProps> = ({
  gameMode,
  player1,
  player2,
  userSide,
  gameState,
  onMove,
  onQuitGame,
  onRequestAIMove,
  onRestartGame,
}) => {
  const [selectedPosition, setSelectedPosition] = useState<{row: number; col: number} | null>(null);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(true); // Enable debug panel by default
  const [lastClickInfo, setLastClickInfo] = useState<string>('No clicks yet');

  // Default state if backend state is not available yet
  const defaultState = {
    board: [
      [1, 0, 0, 0, 1],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 0, 0, 0, 1],
    ],
    current_player: 'goats' as const,
    phase: 'placement' as const,
    goats_placed: 0,
    goats_captured: 0,
    game_over: false,
    winner: null,
    valid_actions: []
  };

  const currentGameState = gameState || defaultState;
  const isUserTurn = currentGameState.current_player === userSide;
  const currentPlayerInfo = currentGameState.current_player === player1.side ? player1 : player2;

  // Debug logging for turn calculation
  console.log('🔍 Turn Debug:', {
    current_player: currentGameState.current_player,
    current_player_length: currentGameState.current_player?.length,
    current_player_type: typeof currentGameState.current_player,
    userSide: userSide,
    userSide_length: userSide?.length,
    userSide_type: typeof userSide,
    isUserTurn: isUserTurn,
    strict_equality: currentGameState.current_player === userSide,
    loose_equality: currentGameState.current_player == userSide,
    player1Side: player1.side,
    player2Side: player2?.side,
    gameState: !!gameState
  });

  // Get valid moves for the selected position
  const getValidMovesForPosition = useCallback((row: number, col: number) => {
    return currentGameState.valid_actions
      .filter(action => action.from_row === row && action.from_col === col)
      .map(action => ({ row: action.to_row!, col: action.to_col! }));
  }, [currentGameState.valid_actions]);

  const handlePositionPress = useCallback((position: {row: number; col: number}) => {
    console.log('🎮 GameScreen handlePositionPress called:', position);
    const { row, col } = position;
    const { board, current_player, phase } = currentGameState;

    // Create debug info
    let debugInfo = `Click at (${row},${col})\n`;
    debugInfo += `Current player: ${current_player}\n`;
    debugInfo += `User side: ${userSide}\n`;
    debugInfo += `Phase: ${phase}\n`;
    debugInfo += `Is user turn: ${isUserTurn}\n`;
    debugInfo += `Game over: ${currentGameState.game_over}\n`;
    debugInfo += `Board at position: ${board[row][col]}\n`;
    debugInfo += `Valid actions count: ${currentGameState.valid_actions.length}\n`;

    if (!isUserTurn) {
      debugInfo += '❌ BLOCKED: Not user turn';
      setLastClickInfo(debugInfo);
      return;
    }

    if (currentGameState.game_over) {
      debugInfo += '❌ BLOCKED: Game is over';
      setLastClickInfo(debugInfo);
      return;
    }

    // If in placement phase and playing goats
    if (phase === 'placement' && current_player === 'goats' && userSide === 'goats') {
      debugInfo += '📍 Placement phase for goats\n';
      if (board[row][col] === 0) {
        debugInfo += '✅ SENDING MOVE: Valid placement';
        const move = {
          action_type: 'place',
          row: row,
          col: col,
        };
        setLastClickInfo(debugInfo + `\nMove: ${JSON.stringify(move)}`);
        onMove(move);
        setSelectedPosition(null);
      } else {
        debugInfo += '❌ BLOCKED: Position occupied';
        setLastClickInfo(debugInfo);
      }
      return;
    }

    // Movement phase logic
    if (selectedPosition) {
      debugInfo += `🎯 Movement phase - position selected: (${selectedPosition.row},${selectedPosition.col})\n`;
      const validMoves = getValidMovesForPosition(selectedPosition.row, selectedPosition.col);
      debugInfo += `Valid moves: ${JSON.stringify(validMoves)}\n`;
      const isValidMove = validMoves.some(m => m.row === row && m.col === col);
      
      if (isValidMove) {
        debugInfo += '✅ SENDING MOVE: Valid movement';
        const move = {
          action_type: 'move',
          from_row: selectedPosition.row,
          from_col: selectedPosition.col,
          to_row: row,
          to_col: col,
        };
        setLastClickInfo(debugInfo + `\nMove: ${JSON.stringify(move)}`);
        onMove(move);
        setSelectedPosition(null);
      } else {
        debugInfo += '❌ BLOCKED: Invalid movement - deselecting';
        setLastClickInfo(debugInfo);
        setSelectedPosition(null);
      }
    } else {
      debugInfo += '🔍 Trying to select piece\n';
      const piece = board[row][col];
      const isPlayerPiece = (current_player === 'tigers' && piece === 1) || 
                           (current_player === 'goats' && piece === 2);
      
      debugInfo += `Piece: ${piece}, Is player piece: ${isPlayerPiece}\n`;
      debugInfo += `Current player: "${current_player}", User side: "${userSide}"\n`;
      debugInfo += `Player turn match: ${current_player === userSide}\n`;
      debugInfo += `Selection criteria: isPlayerPiece=${isPlayerPiece} && current_player===userSide=${current_player === userSide}\n`;
      
      if (isPlayerPiece && current_player === userSide) {
        debugInfo += '✅ Valid piece selected';
        setSelectedPosition({ row, col });
        setLastClickInfo(debugInfo);
      } else {
        debugInfo += '❌ BLOCKED: Cannot select this piece';
        setLastClickInfo(debugInfo);
      }
    }
  }, [currentGameState, selectedPosition, isUserTurn, userSide, onMove, getValidMovesForPosition]);

  const validMoves = selectedPosition ? getValidMovesForPosition(selectedPosition.row, selectedPosition.col) : [];

  const handleQuitGame = () => {
    Alert.alert(
      'Quit Game',
      'Are you sure you want to quit? You will lose this game.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: onQuitGame },
      ]
    );
  };

  const handleRestartGame = () => {
    Alert.alert(
      'Restart Game',
      'Are you sure you want to restart? Current progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Restart', 
          style: 'destructive', 
          onPress: () => {
            setSelectedPosition(null);
            setShowGameMenu(false);
            onRestartGame?.();
          }
        },
      ]
    );
  };

  const renderPlayerInfo = (player: Player, isActive: boolean) => (
    <View style={[styles.playerInfo, isActive && styles.activePlayer]}>
      <View style={styles.playerDetails}>
        <View style={[
          styles.playerSideIndicator,
          { backgroundColor: player.side === 'tigers' ? '#FF6F00' : '#66BB6A' }
        ]}>
          <Ionicons 
            name={player.side === 'tigers' ? 'flash' : 'leaf'} 
            size={16} 
            color="#FFF" 
          />
        </View>
        <View style={styles.playerText}>
          <Text style={styles.playerName}>{player.username}</Text>
          <Text style={styles.playerRating}>Rating: {player.rating}</Text>
        </View>
      </View>
      {isActive && (
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>Your Turn</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowGameMenu(true)} style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.gameInfo}>
          <Text style={styles.gameTitle}>
            {gameMode === 'single' ? 'vs AI' : 'Multiplayer'}
          </Text>
          <Text style={styles.gamePhase}>
            {currentGameState.phase === 'placement' ? 'Placement Phase' : 'Movement Phase'}
          </Text>
        </View>

        <View style={styles.gameStats}>
          <Text style={styles.statText}>Goats: {20 - currentGameState.goats_placed}</Text>
          <Text style={styles.statText}>Captured: {currentGameState.goats_captured}</Text>
        </View>
      </View>

      {/* Player Info */}
      <View style={styles.playersSection}>
        {renderPlayerInfo(player1, currentGameState.current_player === player1.side)}
        {player2 && renderPlayerInfo(player2, currentGameState.current_player === player2.side)}
      </View>

      {/* Game Board */}
      <View style={styles.boardContainer}>
        <GameBoard
          board={currentGameState.board}
          selectedPosition={selectedPosition}
          validMoves={validMoves}
          onPositionPress={handlePositionPress}
          disabled={!isUserTurn || currentGameState.game_over}
          showValidMoves={true}
        />
      </View>

      {/* Current Turn Indicator or Game Over */}
      <View style={styles.turnSection}>
        {currentGameState.game_over ? (
          <View style={styles.gameOverSection}>
            <Text style={styles.gameOverText}>Game Over!</Text>
            <View style={[
              styles.winnerBadge,
              { backgroundColor: currentGameState.winner === 'tigers' ? '#FF6F00' : '#66BB6A' }
            ]}>
              <Ionicons 
                name={currentGameState.winner === 'tigers' ? 'flash' : 'leaf'} 
                size={20} 
                color="#FFF" 
              />
              <Text style={styles.winnerText}>
                {currentGameState.winner === 'tigers' ? 'Tigers Win!' : 'Goats Win!'}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.turnLabel}>Current Turn:</Text>
            <View style={[
              styles.turnBadge,
              { backgroundColor: currentGameState.current_player === 'tigers' ? '#FF6F00' : '#66BB6A' }
            ]}>
              <Ionicons 
                name={currentGameState.current_player === 'tigers' ? 'flash' : 'leaf'} 
                size={20} 
                color="#FFF" 
              />
              <Text style={styles.turnBadgeText}>
                {currentGameState.current_player === 'tigers' ? 'Tigers' : 'Goats'}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Game Menu Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showGameMenu}
        onRequestClose={() => setShowGameMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Game Menu</Text>
            
            <TouchableOpacity style={styles.menuOption} onPress={handleRestartGame}>
              <Ionicons name="refresh" size={24} color="#FFF" />
              <Text style={styles.menuOptionText}>Restart Game</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuOption}>
              <Ionicons name="settings" size={24} color="#FFF" />
              <Text style={styles.menuOptionText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuOption}>
              <Ionicons name="book" size={24} color="#FFF" />
              <Text style={styles.menuOptionText}>Game Rules</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuOption, styles.quitOption]} onPress={handleQuitGame}>
              <Ionicons name="exit" size={24} color="#FF5252" />
              <Text style={[styles.menuOptionText, { color: '#FF5252' }]}>Quit Game</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowGameMenu(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Debug Panel */}
      {showDebugPanel && (
        <View style={styles.debugPanel}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <TouchableOpacity onPress={() => setShowDebugPanel(false)}>
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.debugContent}>
            <Text style={styles.debugText}>
              <Text style={styles.debugLabel}>Last Click: </Text>
              {lastClickInfo}
            </Text>
            <Text style={styles.debugText}>
              {'\n'}<Text style={styles.debugLabel}>Game State:</Text>
              {'\n'}• Current Player: "{currentGameState.current_player}" (len: {currentGameState.current_player?.length})
              {'\n'}• User Side: "{userSide}" (len: {userSide?.length})
              {'\n'}• Phase: {currentGameState.phase}
              {'\n'}• Is User Turn: {isUserTurn ? 'YES' : 'NO'}
              {'\n'}• Strict Comparison: "{currentGameState.current_player}" === "{userSide}" = {currentGameState.current_player === userSide ? 'TRUE' : 'FALSE'}
              {'\n'}• Loose Comparison: "{currentGameState.current_player}" == "{userSide}" = {currentGameState.current_player == userSide ? 'TRUE' : 'FALSE'}
              {'\n'}• Types: {typeof currentGameState.current_player} vs {typeof userSide}
              {'\n'}• Game Over: {currentGameState.game_over ? 'YES' : 'NO'}
              {'\n'}• Valid Actions: {currentGameState.valid_actions.length}
              {'\n'}• Player1 Side: "{player1.side}"
              {'\n'}• Player2 Side: "{player2?.side}"
              {'\n'}• Game State Source: {gameState ? 'BACKEND' : 'DEFAULT'}
            </Text>
            <Text style={styles.debugText}>
              {'\n'}<Text style={styles.debugLabel}>Valid Actions Detail:</Text>
              {'\n'}{JSON.stringify(currentGameState.valid_actions, null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  menuButton: {
    padding: 8,
  },
  gameInfo: {
    alignItems: 'center',
    flex: 1,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  gamePhase: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  gameStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  playersSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  activePlayer: {
    borderWidth: 2,
    borderColor: '#FF5252',
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerSideIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerText: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  playerRating: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  turnIndicator: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  turnText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  turnSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  turnLabel: {
    fontSize: 16,
    color: '#FFF',
    marginRight: 12,
  },
  turnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  turnBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  gameOverSection: {
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  winnerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    width: width * 0.8,
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#333',
  },
  quitOption: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  menuOptionText: {
    fontSize: 16,
    color: '#FFF',
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  debugPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  debugContent: {
    maxHeight: 150,
  },
  debugText: {
    fontSize: 11,
    color: '#999',
    lineHeight: 16,
  },
  debugLabel: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default GameScreen; 