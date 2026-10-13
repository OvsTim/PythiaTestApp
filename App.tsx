/**
 * @format
 */

import {StatusBar, StyleSheet, View} from 'react-native';
import {Provider} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {store} from './src/api';
import {ChatScreen} from './src/screens/chat/ChatScreen';

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar barStyle="light-content" />
          <ChatScreen />
        </View>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
