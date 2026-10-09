const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Firebase's generated browser wrappers currently reference files absent from
// the npm package. Redirect only those public wrappers to the matching official
// implementation packages so all Firebase services share one app registry.
const firebaseEntrypoints = new Map([
  ['firebase/app', '@firebase/app'],
  ['firebase/auth', '@firebase/auth'],
  ['firebase/firestore', '@firebase/firestore'],
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const entrypoint = firebaseEntrypoints.get(moduleName);
  return context.resolveRequest(context, entrypoint ?? moduleName, platform);
};

module.exports = config;
