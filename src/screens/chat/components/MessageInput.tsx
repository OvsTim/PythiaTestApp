import {Pressable, StyleSheet, TextInput, View} from 'react-native';

import {MESSAGE_TEXT_MAX_LENGTH} from '../../../api';
import {colors} from '../../../assets/colors';
import {fonts} from '../../../assets/fonts';
import {Icon} from '../../../assets/icons';
import {GlassSurface} from './GlassSurface';

type MessageInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  canSend: boolean;
  onSend: () => void;
};

export function MessageInput({
  value,
  onChangeText,
  canSend,
  onSend,
}: MessageInputProps) {
  return (
    <View style={styles.wrap}>
      <GlassSurface
        style={styles.surface}
        tintColor={colors.glassTintDark}
        fallbackColor={colors.glassFallback}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Ask the stars..."
          placeholderTextColor={colors.textUnactive}
          multiline
          maxLength={MESSAGE_TEXT_MAX_LENGTH}
          style={styles.field}
          cursorColor={colors.text}
          selectionColor={colors.text70}
        />
        <View style={styles.buttons}>
          <Icon name="menu" size={24} color={colors.text} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={!canSend}
            onPress={onSend}
            style={[
              styles.send,
              {backgroundColor: canSend ? colors.accent : colors.sendIdle},
            ]}>
            <Icon
              name="arrow-up"
              size={24}
              color={canSend ? colors.background : colors.text}
            />
          </Pressable>
        </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  surface: {
    borderRadius: 26,
    paddingTop: 20,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 20,
    gap: 6,
    minHeight: 100,
  },
  field: {
    fontFamily: fonts.ibmPlexMono,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.64,
    color: colors.text,
    padding: 0,
    maxHeight: 96,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
