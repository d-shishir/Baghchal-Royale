import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';

import { PieceType, PlayerSide, GamePhase } from '../../game-logic/baghchal';
import TigerIcon from './TigerIcon';
import GoatIcon from './GoatIcon';
import { useAppTheme } from '../../theme';
import { RootState } from '../../store';



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
const BOARD_CONTAINER_SIZE = screenWidth - 48;
const PADDING = 24;
const BOARD_GRID_SIZE = BOARD_CONTAINER_SIZE - PADDING * 2;
const CELL_SIZE = BOARD_GRID_SIZE / 4;
const PIECE_DIAMETER = CELL_SIZE * 0.55;

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  selectedPosition,
  validMoves,
  onPositionPress,
  isMoveLoading = false,
  currentPlayer,
  phase,
}) => {
  const theme = useAppTheme();
  const enableSoundEffects = useSelector((state: RootState) => state.ui.enableSoundEffects);
  const enableVibration = useSelector((state: RootState) => state.ui.enableVibration);
  const enableAnimations = useSelector((state: RootState) => state.ui.enableAnimations);
  
  const moveSoundPlayer = useAudioPlayer(require('../../../assets/audio/move_sound.mp3'));
  const captureSoundPlayer = useAudioPlayer(require('../../../assets/audio/capture_sound.mp3'));

  useEffect(() => {
    if (enableAnimations) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    }
  }, [board, enableAnimations]);

  const playMoveSound = useCallback(async () => {
    if (!enableSoundEffects) return;
    moveSoundPlayer.seekTo(0);
    moveSoundPlayer.play();
  }, [moveSoundPlayer, enableSoundEffects]);
  
  const playCaptureSound = useCallback(async () => {
    if (!enableSoundEffects) return;
    captureSoundPlayer.seekTo(0);
    captureSoundPlayer.play();
  }, [captureSoundPlayer, enableSoundEffects]);

  const triggerHaptic = useCallback((isCapture: boolean) => {
    if (!enableVibration) return;
    if (isCapture) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [enableVibration]);

  const handlePositionPress = (row: number, col: number) => {
    if (isMoveLoading) return;

    const isCapture = validMoves.some(m => m.row === row && m.col === col) && 
                      selectedPosition && 
                      Math.abs(selectedPosition.row - row) > 1;

    if (isCapture) {
      playCaptureSound();
      triggerHaptic(true);
    } else {
      playMoveSound();
      triggerHaptic(false);
    }
    onPositionPress({ row, col });
  };

  const renderLines = () => {
    const lines = [];
    const lineColor = theme.isDark ? 'rgba(139,90,43,0.6)' : 'rgba(101,67,33,0.4)';
    const lineWidth = 2;
    
    const connections = [
      // Horizontal lines
      ...Array.from({ length: 5 }, (_, i) => ({ 
        x1: PADDING, 
        y1: i * CELL_SIZE + PADDING, 
        x2: BOARD_GRID_SIZE + PADDING, 
        y2: i * CELL_SIZE + PADDING 
      })),
      // Vertical lines
      ...Array.from({ length: 5 }, (_, i) => ({ 
        x1: i * CELL_SIZE + PADDING, 
        y1: PADDING, 
        x2: i * CELL_SIZE + PADDING, 
        y2: BOARD_GRID_SIZE + PADDING 
      })),
      // Main diagonals
      { x1: PADDING, y1: PADDING, x2: BOARD_GRID_SIZE + PADDING, y2: BOARD_GRID_SIZE + PADDING },
      { x1: BOARD_GRID_SIZE + PADDING, y1: PADDING, x2: PADDING, y2: BOARD_GRID_SIZE + PADDING },
      // Secondary diagonals
      { x1: PADDING, y1: 2 * CELL_SIZE + PADDING, x2: 2 * CELL_SIZE + PADDING, y2: PADDING },
      { x1: 2 * CELL_SIZE + PADDING, y1: PADDING, x2: BOARD_GRID_SIZE + PADDING, y2: 2 * CELL_SIZE + PADDING },
      { x1: PADDING, y1: 2 * CELL_SIZE + PADDING, x2: 2 * CELL_SIZE + PADDING, y2: BOARD_GRID_SIZE + PADDING },
      { x1: 2 * CELL_SIZE + PADDING, y1: BOARD_GRID_SIZE + PADDING, x2: BOARD_GRID_SIZE + PADDING, y2: 2 * CELL_SIZE + PADDING },
    ];

    for (const line of connections) {
      lines.push(
        <Line 
          {...line} 
          stroke={lineColor} 
          strokeWidth={lineWidth}
          key={`${line.x1}-${line.y1}-${line.x2}-${line.y2}`} 
        />
      );
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
            {/* Valid move indicator - subtle dot */}
            {isValidMove && piece === PieceType.EMPTY && (
              <View style={styles.validMoveIndicator} />
            )}
            
            {/* Game piece */}
            {piece !== PieceType.EMPTY && (
              <View style={[
                styles.pieceContainer, 
                isSelected && { 
                  transform: [{ scale: 1.1 }],
                }
              ]}>
                {piece === PieceType.TIGER ? (
                  <TigerIcon size={PIECE_DIAMETER} />
                ) : (
                  <GoatIcon size={PIECE_DIAMETER} />
                )}
                {isSelected && (
                  <View style={[styles.selectionRing, { 
                    borderColor: piece === PieceType.TIGER ? theme.colors.tigerColor : theme.colors.goatColor 
                  }]} />
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      }
    }
    return elements;
  };

  const boardBgColors = theme.isDark 
    ? ['#3D3020', '#4A3C2A', '#3D3020'] as const
    : ['#DEB887', '#D2B48C', '#DEB887'] as const;

  return (
    <View style={styles.gameWrapper}>
      <LinearGradient
        colors={boardBgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.boardContainer}
      >
        {/* Board lines */}
        <Svg height={BOARD_CONTAINER_SIZE} width={BOARD_CONTAINER_SIZE} style={styles.svgBoard}>
          {renderLines()}
        </Svg>
        
        {/* Pieces */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          {renderPiecesAndHighlights()}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  gameWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 15,
    borderRadius: 12,
  },
  boardContainer: {
    width: BOARD_CONTAINER_SIZE,
    height: BOARD_CONTAINER_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  svgBoard: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  touchableIntersection: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  validMoveIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(139, 90, 43, 0.5)',
  },
  pieceContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionRing: {
    position: 'absolute',
    width: '110%',
    height: '110%',
    borderRadius: 999,
    borderWidth: 3,
  },
});

export default GameBoard; 