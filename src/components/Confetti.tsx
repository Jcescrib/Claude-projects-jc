import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

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
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#95E1D3',
  '#F38181',
  '#AA96DA',
  '#FCBAD3',
  '#A8D8EA',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
];

export const Confetti: React.FC<ConfettiProps> = (props) => {
  const { visible, count = 50, duration = 2500, colors = DEFAULT_COLORS, onComplete } = props;

  const isVisible: boolean = visible === true;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const confettiPieces = useMemo(() => {
    const pieces: ConfettiPiece[] = [];
    const shapes: Array<'square' | 'circle' | 'rectangle'> = ['square', 'circle', 'rectangle'];

    for (let i = 0; i < count; i++) {
      pieces.push({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        startX: Math.random() * SCREEN_WIDTH,
        startY: -50,
        animX: new Animated.Value(0),
        animY: new Animated.Value(0),
        animRotate: new Animated.Value(0),
        animOpacity: new Animated.Value(1),
        size: 8 + Math.random() * 8,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    return pieces;
  }, [count, colors]);

  useEffect(() => {
    if (isVisible) {
      // Reset all animations
      for (let i = 0; i < confettiPieces.length; i++) {
        const piece = confettiPieces[i];
        piece.animX.setValue(0);
        piece.animY.setValue(0);
        piece.animRotate.setValue(0);
        piece.animOpacity.setValue(1);
      }

      // Start animations
      const animations: Animated.CompositeAnimation[] = [];

      for (let i = 0; i < confettiPieces.length; i++) {
        const piece = confettiPieces[i];
        const fallDistance = SCREEN_HEIGHT + 100;
        const swayAmount = (Math.random() - 0.5) * 200;
        const rotations = 2 + Math.random() * 4;
        const individualDuration = duration * (0.8 + Math.random() * 0.4);

        const animation = Animated.parallel([
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
          Animated.timing(piece.animY, {
            toValue: fallDistance,
            duration: individualDuration,
            useNativeDriver: true,
          }),
          Animated.timing(piece.animRotate, {
            toValue: rotations,
            duration: individualDuration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(individualDuration * 0.7),
            Animated.timing(piece.animOpacity, {
              toValue: 0,
              duration: individualDuration * 0.3,
              useNativeDriver: true,
            }),
          ]),
        ]);

        animations.push(animation);
      }

      animationRef.current = Animated.stagger(20, animations);
      animationRef.current.start(() => {
        if (onComplete) {
          onComplete();
        }
      });
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [isVisible, confettiPieces, duration, onComplete]);

  if (!isVisible) {
    return null;
  }

  const renderPiece = (piece: ConfettiPiece) => {
    const rotation = piece.animRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    let shapeStyle = {};
    if (piece.shape === 'circle') {
      shapeStyle = { borderRadius: piece.size / 2 };
    } else if (piece.shape === 'rectangle') {
      shapeStyle = { width: piece.size * 1.5, height: piece.size * 0.6 };
    }

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
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map(renderPiece)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  piece: {
    position: 'absolute',
  },
});

export default Confetti;
