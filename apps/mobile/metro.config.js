// Metro beallitas: az expo-sqlite webes valtozatahoz (csak a bongeszos
// ellenorzeshez kell, a telefonos dev clientet nem erinti).
const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// a webes SQLite egy .wasm fajl, ezt is be kell csomagolni
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// a webes SQLite-nak SharedArrayBuffer kell, ahhoz ez a ket fejlec
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, metroServer) => {
  const enhanced = enhanceMiddleware ? enhanceMiddleware(middleware, metroServer) : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return enhanced(req, res, next);
  };
};

module.exports = config;
