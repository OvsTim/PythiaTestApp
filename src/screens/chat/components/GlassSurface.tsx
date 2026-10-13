import {BlurView} from '@react-native-community/blur';
import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import type {PropsWithChildren} from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {colors} from '../../../assets/colors';

type GlassSurfaceProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  effect?: 'clear' | 'regular';
  tintColor?: ColorValue;
  fallbackColor?: string;
}>;

/** iOS 26+ liquid glass; otherwise BlurView + translucent overlay. */
export function GlassSurface({
  children,
  style,
  effect = 'clear',
  tintColor,
  fallbackColor = colors.glassFallback,
}: GlassSurfaceProps) {
  if (isLiquidGlassSupported) {
    return (
      <LiquidGlassView
        style={style}
        effect={effect}
        colorScheme="dark"
        tintColor={tintColor}>
        {children}
      </LiquidGlassView>
    );
  }

  return (
    <View style={[styles.fallback, style]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={Platform.OS === 'ios' ? 'chromeMaterialDark' : 'dark'}
        blurAmount={24}
        reducedTransparencyFallbackColor="#1F2021"
        overlayColor={
          Platform.OS === 'android' ? 'rgba(16, 16, 16, 0.45)' : undefined
        }
      />
      <View
        pointerEvents="none"
        style={[styles.overlay, {backgroundColor: fallbackColor}]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
});
