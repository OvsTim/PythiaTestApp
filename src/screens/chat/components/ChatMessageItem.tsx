import {memo} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';

import {colors} from '../../../assets/colors';
import {fonts} from '../../../assets/fonts';
import {Icon} from '../../../assets/icons';
import type {ChatListRow} from '../chatListTypes';
import {AssistantIntro} from './AssistantIntro';

const mascotImage = require('../../../assets/images/mascot.png');

type RetryHandler = (clientMessageId: string, text: string) => void;

type ChatMessageItemProps = {
  row: ChatListRow;
  onRetry: RetryHandler;
  isBusy: boolean;
};

/**
 * Row objects are rebuilt on every list change, so the memoized leaves below
 * take primitives and skip re-rendering rows whose content did not change.
 */
export function ChatMessageItem({row, onRetry, isBusy}: ChatMessageItemProps) {
  switch (row.kind) {
    case 'intro':
      return <AssistantIntro message={row.message} />;
    case 'thinking':
      return <ThinkingRow />;
    case 'assistant':
      return <AssistantMessage text={row.text} />;
    case 'user':
      return row.delivery === 'failed' ? (
        <FailedUserMessage
          clientMessageId={row.clientMessageId}
          text={row.text}
          onRetry={onRetry}
          retryDisabled={isBusy}
        />
      ) : (
        <UserMessage text={row.text} />
      );
  }
}

function ThinkingRowView() {
  return (
    <View style={styles.thinkingRow}>
      <Image source={mascotImage} style={styles.mascot} />
      <Text style={styles.thinkingText}>Pythia is thinking...</Text>
    </View>
  );
}
const ThinkingRow = memo(ThinkingRowView);

function AssistantMessageView({text}: {text: string}) {
  return (
    <View style={styles.assistantRow}>
      <Text style={styles.assistantText}>{text}</Text>
      <Image source={mascotImage} style={styles.mascot} />
    </View>
  );
}
const AssistantMessage = memo(AssistantMessageView);

function UserBubble({text}: {text: string}) {
  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{text}</Text>
      </View>
    </View>
  );
}

function UserMessageView({text}: {text: string}) {
  return (
    <View style={styles.userBlock}>
      <UserBubble text={text} />
    </View>
  );
}
const UserMessage = memo(UserMessageView);

type FailedUserMessageProps = {
  clientMessageId: string;
  text: string;
  onRetry: RetryHandler;
  retryDisabled: boolean;
};

function FailedUserMessageView({
  clientMessageId,
  text,
  onRetry,
  retryDisabled,
}: FailedUserMessageProps) {
  return (
    <View style={styles.userBlock}>
      <UserBubble text={text} />
      <View style={styles.failureRow}>
        <Text style={styles.failureLabel}>Not sent</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry"
          disabled={retryDisabled}
          onPress={() => onRetry(clientMessageId, text)}
          style={[styles.retryHit, retryDisabled && styles.retryDisabled]}
          hitSlop={8}>
          <Icon name="restart" size={24} color={colors.notSent} />
          <Text style={styles.retryLabel}>Retry</Text>
        </Pressable>
      </View>
    </View>
  );
}
const FailedUserMessage = memo(FailedUserMessageView);

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
