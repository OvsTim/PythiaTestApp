import {StyleSheet, Text, View} from 'react-native';

import type {Sign, SignKind} from '../../../api';
import {colors} from '../../../assets/colors';
import {fonts} from '../../../assets/fonts';

const SIGN_GLYPH: Record<SignKind, string> = {
  sun: '☉',
  moon: '☾',
  rising: '↑',
};

const SIGN_LABEL: Record<SignKind, string> = {
  sun: 'SUN SIGN',
  moon: 'MOON SIGN',
  rising: 'RISING SIGN',
};

type HoroscopeCardProps = {
  sign: Sign;
};

export function HoroscopeCard({sign}: HoroscopeCardProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.glyph}>{SIGN_GLYPH[sign.kind]}</Text>
      <View style={styles.copy}>
        <Text style={styles.title}>
          <Text style={styles.titleMuted}>{SIGN_LABEL[sign.kind]}</Text>
          {` - ${sign.sign.toUpperCase()}`}
        </Text>
        <Text style={styles.caption}>{sign.caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  glyph: {
    width: 10,
    fontFamily: fonts.ibmPlexMono,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.64,
    color: colors.text,
    opacity: 0.7,
    textAlign: 'center',
  },
  copy: {
    gap: 1,
  },
  title: {
    fontFamily: fonts.playfairDisplay,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -1.12,
    color: colors.text,
  },
  titleMuted: {
    color: colors.textUnactive,
  },
  caption: {
    fontFamily: fonts.ibmPlexMono,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: -1.04,
    color: colors.text70,
  },
});
