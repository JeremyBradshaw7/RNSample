// intercept logging, otherwise redux logger output can get in the way. Can't I just turn redux logger off?
// console.log = function() {}
// This also works, while also allowing console.log statements in my tests to show up (but not my logger calls as that checks __DEV__):
global.__DEV__ = false;
// global.FormData = require('FormData');

// jest.mock('Linking', () => {
//   return {
//     addEventListener: jest.fn(),
//     removeEventListener: jest.fn(),
//     openURL: jest.fn(),
//     canOpenURL: jest.fn(),
//     getInitialURL: jest.fn(),
//   }
// });

jest.mock('react-native-reanimated', () => {
  return {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    openURL: jest.fn(),
    canOpenURL: jest.fn(),
    getInitialURL: jest.fn(),
  }
});

jest.mock('react-native-device-info', () => {
  return {
    getModel: jest.fn(),
    isTablet: jest.fn(),
  };
});

jest.mock('@react-native-firebase/analytics', () => {
  return {
    logEvent: jest.fn(),
    setUserId: jest.fn(),
    setUserProperties: jest.fn(),
    setCurrentScreen: jest.fn()
  };
});

// jest.mock('NetInfo', () => {
//   return {
//     isConnected: {
//       fetch: () => {
//         return new Promise((accept, resolve) => {
//           accept(true);
//         })
//       }
//     }
//   }
// });

jest.mock('react-native-fs', () => {
  return {
    mkdir: jest.fn(),
    moveFile: jest.fn(),
    copyFile: jest.fn(),
    pathForBundle: jest.fn(),
    pathForGroup: jest.fn(),
    getFSInfo: jest.fn(),
    getAllExternalFilesDirs: jest.fn(),
    unlink: jest.fn(),
    exists: jest.fn(),
    stopDownload: jest.fn(),
    resumeDownload: jest.fn(),
    isResumable: jest.fn(),
    stopUpload: jest.fn(),
    completeHandlerIOS: jest.fn(),
    readDir: jest.fn(),
    readDirAssets: jest.fn(),
    existsAssets: jest.fn(),
    readdir: jest.fn(),
    setReadable: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    read: jest.fn(),
    readFileAssets: jest.fn(),
    hash: jest.fn(),
    copyFileAssets: jest.fn(),
    copyFileAssetsIOS: jest.fn(),
    copyAssetsVideoIOS: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn(),
    write: jest.fn(),
    downloadFile: jest.fn(),
    uploadFiles: jest.fn(),
    touch: jest.fn(),
    MainBundlePath: jest.fn(),
    CachesDirectoryPath: jest.fn(),
    DocumentDirectoryPath: jest.fn(),
    ExternalDirectoryPath: jest.fn(),
    ExternalStorageDirectoryPath: jest.fn(),
    TemporaryDirectoryPath: jest.fn(),
    LibraryDirectoryPath: jest.fn(),
    PicturesDirectoryPath: jest.fn(),
  };
});

jest.mock('react-native-orientation-locker', () => {
  return {
    unlockAllOrientations: jest.fn(),
    lockToPortrait: jest.fn(),
    lockToLandscape: jest.fn()
  }
});

jest.mock('react-native-voice', () => {
  return {
    fn: jest.fn()
  }
});

// jest.mock('redux-logger', () => {
//   return {
//     fn: jest.fn()
//   }
// });
