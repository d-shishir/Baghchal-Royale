import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated,
} from 'react-native';
import Svg, { Line, Circle, G } from 'react-native-svg';

interface Position {
  row: number;
  col: number;
}

interface GameBoardProps {
  board: number[][];
  selectedPosition: Position | null;
  validMoves: Position[];
  onPositionPress: (position: Position) => void;
  disabled?: boolean;
  showValidMoves?: boolean;
  currentPlayer: string;
  phase: string;
}

const { width: screenWidth } = Dimensions.get('window');
const BOARD_SIZE = Math.min(screenWidth - 40, 400);
const CELL_SIZE = BOARD_SIZE / 4;
const PIECE_SIZE = 24;

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  selectedPosition,
  validMoves,
  onPositionPress,
  disabled = false,
  showValidMoves = true,
  currentPlayer,
  phase,
}) => {
  const [animatedValues] = useState(() => {
    const values: { [key: string]: Animated.Value } = {};
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        values[`${row}-${col}`] = new Animated.Value(1);
      }
    }
    return values;
  });

  const animatePiece = useCallback((row: number, col: number) => {
    const key = `${row}-${col}`;
    Animated.sequence([
      Animated.timing(animatedValues[key], {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues[key], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animatedValues]);

  const handlePositionPress = useCallback((row: number, col: number) => {
    console.log('🎯 GameBoard click detected:', row, col, 'disabled:', disabled);
    if (disabled) return;
    
    animatePiece(row, col);
    onPositionPress({ row, col });
  }, [disabled, onPositionPress, animatePiece]);

  const isValidMove = useCallback((row: number, col: number) => {
    return validMoves.some(move => move.row === row && move.col === col);
  }, [validMoves]);

  const isSelected = useCallback((row: number, col: number) => {
    return selectedPosition?.row === row && selectedPosition?.col === col;
  }, [selectedPosition]);

  const renderBoardLines = () => {
    const lines = [];
    
    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
      lines.push(
        <Line
          key={`h-${i}`}
          x1={0}
          y1={i * CELL_SIZE}
          x2={BOARD_SIZE}
          y2={i * CELL_SIZE}
          stroke="#6D4C41"
          strokeWidth={2}
        />
      );
    }
    
    // Vertical lines
    for (let i = 0; i <= 4; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          x1={i * CELL_SIZE}
          y1={0}
          x2={i * CELL_SIZE}
          y2={BOARD_SIZE}
          stroke="#6D4C41"
          strokeWidth={2}
        />
      );
    }
    
    // Diagonal lines - Two main diagonals (cross) + inner slanted square
    // Main diagonal: top-left to bottom-right
    lines.push(
      <Line
        key="main-diagonal"
        x1={0}
        y1={0}
        x2={BOARD_SIZE}
        y2={BOARD_SIZE}
        stroke="#6D4C41"
        strokeWidth={2}
      />
    );
    
    // Anti-diagonal: top-right to bottom-left
    lines.push(
      <Line
        key="anti-diagonal"
        x1={BOARD_SIZE}
        y1={0}
        x2={0}
        y2={BOARD_SIZE}
        stroke="#6D4C41"
        strokeWidth={2}
      />
    );
    
    // Inner slanted square (diamond) connecting middle points
    // Top middle (0,2) to right middle (2,4)
    lines.push(
      <Line
        key="diamond-1"
        x1={2 * CELL_SIZE}
        y1={0}
        x2={BOARD_SIZE}
        y2={2 * CELL_SIZE}
        stroke="#6D4C41"
        strokeWidth={2}
      />
    );
    
    // Right middle (2,4) to bottom middle (4,2)
    lines.push(
      <Line
        key="diamond-2"
        x1={BOARD_SIZE}
        y1={2 * CELL_SIZE}
        x2={2 * CELL_SIZE}
        y2={BOARD_SIZE}
        stroke="#6D4C41"
        strokeWidth={2}
      />
    );
    
    // Bottom middle (4,2) to left middle (2,0)
    lines.push(
      <Line
        key="diamond-3"
        x1={2 * CELL_SIZE}
        y1={BOARD_SIZE}
        x2={0}
        y2={2 * CELL_SIZE}
        stroke="#6D4C41"
        strokeWidth={2}
      />
    );
    
    // Left middle (2,0) to top middle (0,2) - completing the diamond
    lines.push(
      <Line
        key="diamond-4"
        x1={0}
        y1={2 * CELL_SIZE}
        x2={2 * CELL_SIZE}
        y2={0}
        stroke="#6D4C41"
        strokeWidth={2}
      />
    );
    
    return lines;
  };

  const renderBoardPositions = () => {
    const positions = [];
    const tigerSelected = selectedPosition && board[selectedPosition.row][selectedPosition.col] === 1;
    const goatSelected = selectedPosition && board[selectedPosition.row][selectedPosition.col] === 2;
    const goatPlacement = !selectedPosition && currentPlayer === 'goats' && phase === 'placement';
    const goatSelection = currentPlayer === 'goats' && phase === 'movement';
    const tigerSelection = currentPlayer === 'tigers';
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        let isValid = false;
        let highlightColor = 'transparent';
        // Goat placement: highlight/tap empty squares
        if (goatPlacement && board[row][col] === 0) {
          isValid = validMoves.some(m => m.row === row && m.col === col);
          highlightColor = isValid ? 'rgba(0, 200, 255, 0.15)' : 'transparent';
        }
        // Tiger move: highlight/tap valid destinations
        else if (tigerSelected) {
          isValid = validMoves.some(m => m.row === row && m.col === col);
          highlightColor = isValid ? 'rgba(255, 215, 0, 0.15)' : 'transparent';
        }
        // Tiger selection: allow tapping on tigers to select, even if one is already selected
        if (tigerSelection && board[row][col] === 1) {
          isValid = true;
          // No highlight for selection overlays
        }
        // Goat move: highlight/tap valid destinations
        else if (goatSelected) {
          isValid = validMoves.some(m => m.row === row && m.col === col);
          highlightColor = isValid ? 'rgba(139, 195, 74, 0.15)' : 'transparent';
        }
        // Goat selection: allow tapping on goats to select, even if one is already selected
        if (goatSelection && board[row][col] === 2) {
          isValid = true;
          // No highlight for selection overlays
        }
        positions.push(
          <TouchableOpacity
            key={`pos-${row}-${col}`}
            style={{
              position: 'absolute',
              left: col * CELL_SIZE - 12,
              top: row * CELL_SIZE - 12,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: highlightColor,
              borderWidth: isValid && tigerSelected ? 1 : isValid && goatSelected ? 1 : 0,
              borderColor: isValid && tigerSelected ? '#FFD700' : isValid && goatPlacement ? '#00C8FF' : isValid && goatSelected ? '#8BC34A' : 'transparent',
              zIndex: 3,
            }}
            onPress={() => isValid && handlePositionPress(row, col)}
            disabled={disabled || !isValid}
            activeOpacity={0.7}
          />
        );
      }
    }
    return positions;
  };

  const renderPieces = () => {
    const pieces = [];
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const piece = board[row][col];
        if (piece === 0) continue;
        const isSelected = selectedPosition && selectedPosition.row === row && selectedPosition.col === col;
        const isTiger = piece === 1;
        pieces.push(
          <Animated.View
            key={`piece-${row}-${col}`}
            style={{
              position: 'absolute',
              left: col * CELL_SIZE - PIECE_SIZE / 2,
              top: row * CELL_SIZE - PIECE_SIZE / 2,
              width: PIECE_SIZE,
              height: PIECE_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: isSelected ? 2 : 1,
              borderWidth: isSelected && isTiger ? 3 : 0,
              borderColor: isSelected && isTiger ? '#FFD700' : 'transparent',
              borderRadius: PIECE_SIZE / 2,
              shadowColor: isSelected && isTiger ? '#FFD700' : 'transparent',
              shadowOpacity: isSelected && isTiger ? 0.8 : 0,
              shadowRadius: isSelected && isTiger ? 10 : 0,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handlePositionPress(row, col)}
              disabled={disabled}
            >
              <Svg width={PIECE_SIZE} height={PIECE_SIZE}>
                {piece === 1 ? (
                  <Circle
                    cx={PIECE_SIZE / 2}
                    cy={PIECE_SIZE / 2}
                    r={PIECE_SIZE / 2 - 4}
                    fill="#FF9800"
                    stroke="#6D4C41"
                    strokeWidth={2}
                  />
                ) : (
                  <Circle
                    cx={PIECE_SIZE / 2}
                    cy={PIECE_SIZE / 2}
                    r={PIECE_SIZE / 2 - 4}
                    fill="#FFF"
                    stroke="#6D4C41"
                    strokeWidth={2}
                  />
                )}
              </Svg>
            </TouchableOpacity>
          </Animated.View>
        );
      }
    }
    return pieces;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
        <Svg
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          style={styles.boardLines}
        >
          <G>{renderBoardLines()}</G>
        </Svg>
        {renderBoardPositions()}
        {renderPieces()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  board: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  boardLines: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  position: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  positionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#757575',
    opacity: 0.3,
  },
  selectedPosition: {
    backgroundColor: '#FFD54F',
    opacity: 0.8,
  },
  validMovePosition: {
    backgroundColor: '#4CAF50',
    opacity: 0.6,
  },
  piece: {
    position: 'absolute',
    width: PIECE_SIZE,
    height: PIECE_SIZE,
    borderRadius: PIECE_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 2,
  },
  tiger: {
    backgroundColor: '#FF6F00',
  },
  goat: {
    backgroundColor: '#66BB6A',
  },
});

export default GameBoard; 