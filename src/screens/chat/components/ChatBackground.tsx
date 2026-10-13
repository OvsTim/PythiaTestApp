import type {ReactNode} from 'react';
import {Animated, Image, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {colors} from '../../../assets/colors';

const bgTexture = require('../../../assets/images/bg.png');
const palantirImage = require('../../../assets/images/palantir.png');

const PALANTIR_SIZE = 345;
/** Figma 852-tall frame: palantir y=654 → 147px below the bottom edge. */
const PALANTIR_BOTTOM_OVERFLOW = 147;

type ChatBackgroundProps = {
  children: ReactNode;
  /** Driven by `useKeyboardLift` (native-driver translate). */
  palantirLift: Animated.Value;
};

export function ChatBackground({children, palantirLift}: ChatBackgroundProps) {
  const {colors: gradientColors, locations, start, end} = colors.backgroundLinear;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gradientColors]}
        locations={[...locations]}
        start={start}
        end={end}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={bgTexture}
        style={[StyleSheet.absoluteFill, styles.texture]}
        resizeMode="cover"
      />
      <Animated.View
        style={[
          styles.palantirSlot,
          {transform: [{translateY: Animated.multiply(palantirLift, -1)}]},
        ]}
        pointerEvents="none">
        <Image
          source={palantirImage}
          style={styles.palantir}
          resizeMode="cover"
        />
      </Animated.View>
      <LinearGradient
        colors={['#000000', '#000000', 'rgba(0,0,0,0.8)', 'transparent']}
        locations={[0, 0.33, 0.58, 1]}
        style={styles.topFade}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  texture: {
    opacity: 0.2,
  },
  palantirSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -PALANTIR_BOTTOM_OVERFLOW,
    alignItems: 'center',
  },
  palantir: {
    height: PALANTIR_SIZE,
    width: PALANTIR_SIZE,
    opacity: 0.5,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1,
  },
});
