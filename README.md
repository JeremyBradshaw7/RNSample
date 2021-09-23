Jeremy Bradshaw:

This is some sample React Native code from our main repository, just enough to give some insights into my coding style, but not enough to expose any company IP. The package.json shows what packages I've been using - basically we make heavy use of Redux for 
application state (though lately I've been making more use of context and react-native-query where previosuly I'd have resorted
to Redux), and react-navigation for routing. Some of the older components and screens are class-based, but all new 
components I write are functional components with hooks.

# ccf

## Overview

This is the mobile app for the Coach Competencies Framework.

## Environment set up

Development Pre-requisites, see https://facebook.github.io/react-native/docs/getting-started.html:
- ssh key on your mac linked to github account
- homebrew : `/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)`
- node : `brew install node` or via http://nodejs.org/
- watchman : `brew install watchman`
- yarn : `brew install yarn`
- cocoapods : `gem install cocoapods` (OS X ships with a version of Ruby installed by default, but may require `sudo` to install gems)
NB. If you previously installed a global react-native-cli package, please remove it as it may cause unexpected issues (`npm uninstall -g react-native-cli --save`). This is no longer required, but if you want to run a react Native CLI command you now have to prefix it with `yarn` or `npx` (eg. `npx react-native -v`).

Deprecated instructions:
- if you get EACCES permission denied errors, run `sudo chown -R $USER ~/.npm` and `sudo chown -R $USER /usr/local/lib/node_modules` then retry
- JDK - http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html

