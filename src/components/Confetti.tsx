import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  color: string;
  startX: number;
  startY: number;
  animX: Animated.Value;
  animY: Animated.Value;
  animRotate: Animated.Value;
  animOpacity: Animated.Value;
  size: number;
  shape: 'square' | 'circle' | 'rectangle';
}

interface ConfettiProps {
  visible: boolean;
  count?: number;
  duration?: number;
  colors?: string[];
  onComplete?: () => void;
}

const DEFAULT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#F38181', // Coral
  '#AA96DA', // Lavender
  '#FCBAD3', // Pink
  '#A8D8EA', // Light Blue
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
];

export const Confetti: React.FC<ConfettiProps> = ({
  visible,
  count = 50,
  duration = 2500,
  colors = DEFAULT_COLORS,
  onComplete,
}) => {
  const pieces = useRef<ConfettiPiece[]>([]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const confettiPieces = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const startX = Math.random() * SCREEN_WIDTH;
      const startY = -50;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 8 + Math.random() * 8;
      const shapes: Array<'square' | 'circle' | 'rectangle'> = ['square', 'circle', 'rectangle'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      return {
        id: i,
        color,
        startX,
        startY,
        animX: new Animated.Value(0),
        animY: new Animated.Value(0),
        animRotate: new Animated.Value(0),
        animOpacity: new Animated.Value(1),
        size,
        shape,
      };
    });
  }, [count, colors]);

  useEffect(() => {
    if (visible) {
      // Reset all animations
      confettiPieces.forEach((piece) => {
        piece.animX.setValue(0);
        piece.animY.setValue(0);
        piece.animRotate.setValue(0);
        piece.animOpacity.setValue(1);
      });

      // Start animations
      const animations = confettiPieces.map((piece) => {
        const fallDistance = SCREEN_HEIGHT + 100;
        const swayAmount = (Math.random() - 0.5) * 200;
        const rotations = 2 + Math.random() * 4;
        const individualDuration = duration * (0.8 + Math.random() * 0.4);

        return Animated.parallel([
          // Horizontal sway
          Animated.sequence([
            Animated.timing(piece.animX, {
              toValue: swayAmount,
              duration: individualDuration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(piece.animX, {
              toValue: -swayAmount * 0.5,
              duration: individualDuration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(piece.animX, {
              toValue: swayAmount * 0.3,
              duration: individualDuration * 0.4,
              useNativeDriver: true,
            }),
          ]),
          // Vertical fall with easing
          Animated.timing(piece.animY, {
            toValue: fallDistance,
            duration: individualDuration,
            useNativeDriver: true,
          }),
          // Rotation
          Animated.timing(piece.animRotate, {
            toValue: rotations,
            duration: individualDuration,
            useNativeDriver: true,
          }),
          // Fade out at the end
          Animated.sequence([
            Animated.delay(individualDuration * 0.7),
            Animated.timing(piece.animOpacity, {
              toValue: 0,
              duration: individualDuration * 0.3,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      animationRef.current = Animated.stagger(20, animations);
      animationRef.current.start(() => {
        onComplete?.();
      });
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [visible, confettiPieces, duration, onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece) => {
        const rotation = piece.animRotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        const shapeStyle =
          piece.shape === 'circle'
            ? { borderRadius: piece.size / 2 }
            : piece.shape === 'rectangle'
            ? { width: piece.size * 1.5, height: piece.size * 0.6 }
            : {};

        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.piece,
              {
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                left: piece.startX,
                top: piece.startY,
                opacity: piece.animOpacity,
                transform: [
                  { translateX: piece.animX },
                  { translateY: piece.animY },
                  { rotate: rotation },
                ],
              },
              shapeStyle,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  piece: {
    position: 'absolute',
  },
});

export default Confetti;
