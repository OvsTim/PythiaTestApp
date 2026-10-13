import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';

import {colors} from '../../../assets/colors';
import {fonts} from '../../../assets/fonts';

type ChatListEmptyProps = {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

/** Empty / error UI for inverted FlatList (scaleY undoes the list flip). */
export function ChatListEmpty({
  isLoading,
  isError,
  onRetry,
}: ChatListEmptyProps) {
  if (isLoading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={colors.text} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.root}>
        <Text style={styles.errorText}>Couldn’t load messages</Text>
        <Pressable onPress={onRetry} accessibilityRole="button">
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
    minHeight: 200,
    transform: [{scaleY: -1}],
  },
  errorText: {
    fontFamily: fonts.ibmPlexMono,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.56,
    color: colors.text70,
    textAlign: 'center',
  },
  retryText: {
    fontFamily: fonts.ibmPlexMonoSemiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.56,
    color: colors.text,
  },
});
