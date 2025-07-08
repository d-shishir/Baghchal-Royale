const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom asset extensions to the default configuration.
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj');

module.exports = config; 