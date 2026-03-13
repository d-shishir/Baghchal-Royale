import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { PieceType } from '../../game-logic/baghchal';
import TigerIcon from './TigerIcon';
import GoatIcon from './GoatIcon';

// ─── Board geometry (must match GameBoard.tsx) ────────────────────────────────
const { width: screenWidth } = Dimensions.get('window');
const BOARD_CONTAINER_SIZE = screenWidth - 48;
const PADDING = 24;
const BOARD_GRID_SIZE = BOARD_CONTAINER_SIZE - PADDING * 2;
const CELL_SIZE = BOARD_GRID_SIZE / 4;
const PIECE_DIAMETER = CELL_SIZE * 0.55;

// ─────────────────────────────────────────────────────────────────────────────

interface AnimatedPieceProps {
  /** Grid position where the piece starts (e.g. [row, col]) */
  from: [number, number];
  /** Grid position where the piece ends */
  to: [number, number];
  /** Which piece is moving */
  pieceType: PieceType.TIGER | PieceType.GOAT;
  /** Called once the slide animation has finished */
  onAnimationComplete: () => void;
  /** Duration in ms */
  duration?: number;
}

/** Converts a grid [row, col] to the pixel centre of that intersection. */
const gridToPixel = (row: number, col: number) => ({
  x: col * CELL_SIZE + PADDING - PIECE_DIAMETER / 2,
  y: row * CELL_SIZE + PADDING - PIECE_DIAMETER / 2,
});

/**
 * An absolutely-positioned piece that animates from one grid intersection to
 * another. It renders as an overlay on top of the board so the real board
 * can remain frozen while this component "flies" the piece into place.
 */
const AnimatedPiece: React.FC<AnimatedPieceProps> = ({
  from,
  to,
  pieceType,
  onAnimationComplete,
  duration = 550,
}) => {
  const fromPx = gridToPixel(from[0], from[1]);
  const toPx   = gridToPixel(to[0],   to[1]);

  const translateX = useSharedValue(fromPx.x);
  const translateY = useSharedValue(fromPx.y);
  const scale      = useSharedValue(1);

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);

    // Kick off position animation
    translateX.value = withTiming(toPx.x, { duration, easing });
    translateY.value = withTiming(toPx.y, { duration, easing }, (finished) => {
      if (finished) {
        runOnJS(onAnimationComplete)();
      }
    });

    // Subtle scale pulse: grow slightly in the middle of the trip then settle
    scale.value = withTiming(1.15, { duration: duration * 0.4, easing: Easing.out(Easing.quad) }, () => {
      scale.value = withTiming(1, { duration: duration * 0.6, easing: Easing.in(Easing.quad) });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.piece, animatedStyle]}>
      {pieceType === PieceType.TIGER ? (
        <TigerIcon size={PIECE_DIAMETER} />
      ) : (
        <GoatIcon size={PIECE_DIAMETER} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    width: PIECE_DIAMETER,
    height: PIECE_DIAMETER,
    justifyContent: 'center',
    alignItems: 'center',
    // Elevated so it renders above normal board pieces
    zIndex: 100,
  },
});

export default AnimatedPiece;
