import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
  ColorValue,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer } from 'expo-audio';
import { FontAwesome5 } from '@expo/vector-icons';

import { PieceType, PlayerSide, GamePhase } from '../../game-logic/baghchal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Position {
  row: number;
  col: number;
}

interface GameBoardProps {
  board: PieceType[][];
  selectedPosition: Position | null;
  validMoves: Position[];
  onPositionPress: (position: Position) => void;
  isMoveLoading?: boolean;
  currentPlayer: PlayerSide;
  phase: GamePhase;
}

const { width: screenWidth } = Dimensions.get('window');
const BOARD_CONTAINER_SIZE = screenWidth - 50;
const PADDING = 20;
const BOARD_GRID_SIZE = BOARD_CONTAINER_SIZE - PADDING * 2;
const CELL_SIZE = BOARD_GRID_SIZE / 4;
const PIECE_DIAMETER = CELL_SIZE * 0.6;

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  selectedPosition,
  validMoves,
  onPositionPress,
  isMoveLoading = false,
  currentPlayer,
  phase,
}) => {
  const moveSoundPlayer = useAudioPlayer(require('../../../assets/audio/move_sound.mp3'));
  const captureSoundPlayer = useAudioPlayer(require('../../../assets/audio/capture_sound.mp3'));

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  }, [board]);

  const playMoveSound = useCallback(async () => {
    moveSoundPlayer.seekTo(0);
    moveSoundPlayer.play();
  }, [moveSoundPlayer]);
  
  const playCaptureSound = useCallback(async () => {
    captureSoundPlayer.seekTo(0);
    captureSoundPlayer.play();
  }, [captureSoundPlayer]);

  const handlePositionPress = (row: number, col: number) => {
    if (isMoveLoading) return;

    const piece = board[row][col];
    const isCapture = validMoves.some(m => m.row === row && m.col === col) && 
                      selectedPosition && 
                      Math.abs(selectedPosition.row - row) > 1;

    if (isCapture) {
      playCaptureSound();
    } else {
      playMoveSound();
    }
    onPositionPress({ row, col });
  };

  const renderLines = () => {
    const lines = [];
    const connections = [
      // Horizontal and vertical lines
      ...Array.from({ length: 5 }, (_, i) => ({ x1: PADDING, y1: i * CELL_SIZE + PADDING, x2: BOARD_GRID_SIZE + PADDING, y2: i * CELL_SIZE + PADDING })),
      ...Array.from({ length: 5 }, (_, i) => ({ x1: i * CELL_SIZE + PADDING, y1: PADDING, x2: i * CELL_SIZE + PADDING, y2: BOARD_GRID_SIZE + PADDING })),
      // Diagonal lines
      { x1: PADDING, y1: PADDING, x2: BOARD_GRID_SIZE + PADDING, y2: BOARD_GRID_SIZE + PADDING },
      { x1: BOARD_GRID_SIZE + PADDING, y1: PADDING, x2: PADDING, y2: BOARD_GRID_SIZE + PADDING },
      { x1: PADDING, y1: 2 * CELL_SIZE + PADDING, x2: 2 * CELL_SIZE + PADDING, y2: PADDING },
      { x1: 2 * CELL_SIZE + PADDING, y1: PADDING, x2: BOARD_GRID_SIZE + PADDING, y2: 2 * CELL_SIZE + PADDING },
      { x1: PADDING, y1: 2 * CELL_SIZE + PADDING, x2: 2 * CELL_SIZE + PADDING, y2: BOARD_GRID_SIZE + PADDING },
      { x1: 2 * CELL_SIZE + PADDING, y1: BOARD_GRID_SIZE + PADDING, x2: BOARD_GRID_SIZE + PADDING, y2: 2 * CELL_SIZE + PADDING },
    ];

    for (const line of connections) {
      lines.push(<Line {...line} stroke="rgba(0,0,0,0.2)" strokeWidth={2} key={`${line.x1}-${line.y1}-${line.x2}-${line.y2}`} />);
    }
    return lines;
  };

  const renderPiecesAndHighlights = () => {
    const elements = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const piece = board[row][col];
        const isSelected = selectedPosition?.row === row && selectedPosition?.col === col;
        const isValidMove = validMoves.some(m => m.row === row && m.col === col);

        elements.push(
          <TouchableOpacity
            key={`cell-${row}-${col}`}
            style={[
              styles.touchableIntersection,
              {
                left: col * CELL_SIZE + PADDING,
                top: row * CELL_SIZE + PADDING,
                width: PIECE_DIAMETER,
                height: PIECE_DIAMETER,
                transform: [{ translateX: -PIECE_DIAMETER / 2 }, { translateY: -PIECE_DIAMETER / 2 }],
              },
            ]}
            onPress={() => handlePositionPress(row, col)}
            activeOpacity={0.7}
          >
            {isValidMove && piece === PieceType.EMPTY && <View style={styles.validMoveIndicator} />}
            {piece !== PieceType.EMPTY && (
              <Piece isTiger={piece === PieceType.TIGER} isSelected={isSelected} />
            )}
          </TouchableOpacity>
        );
      }
    }
    return elements;
  };

  return (
    <View style={styles.gameWrapper}>
      <View style={styles.boardContainer}>
        <Svg height={BOARD_CONTAINER_SIZE} width={BOARD_CONTAINER_SIZE}>
          {renderLines()}
        </Svg>
      </View>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {renderPiecesAndHighlights()}
      </View>
    </View>
  );
};

const Piece = ({ isTiger, isSelected }: { isTiger: boolean; isSelected: boolean }) => {
  const gradientColors = isTiger
    ? (['#FF8F00', '#FF6F00'] as [string, string])
    : (['#E0E0E0', '#BDBDBD'] as [string, string]);

  const iconName = isTiger ? 'cat' : 'dot-circle';
  const iconColor = isTiger ? '#FFF' : '#424242';

  return (
    <View style={[styles.pieceContainer, isSelected && styles.selectedPiece]}>
      <LinearGradient colors={gradientColors} style={styles.piece}>
        <FontAwesome5 name={iconName} size={PIECE_DIAMETER * 0.5} color={iconColor} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  gameWrapper: {
    width: BOARD_CONTAINER_SIZE,
    height: BOARD_CONTAINER_SIZE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  boardContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#C8A479',
    overflow: 'hidden',
  },
  touchableIntersection: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  validMoveIndicator: {
    width: PIECE_DIAMETER * 0.4,
    height: PIECE_DIAMETER * 0.4,
    borderRadius: PIECE_DIAMETER * 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  pieceContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPiece: {
    transform: [{ scale: 1.1 }],
    shadowColor: '#FFD700',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  piece: {
    width: '100%',
    height: '100%',
    borderRadius: PIECE_DIAMETER / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default GameBoard; 