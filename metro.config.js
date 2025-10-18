const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Reduce worker processes to prevent memory exhaustion
config.maxWorkers = 2;

module.exports = withNativeWind(config, { input: './global.css' });

