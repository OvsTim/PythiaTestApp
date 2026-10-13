import {Platform} from 'react-native';

/** Mock server from the emulator / simulator host machine. */
export const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:4000'
    : 'http://localhost:4000';
