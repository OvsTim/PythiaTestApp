import {StyleSheet, Text, View} from 'react-native';

import type {Message} from '../../../api';
import {colors} from '../../../assets/colors';
import {fonts} from '../../../assets/fonts';
import {AssistantIntro} from './AssistantIntro';

type ChatMessageItemProps = {
  message: Message;
};

export function ChatMessageItem({message}: ChatMessageItemProps) {
  if ((message.signs?.length ?? 0) > 0) {
    return <AssistantIntro message={message} />;
  }

  if (message.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      <Text style={styles.assistantText}>{message.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
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
  assistantRow: {
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  assistantText: {
    fontFamily: fonts.ibmPlexMono,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.56,
    color: colors.text,
  },
});
