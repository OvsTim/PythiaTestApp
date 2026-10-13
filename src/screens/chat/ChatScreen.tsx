import {useCallback} from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {ChatListRow} from './chatListTypes';
import {ChatBackground} from './components/ChatBackground';
import {
  ChatHeader,
  CHAT_HEADER_ROW_HEIGHT,
} from './components/ChatHeader';
import {ChatListEmpty} from './components/ChatListEmpty';
import {ChatMessageItem} from './components/ChatMessageItem';
import {MessageInput} from './components/MessageInput';
import {useChatController} from './useChatController';
import {useKeyboardLift} from './useKeyboardLift';

function rowKey(row: ChatListRow): string {
  return row.key;
}

export function ChatScreen() {
  const insets = useSafeAreaInsets();
  const {palantirLift, composerPadding} = useKeyboardLift(insets.bottom);
  const {
    listRows,
    isHistoryLoading,
    isHistoryError,
    reloadHistory,
    draftText,
    setDraftText,
    canSend,
    isBusy,
    send,
    retry,
  } = useChatController();

  /** inverted FlatList: paddingBottom is the visual top (under the overlay header). */
  const listPaddingUnderHeader = insets.top + CHAT_HEADER_ROW_HEIGHT + 12;

  const renderRow: ListRenderItem<ChatListRow> = useCallback(
    ({item}) => (
      <ChatMessageItem row={item} onRetry={retry} isBusy={isBusy} />
    ),
    [isBusy, retry],
  );

  return (
    <ChatBackground palantirLift={palantirLift}>
      <View style={styles.root}>
        <View style={styles.body}>
          <FlatList
            style={styles.list}
            inverted
            data={listRows}
            extraData={isBusy}
            keyExtractor={rowKey}
            renderItem={renderRow}
            ListEmptyComponent={
              <ChatListEmpty
                isLoading={isHistoryLoading}
                isError={isHistoryError}
                onRetry={reloadHistory}
              />
            }
            contentContainerStyle={[
              styles.listContent,
              {paddingBottom: listPaddingUnderHeader},
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          />
          <ChatHeader paddingTop={insets.top} style={styles.headerOverlay} />
        </View>
        <Animated.View style={{paddingBottom: composerPadding}}>
          <MessageInput
            value={draftText}
            onChangeText={setDraftText}
            canSend={canSend}
            onSend={send}
          />
        </Animated.View>
      </View>
    </ChatBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 16,
  },
});