Also recommended:
- Visual Studio Code (recommended IDE, with ESLint and React Native Tools extensions) - https://code.visualstudio.com/ or WebStorm (ask Paul for setup details)
- Xcode (via app store) - follow instructions here (https://facebook.github.io/react-native/docs/getting-started.html) for Building Projects with Native Code + Development OS macOS + Target OS iOS (including adding command line tools). 
- Android Studio - https://developer.android.com/studio/index.html - follow instructions here (https://facebook.github.io/react-native/docs/getting-started.html) for Building Projects with Native Code + Development OS macOS + Target OS Android, including adding this to .bash_profile:
```
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```
- Also (after MacOS Big Sur) you will have to set a JAVA_HOME variable and set that in the PATH via .bash_profile, eg:
```
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk1.8.0_271.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"
```
(to get your java home path, run command `/usr/libexec/java_home -V | grep jdk`)
- It is recommended to create an emulator for Nexus 6P on Marshmallow (API 23).

## Developing against device or emulator

Clone this repository, cd into the folder, and install the development pre-requisites:
`yarn`

The first time after cloning the repo you'll also need to run these commands:
- `cp -rf firebase_config/test/google-services.json android/app`
- `cp -rf firebase_config/test/GoogleService-Info.plist ios`
- `./cleanbuild.sh`

You can pre-start an emulator via xcode or android studio. If no emulator is running then the default ios simulator will be automatically started. An Android simulator can also be pre-started without android studio via the command `npm run emu` (assuming a Nexus_6P_API_23 avd is created), or `npm run emu2` for an android tablet (Nexus_10_API_27).
  
To run on iOS:
- `npm run ios` - to run against default iphone simulator
- `npm run ipad` - to run on 'iPad Pro (12.9-inch)' simulator
- `npm run iphone` - to run on physical ios device attached via cable

To run on Android:
- `npm run android` - to run a development build
- `npm run android-prod` - to run a production build

To run on Android against local VLE:
- Start the emulator using a -writable-system option eg. `npm run emu-writable`
- Copy the local hosts file to the emulator `adb push /etc/hosts /etc/hosts`

To run on physical devices attached via cable, see the additional instructions here: https://facebook.github.io/react-native/docs/running-on-device.html

### Debugging

You can debug using Chrome dev tools, using console logs or setting breakpoints in the mapped typescript code (typescript is now transpiled implicity). However because code is executed in Chrome’s V8 engine instead of a platform-specific engine such as JSC or Hermes, stepping through code can be problematic.

Visual Studio Code also has the ability to auto-start the packager and debug against an instance running on an emulator or a device, which allows breakpoints to be set in the IDE code. 

You can alternatively start an instance of `react-native-debugger` via `npm run debug` if installed (see https://github.com/jhen0409/react-native-debugger for installation instructions) - this provides React Native and Redux specific debug information in addition to Chrome dev tools (right-click on left panel and choose "Enable Network Inspect" to see API calls on the Network tab).

From React Native 0.62 you can alternatively use Flipper for debugging : https://fbflipper.com/
- though it increases build time so I have disabled it in the Podfile and commented out elsewhere

## Production builds

Pre-requisites:
- Android: put innoved-ccf.keystore in ./android/app folder (in Google Drive under AppCerts - log in as innovedlearningdevelopment@gmail.com - get password from Jeremy/Jon/Paul)
- iOS: (1) have Apple ID added to Dev Team via App Store Connect, and add to Xcode via Prefs > Accounts, (2) log in and download the iOS distribution certificate from https://developer.apple.com/account/#/overview/F734334FS3 and add to keychain (.cer file also (in Google Drive under AppCerts, though this will need refreshing anually), (3) add the private key to the keychain as well via a .p12 file (in Google Drive under AppCerts, access with same password as for Google Drive)

Note: Before running the ios script you should apply the standard changes required for production releases as
documented in https://facebook.github.io/react-native/docs/running-on-device#building-your-app-for-production
Once done once you can keep these changes in a local stash and reapply them before any subsequent iOS build.

Signed production builds (for release to TestFairy) are via these scripts:
- `./build-ios.sh t`
- `./build-android.sh t`
Modify the TestFairy distribution list as appropriate by editing the 2nd parameter to the testfairy-upload.sh call (`devtest` will only distribute to developers, use `beta_ios` and `beta_android` to distribute to all internal beta users for ios and android respectievly).

For release to the App and Google Play stores we run the scripts with a `p` flag:
- `./build-ios.sh p`
- `./build-android.sh p`
The latter creates an `.aab` (Android App Bundle) file rather than the usual `.apk` file.

There will be a separate wiki page for advice on how to do App/Play store submissions.

The version & build number are defined in `./ios/ccf/Info.plist` for iOS and in `./android/app/build.gradle` for Android, but these refer to a common `.env` environment file in the root folder:
```
VARIANT=CCF
APP_VERSION=1.0.5.2
APP_BUILD=307
BUILD=Development
```
There is a separate `.env.test` file for Test (Beta) builds, and a `.env.prod` file for Production builds (version and build numbers only have to be updated prior to releases to the stores).

The version string will be of the form M.m.p.d:
- M: major version number, only increment on major release
- m: minor version number, increment on every app/play store release
- p: patch version number, increment on patch releases to app/play store, or might release OTA via CodePush
- d: development/test version, increment on test releases to testfairy, can be supplemened with letter, eg 2a

The numeric version number should be incremented every time any of the above are incremented. We also maintain build comments (picked up by the build scripts to put in the build emails) in a `build_comments.txt` file in the root folder, which can be updated prior to a test build (to let testers know what changes are in the build).

## Generating an icon & splash screen

This only has to be done again if we want to change the logo. 

Using https://github.com/bamlab/react-native-make and https://github.com/crazycodeboy/react-native-splash-screen

```
npx react-native set-splash --path splash.png --resize cover
npx react-native set-icon --path icon-beta-1024.png
```

Note, use the -beta image for generating new images for the beta (dev) version, for production builds in the `master` branch use:

```
npx react-native set-icon --path icon-1024.png
```

The tool does not generate adaptive round icons or notification icons used in later Android versions, so to fill the gaps we have to use the new image asset functionality in Android Studio:
- right click on res folder and then New > Image Asset
- under the foreground path select the appropriate icon png file from the ccf root (icon-beta-1024.png or icon-1024.png),
- play with the Trim, Resize, & Background (white) options until they all look OK,
- hit Next then Finish,
- in git undo the files that are already the correct icon, but keep any new/changed icons.