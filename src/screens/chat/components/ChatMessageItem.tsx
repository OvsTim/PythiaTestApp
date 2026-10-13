import {Image, Pressable, StyleSheet, Text, View} from 'react-native';

import {colors} from '../../../assets/colors';
import {fonts} from '../../../assets/fonts';
import {Icon} from '../../../assets/icons';
import type {ChatListRow} from '../chatListTypes';
import {AssistantIntro} from './AssistantIntro';

const mascotImage = require('../../../assets/images/mascot.png');

type ChatMessageItemProps = {
  row: ChatListRow;
  onRetry: (clientMessageId: string) => void;
  retryDisabled: boolean;
};

export function ChatMessageItem({
  row,
  onRetry,
  retryDisabled,
}: ChatMessageItemProps) {
  switch (row.kind) {
    case 'intro':
      return <AssistantIntro message={row.message} />;

    case 'thinking':
      return (
        <View style={styles.thinkingRow}>
          <Image source={mascotImage} style={styles.mascot} />
          <Text style={styles.thinkingText}>Pythia is thinking...</Text>
        </View>
      );

    case 'assistant':
      return (
        <View style={styles.assistantRow}>
          <Text style={styles.assistantText}>{row.text}</Text>
          <Image source={mascotImage} style={styles.mascot} />
        </View>
      );

    case 'user':
      return (
        <View style={styles.userBlock}>
          <View style={styles.userRow}>
            <View style={styles.userBubble}>
              <Text style={styles.userText}>{row.text}</Text>
            </View>
          </View>
          {row.delivery === 'failed' ? (
            <View style={styles.failureRow}>
              <Text style={styles.failureLabel}>Not sent</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retry"
                disabled={retryDisabled}
                onPress={() => onRetry(row.clientMessageId)}
                style={[styles.retryHit, retryDisabled && styles.retryDisabled]}
                hitSlop={8}>
                <Icon name="restart" size={24} color={colors.notSent} />
                <Text style={styles.retryLabel}>Retry</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  userBlock: {
    gap: 14,
    paddingVertical: 6,
  },
  userRow: {
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '78%',
    backgroundColor: colors.lightAccent,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  userText: {
    fontFamily: fonts.ibmPlexMono,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.56,
    color: colors.text,
  },
  failureRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  failureLabel: {
    fontFamily: fonts.ibmPlexMono,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.56,
    color: colors.notSent,
  },
  retryHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  retryDisabled: {
    opacity: 0.4,
  },
  retryLabel: {
    fontFamily: fonts.ibmPlexMonoSemiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.56,
    color: colors.notSent,
  },
  thinkingRow: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontFamily: fonts.ibmPlexMono,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.56,
    color: colors.text70,
    flexShrink: 1,
  },
  assistantRow: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 12,
  },
  assistantText: {
    fontFamily: fonts.ibmPlexMono,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.56,
    color: colors.text,
  },
  mascot: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
