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

  const renderPieces = () => {
    const pieces = [];
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const piece = board[row][col];
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;
        const key = `${row}-${col}`;
        
        // Position indicator (always present)
        pieces.push(
          <TouchableOpacity
            key={`pos-${key}`}
            style={[
              styles.position,
              {
                left: x - 8,
                top: y - 8,
              },
              isSelected(row, col) && styles.selectedPosition,
              isValidMove(row, col) && showValidMoves && styles.validMovePosition,
            ]}
            onPress={() => handlePositionPress(row, col)}
            disabled={disabled}
          >
            <View style={styles.positionIndicator} />
          </TouchableOpacity>
        );
        
        // Piece (if present)
        if (piece !== 0) {
          pieces.push(
            <Animated.View
              key={`piece-${key}`}
              style={[
                styles.piece,
                {
                  left: x - PIECE_SIZE / 2,
                  top: y - PIECE_SIZE / 2,
                  transform: [{ scale: animatedValues[key] }],
                },
                piece === 1 ? styles.tiger : styles.goat,
              ]}
            />
          );
        }
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