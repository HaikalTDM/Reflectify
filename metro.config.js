/**
 * Metro configuration for React Native
 * Optimized for production builds with NativeWind integration
 * https://reactnative.dev/docs/metro
 */

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Enable minification and tree shaking
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      toplevel: true,
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: false,
    toplevel: false,
    warnings: false,
    ecma: 2017,
    compress: {
      drop_console: process.env.NODE_ENV === 'production', // Remove console.logs in production
      dead_code: true,
      unused: true,
      warnings: false,
    },
  },
};

// Optimize asset resolution
config.resolver = {
  ...config.resolver,
  assetExts: [
    ...config.resolver.assetExts,
    'mp3',
    'svg',
  ],
  sourceExts: [
    ...config.resolver.sourceExts,
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
  ],
};

// Wrap config with NativeWind for Tailwind processing
module.exports = withNativeWind(config, { input: './global.css' });
