watchman watch-del-all
rm -rf node_modules
rm -rf ios/build
rm -rf build
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/npm-*
rm -rf /tmp/metro-*
rm -rf /tmp/haste-map-react-native-packager-*
rm -rf ios/Pods
rm -rf ios/Podfile.lock
yarn
npm run pod
npx jetifier
