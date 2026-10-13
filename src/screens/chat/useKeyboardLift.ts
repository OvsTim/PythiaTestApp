import {useEffect, useRef} from 'react';
import {Animated, Easing, Platform} from 'react-native';

import {useKeyboardHeight} from './useKeyboardHeight';

/** Extra gap above the IME on Android (edge-to-edge height sits flush otherwise). */
const ANDROID_KEYBOARD_GAP = 12;

/**
 * One keyboard clock for composer padding + palantir translate.
 * Padding cannot use the native driver; translateY can — two values, one timing.
 */
export function useKeyboardLift(safeBottom: number) {
  const {height: keyboardHeight, durationMs} = useKeyboardHeight();
  const palantirLift = useRef(new Animated.Value(0)).current;
  const composerPadding = useRef(
    new Animated.Value(Math.max(safeBottom, 8)),
  ).current;

  useEffect(() => {
    const liftTarget =
      keyboardHeight > 0
        ? keyboardHeight +
          (Platform.OS === 'android' ? ANDROID_KEYBOARD_GAP : 0)
        : 0;
    const composerTarget =
      liftTarget > 0 ? liftTarget : Math.max(safeBottom, 8);

    Animated.parallel([
      Animated.timing(palantirLift, {
        toValue: liftTarget,
        duration: durationMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(composerPadding, {
        toValue: composerTarget,
        duration: durationMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [composerPadding, durationMs, keyboardHeight, palantirLift, safeBottom]);

  return {palantirLift, composerPadding};
}
