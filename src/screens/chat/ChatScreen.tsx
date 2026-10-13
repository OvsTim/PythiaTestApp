import {
  Animated,
  FlatList,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {Message} from '../../api';
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

function messageKey(message: Message): string {
  return message.id;
}

const renderMessage: ListRenderItem<Message> = ({item}) => (
  <ChatMessageItem message={item} />
);

export function ChatScreen() {
  const insets = useSafeAreaInsets();
  const {palantirLift, composerPadding} = useKeyboardLift(insets.bottom);
  const {
    listMessages,
    isLoading,
    isError,
    refetch,
    draftText,
    setDraftText,
    canSend,
  } = useChatController();

  /** inverted FlatList: paddingBottom is the visual top (under the overlay header). */
  const listPaddingUnderHeader = insets.top + CHAT_HEADER_ROW_HEIGHT + 12;

  return (
    <ChatBackground palantirLift={palantirLift}>
      <View style={styles.root}>
        <View style={styles.body}>
          <FlatList
            style={styles.list}
            inverted
            data={listMessages}
            keyExtractor={messageKey}
            renderItem={renderMessage}
            ListEmptyComponent={
              <ChatListEmpty
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
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
