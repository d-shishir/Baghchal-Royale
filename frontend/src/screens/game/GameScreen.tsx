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
import { GameMode, GamePlayer, GamePhase, PlayerSide, PieceType } from '../../store/slices/gameSlice';

interface GameScreenProps {
  gameMode: GameMode;
  board: PieceType[][];
  currentPlayer: PlayerSide;
  player1: GamePlayer | null;
  player2: GamePlayer | null;
  userSide: PlayerSide | null;
  selectedPosition: { row: number, col: number } | null;
  validMoves: { row: number, col: number }[];
  onMove: (move: any) => void;
  onSelectPosition: (position: { row: number, col: number } | null) => void;
  onQuitGame: () => void;
  onNewGame: () => void;
  winner?: 'tigers' | 'goats' | 'draw' | null;
  gameOver: boolean;
  goatsCaptured: number;
  phase: GamePhase;
  onRequestAIMove?: () => void;
  onRestartGame?: () => void;
  isAIThinking?: boolean;
}

const { width, height } = Dimensions.get('window');

const GameScreen: React.FC<GameScreenProps> = ({
  gameMode,
  board,
  currentPlayer,
  player1,
  player2,
  userSide,
  selectedPosition,
  validMoves,
  onMove,
  onSelectPosition,
  onQuitGame,
  onNewGame,
  winner,
  gameOver,
  goatsCaptured,
  phase,
  onRequestAIMove,
  onRestartGame,
  isAIThinking = false,
}) => {
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(true); // Enable debug panel by default
  const [lastClickInfo, setLastClickInfo] = useState<string>('No clicks yet');

  const isUserTurn = userSide ? currentPlayer === userSide : true; // In local PVP, it's always "user's turn"
  const currentPlayerInfo = currentPlayer === 'tigers' ? player1 : player2;

  // Debug logging for turn calculation
  console.log('🔍 Turn Debug:', {
    current_player: currentPlayer,
    current_player_length: currentPlayer?.length,
    current_player_type: typeof currentPlayer,
    userSide: userSide,
    userSide_type: typeof userSide,
    isUserTurn: isUserTurn,
    strict_equality: currentPlayer === userSide,
    loose_equality: currentPlayer == userSide,
    player1Side: player1?.side,
    player2Side: player2?.side,
    gameState: !!board
  });

  // Get valid moves for the selected position
  const getValidMovesForPosition = useCallback((row: number, col: number) => {
    // This logic needs to be implemented or sourced from a local game engine
    return []; // Placeholder
  }, []);

  const handlePositionPress = useCallback((position: {row: number; col: number}) => {
    console.log('🎮 GameScreen handlePositionPress called:', position);
    const { row, col } = position;

    // Create debug info
    let debugInfo = `Click at (${row},${col})\n`;
    debugInfo += `Current player: ${currentPlayer}\n`;
    debugInfo += `User side: ${userSide}\n`;
    debugInfo += `Phase: ${phase}\n`;
    debugInfo += `Is user turn: ${isUserTurn}\n`;
    debugInfo += `Game over: ${gameOver}\n`;
    debugInfo += `Board at position: ${board[row][col]}\n`;
    debugInfo += `Valid moves count: ${validMoves.length}\n`;

    if (!isUserTurn) {
      debugInfo += '❌ BLOCKED: Not user turn';
      setLastClickInfo(debugInfo);
      return;
    }

    if (gameOver) {
      debugInfo += '❌ BLOCKED: Game is over';
      setLastClickInfo(debugInfo);
      return;
    }

    // --- Start of new selection logic ---

    const pieceAtClick = board[row][col];
    const isOurPiece = (currentPlayer === 'tigers' && pieceAtClick === 1) || (currentPlayer === 'goats' && pieceAtClick === 2);

    // If a piece is already selected...
    if (selectedPosition) {
        const isMoveValid = validMoves.some(m => m.row === row && m.col === col);
        // If the click is a valid destination for the selected piece...
        if (isMoveValid) {
            debugInfo += '✅ SENDING MOVE: Valid movement';
            const move = {
                type: 'move' as const,
                from: [selectedPosition.row, selectedPosition.col],
                to: [row, col] as [number, number],
            };
            onMove(move);
            onSelectPosition(null); // Deselect after moving
        } else {
            // If another tiger is tapped, select it
            if (currentPlayer === 'tigers' && pieceAtClick === 1) {
                debugInfo += `✅ CHANGING SELECTION TO TIGER: (${row}, ${col})`;
                onSelectPosition({ row, col });
            } else {
                // Otherwise, deselect
                debugInfo += '❌ BLOCKED: Invalid movement - deselecting';
                onSelectPosition(null);
            }
        }
    } 
    // If no piece is selected yet...
    else {
        // If it's the goat placement phase...
        if (phase === 'placement' && currentPlayer === 'goats') {
            debugInfo += '📍 Placement phase for goats\n';
            const move = { type: 'place' as const, to: [row, col] as [number, number] };
            if (validMoves.some(m => m.row === row && m.col === col)) {
                onMove(move);
            } else {
                debugInfo += '❌ BLOCKED: Invalid placement spot';
            }
        } 
        // If we click on one of our pieces during movement phase...
        else if (isOurPiece) {
            debugInfo += `✅ SELECTING PIECE: (${row}, ${col})`;
            onSelectPosition({ row, col });
        } else {
            debugInfo += `❌ BLOCKED: Not a selectable piece`;
        }
    }
    
    setLastClickInfo(debugInfo);
    // --- End of new selection logic ---
  }, [board, currentPlayer, userSide, phase, gameOver, onMove, onSelectPosition, selectedPosition, validMoves]);

  const handleQuitGame = () => {
    Alert.alert(
      'Quit Game',
      'Are you sure you want to quit? You will lose this game.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: onQuitGame },
      ]
    );
    setShowGameMenu(false);
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
            setShowGameMenu(false);
            onRestartGame?.();
          }
        },
      ]
    );
  };

  const renderPlayerInfo = (player: GamePlayer | null, isActive: boolean) => {
    if (!player) return null;

    return (
      <View style={[styles.playerInfo, isActive && styles.activePlayer]}>
        <View style={styles.avatar}>
          <Ionicons name={player.side === 'tigers' ? "flash" : "shield"} size={20} color="#FFF" />
        </View>
        <View>
          <Text style={styles.playerName}>{player.username}</Text>
          <Text style={styles.playerRating}>{`Rating: ${player.rating}`}</Text>
        </View>
      </View>
    );
  };

  const renderGameStatus = () => {
    if (gameOver) {
      return (
        <View style={styles.gameStatusContainer}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <Text style={styles.gameStatusText}>Game Over!</Text>
        </View>
      );
    }
    
    if (isAIThinking) {
      return (
        <View style={styles.gameStatusContainer}>
          <Ionicons name="refresh" size={24} color="#FF6F00" />
          <Text style={styles.gameStatusText}>AI is thinking...</Text>
        </View>
      );
    }
    
    if (currentPlayerInfo) {
      return (
        <View style={styles.gameStatusContainer}>
          <Ionicons name="hourglass-outline" size={24} color="#FFF" />
          <Text style={styles.gameStatusText}>{`${currentPlayerInfo.username}'s turn`}</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      {/* Header: Player Info */}
      <View style={styles.header}>
        {renderPlayerInfo(player1, currentPlayer === player1?.side)}
        <View style={styles.separator} />
        {renderPlayerInfo(player2, currentPlayer === player2?.side)}
      </View>

      {/* Game Status */}
      {renderGameStatus()}

      {/* Goats Captured */}
      <View style={styles.capturedContainer}>
        <Text style={styles.capturedText}>Goats Captured: {goatsCaptured} / 5</Text>
        <View style={styles.capturedBar}>
          <View style={[styles.capturedProgress, { width: `${(goatsCaptured / 5) * 100}%` }]} />
        </View>
      </View>

      {/* Game Board or Game Over Screen */}
      <View style={styles.boardContainer}>
        {gameOver ? (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOverTitle}>
              {winner ? `${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!` : "It's a Draw!"}
            </Text>
            <TouchableOpacity style={styles.button} onPress={onNewGame}>
              <Text style={styles.buttonText}>New Game</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.quitButton]} onPress={onQuitGame}>
              <Text style={styles.buttonText}>Quit to Menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <GameBoard
            board={board}
            selectedPosition={selectedPosition}
            validMoves={validMoves}
            onPositionPress={handlePositionPress}
            disabled={!isUserTurn || gameOver}
            showValidMoves={true}
            currentPlayer={currentPlayer}
            phase={phase}
          />
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
              {'\n'}• Current Player: "{currentPlayer}" (len: {currentPlayer?.length})
              {'\n'}• User Side: "{userSide}" (len: {userSide?.length})
              {'\n'}• Phase: {phase}
              {'\n'}• Is User Turn: {isUserTurn ? 'YES' : 'NO'}
              {'\n'}• Strict Comparison: "{currentPlayer}" === "{userSide}" = {currentPlayer === userSide ? 'TRUE' : 'FALSE'}
              {'\n'}• Loose Comparison: "{currentPlayer}" == "{userSide}" = {currentPlayer == userSide ? 'TRUE' : 'FALSE'}
              {'\n'}• Types: {typeof currentPlayer} vs {typeof userSide}
              {'\n'}• Game Over: {gameOver ? 'YES' : 'NO'}
              {'\n'}• Valid Actions: {validMoves.length}
              {'\n'}• Player1 Side: "{player1?.side}"
              {'\n'}• Player2 Side: "{player2?.side}"
              {'\n'}• Game State Source: {board ? 'BACKEND' : 'DEFAULT'}
            </Text>
            <Text style={styles.debugText}>
              {'\n'}<Text style={styles.debugLabel}>Valid Actions Detail:</Text>
              {'\n'}{JSON.stringify(validMoves, null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
    marginBottom: 10,
  },
  separator: {
    width: 1,
    height: '80%',
    backgroundColor: '#333',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  activePlayer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3a3a5e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeAvatar: {
    borderColor: '#FFD700',
  },
  playerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerRating: {
    color: '#999',
    fontSize: 12,
  },
  gameStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  gameStatusText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  capturedContainer: {
    width: '80%',
    marginVertical: 10,
  },
  capturedText: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },
  capturedBar: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
  },
  capturedProgress: {
    height: '100%',
    backgroundColor: '#FF5252',
    borderRadius: 5,
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 25,
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
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 10,
    maxHeight: height / 4,
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverContainer: {
    backgroundColor: '#1F2937',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    width: '80%',
    borderWidth: 1,
    borderColor: '#F97316',
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 25,
    textAlign: 'center',
  },
  gameOverText: {
    fontSize: 20,
    color: '#9CA3AF',
    marginBottom: 25,
  },
  button: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  quitButton: {
    backgroundColor: '#4B5563',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  boardContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GameScreen; 