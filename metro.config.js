const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {withNanoIcons} = require('react-native-nano-icons/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = mergeConfig(getDefaultConfig(__dirname), {});

module.exports = withNanoIcons(config);
