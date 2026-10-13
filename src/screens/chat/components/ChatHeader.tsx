import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {colors} from '../../../assets/colors';
import {fonts} from '../../../assets/fonts';
import {Icon} from '../../../assets/icons';
import {GlassSurface} from './GlassSurface';

export const CHAT_HEADER_ROW_HEIGHT = 48;

type ChatHeaderProps = {
  paddingTop: number;
  style?: StyleProp<ViewStyle>;
};

export function ChatHeader({paddingTop, style}: ChatHeaderProps) {
  return (
    <View style={[styles.bar, {paddingTop}, style]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={styles.backHit}>
        <GlassSurface
          style={styles.backButton}
          tintColor={colors.glassTintLight}
          fallbackColor={colors.glassTintLight}>
          <Icon name="chevron-left" size={24} color={colors.text} />
        </GlassSurface>
      </Pressable>
      <View style={styles.titleSlot} pointerEvents="none">
        <GlassSurface
          style={styles.titlePill}
          tintColor={colors.glassTintDark}
          fallbackColor={colors.glassFallback}>
          <Text style={styles.title}>Chat</Text>
        </GlassSurface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: CHAT_HEADER_ROW_HEIGHT,
  },
  backHit: {
    zIndex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CHAT_HEADER_ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titlePill: {
    height: CHAT_HEADER_ROW_HEIGHT,
    width: 164,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  title: {
    fontFamily: fonts.playfairDisplay,
    fontSize: 18,
    lineHeight: 22.5,
    letterSpacing: -1.26,
    color: colors.text,
  },
});
