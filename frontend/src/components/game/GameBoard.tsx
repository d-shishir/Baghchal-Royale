import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import Svg, { Line, Circle, G } from 'react-native-svg';
import { colors } from '../../theme';

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

// Theme colors for consistent highlighting using the app's color scheme
const THEME_COLORS = {
  // Piece colors using theme
  tiger: colors.dark.tigerColor, // '#FF6F00'
  goat: '#FFFFFF',
  
  // Highlight colors for placement
  goatPlacement: 'rgba(33, 150, 243, 0.2)', // Blue for goat placement
  goatPlacementBorder: '#2196F3',
  
  // Highlight colors for movement destinations
  tigerDestination: 'rgba(255, 193, 7, 0.2)', // Gold for tiger moves
  tigerDestinationBorder: colors.dark.highlightColor, // '#FFD54F'
  goatDestination: 'rgba(76, 175, 80, 0.2)', // Green for goat moves  
  goatDestinationBorder: colors.dark.validMoveColor, // '#4CAF50'
  
  // Selection indicators
  tigerSelection: colors.dark.highlightColor, // '#FFD54F' - Gold for selected tigers
  goatSelection: colors.dark.goatColor, // '#66BB6A' - Light green for selected goats
  
  // Board elements
  boardLine: colors.dark.boardColor, // '#6D4C41'
  boardBackground: 'transparent',
}

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
    const drawnConnections = new Set<string>();

    // This data is sourced from `baghchal.ts` to ensure the rendered board
    // perfectly matches the game's logical structure.
    const allConnections: { [key: string]: [number, number][] } = {
      '0,0': [[0,1], [1,0], [1,1]],
      '0,1': [[0,0], [0,2], [1,1]],
      '0,2': [[0,1], [0,3], [1,2], [1,1], [1,3]],
      '0,3': [[0,2], [0,4], [1,3]],
      '0,4': [[0,3], [1,4], [1,3]],

      '1,0': [[0,0], [2,0], [1,1]],
      '1,1': [[1,0], [0,1], [1,2], [2,1], [2,2], [0,0], [0,2], [2,0]],
      '1,2': [[0,2], [1,1], [1,3], [2,2]],
      '1,3': [[0,3], [0,4], [1,2], [1,4], [2,2], [2,3], [2,4]],
      '1,4': [[0,4], [1,3], [2,4]],

      '2,0': [[1,0], [3,0], [2,1], [1,1], [3,1]],
      '2,1': [[2,0], [1,1], [3,1], [2,2]],
      '2,2': [[1,1], [1,2], [1,3], [2,1], [2,3], [3,1], [3,2], [3,3]],
      '2,3': [[2,2], [1,3], [3,3], [2,4]],
      '2,4': [[1,4], [1,3], [2,3], [3,3], [3,4]],

      '3,0': [[2,0], [4,0], [3,1]],
      '3,1': [[3,0], [2,0], [2,1], [3,2], [4,0], [4,2], [2,2], [4,1]],
      '3,2': [[3,1], [2,2], [3,3], [4,2]],
      '3,3': [[3,2], [2,3], [2,4], [3,4], [4,2], [4,3], [4,4], [2,2]],
      '3,4': [[2,4], [3,3], [4,4]],

      '4,0': [[3,0], [4,1], [3,1]],
      '4,1': [[4,0], [4,2], [3,1]],
      '4,2': [[4,1], [3,1], [3,2], [3,3], [4,3]],
      '4,3': [[4,2], [3,3], [4,4]],
      '4,4': [[3,4], [4,3], [3,3]]
    };

    for (const posKey in allConnections) {
      const [fromRow, fromCol] = posKey.split(',').map(Number);
      const connections = allConnections[posKey];

      for (const to of connections) {
        const [toRow, toCol] = to;
        
        // Create a canonical key for the connection to avoid drawing lines twice
        // e.g., '0,0-0,1' is the same as '0,1-0,0'
        const fromKey = `${fromRow},${fromCol}`;
        const toKey = `${toRow},${toCol}`;
        const connectionKey = [fromKey, toKey].sort().join('-');

        if (!drawnConnections.has(connectionKey)) {
          lines.push(
            <Line
              key={connectionKey}
              x1={fromCol * CELL_SIZE}
              y1={fromRow * CELL_SIZE}
              x2={toCol * CELL_SIZE}
              y2={toRow * CELL_SIZE}
              stroke={THEME_COLORS.boardLine}
              strokeWidth={2}
            />
          );
          drawnConnections.add(connectionKey);
        }
      }
    }
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
        let borderColor = 'transparent';
        let borderWidth = 0;
        
        // Determine highlight based on game state
        if (goatPlacement && board[row][col] === 0) {
          // Goat placement: highlight empty squares where goats can be placed
          isValid = validMoves.some(m => m.row === row && m.col === col);
          if (isValid) {
            highlightColor = THEME_COLORS.goatPlacement;
            borderColor = THEME_COLORS.goatPlacementBorder;
            borderWidth = 2;
          }
        } else if (tigerSelected) {
          // Tiger move: highlight valid destinations for selected tiger
          isValid = validMoves.some(m => m.row === row && m.col === col);
          if (isValid) {
            highlightColor = THEME_COLORS.tigerDestination;
            borderColor = THEME_COLORS.tigerDestinationBorder;
            borderWidth = 2;
          }
        } else if (goatSelected) {
          // Goat move: highlight valid destinations for selected goat
          isValid = validMoves.some(m => m.row === row && m.col === col);
          if (isValid) {
            highlightColor = THEME_COLORS.goatDestination;
            borderColor = THEME_COLORS.goatDestinationBorder;
            borderWidth = 2;
          }
        }
        
        // Allow piece selection
        if (tigerSelection && board[row][col] === 1) {
          isValid = true; // Tigers can always be selected
        }
        if (goatSelection && board[row][col] === 2) {
          isValid = true; // Goats can always be selected during movement
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
              borderWidth: borderWidth,
              borderColor: borderColor,
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
        const selectionColor = isTiger ? THEME_COLORS.tigerSelection : THEME_COLORS.goatSelection;
        
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
              zIndex: isSelected ? 4 : 2,
              borderWidth: isSelected ? 3 : 0,
              borderColor: isSelected ? selectionColor : 'transparent',
              borderRadius: PIECE_SIZE / 2,
              shadowColor: isSelected ? selectionColor : 'transparent',
              shadowOpacity: isSelected ? 0.8 : 0,
              shadowRadius: isSelected ? 8 : 0,
              shadowOffset: { width: 0, height: 0 },
              transform: [{ scale: animatedValues[`${row}-${col}`] }],
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handlePositionPress(row, col)}
              disabled={disabled}
            >
              <Svg width={PIECE_SIZE} height={PIECE_SIZE}>
                <Circle
                  cx={PIECE_SIZE / 2}
                  cy={PIECE_SIZE / 2}
                  r={PIECE_SIZE / 2 - 2}
                  fill={isTiger ? THEME_COLORS.tiger : THEME_COLORS.goat}
                  stroke={THEME_COLORS.boardLine}
                  strokeWidth={2}
                />
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
        {showValidMoves && renderBoardPositions()}
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
});

export default GameBoard; 