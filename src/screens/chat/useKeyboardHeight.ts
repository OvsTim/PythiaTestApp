import {useEffect, useState} from 'react';
import {Keyboard, Platform} from 'react-native';

const DEFAULT_DURATION_MS = Platform.OS === 'ios' ? 250 : 180;

export type KeyboardMetrics = {
  height: number;
  /** Keyboard animation duration from the platform event when available. */
  durationMs: number;
};

/**
 * Tracks IME height on both platforms.
 * Android edge-to-edge ignores `adjustResize`; iOS uses this for palantir lift too.
 */
export function useKeyboardHeight(): KeyboardMetrics {
  const [metrics, setMetrics] = useState<KeyboardMetrics>({
    height: 0,
    durationMs: DEFAULT_DURATION_MS,
  });

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, event => {
      setMetrics({
        height: event.endCoordinates.height,
        durationMs: event.duration > 0 ? event.duration : DEFAULT_DURATION_MS,
      });
    });
    const hideSubscription = Keyboard.addListener(hideEvent, event => {
      setMetrics({
        height: 0,
        durationMs: event.duration > 0 ? event.duration : DEFAULT_DURATION_MS,
      });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return metrics;
}
