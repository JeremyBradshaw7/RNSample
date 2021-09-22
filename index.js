import 'react-native-gesture-handler'; // https://github.com/kmagiera/react-native-gesture-handler/issues/320
import React from 'react';
import { NativeModules, Platform } from 'react-native';
import { AppRegistry, StatusBar, Text } from 'react-native';
import App from './src/App';
import { LogBox } from 'react-native';
import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';
import { commonStyles } from 'styles/common';
import ErrorService from './src/services/Error';

// fix for https://github.com/kmagiera/react-native-gesture-handler/issues/320
if (Platform.OS === 'android') {
  const { UIManager } = NativeModules;
  if (UIManager) {
    // Add gesture specific events to genericDirectEventTypes object exported from UIManager native module.
    // Once new event types are registered with react it is possible to dispatch these events to all kind of native views.
    UIManager.genericDirectEventTypes = {
      ...UIManager.genericDirectEventTypes,
      onGestureHandlerEvent: { registrationName: 'onGestureHandlerEvent' },
      onGestureHandlerStateChange: {
        registrationName: 'onGestureHandlerStateChange',
      },
    };
  }
}

// disable font scaling, can throw off our screen designs:
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
// Text.defaultProps.style = { fontFamily: 'Roboto' };

// Typography: set default font family (setting via Text.defaultProps.style doesnt seem to work)
// see https://ospfolio.com/two-way-to-change-default-font-family-in-react-native/#how-do-i-set-default-font-family-as-global-in-react-native-project
const oldTextRender = Text.render
Text.render = function (...args) {
  const origin = oldTextRender.call(this, ...args)
  return React.cloneElement(origin, {
    style: [ commonStyles.defaultFontStyle, origin.props.style]
  })
}

// assuming we use a dark header, we re-evaluate this after setting branding
StatusBar.setBarStyle('light-content', true);

// TODO: fix for https://github.com/react-navigation/react-navigation/issues/3956 - find proper solution
if (__DEV__) {
  LogBox.ignoreLogs([
    'Warning:',
    'Module RCTImageLoader',
    'Module RCTVideoManager',
    'Remote debugger is in a background tab',
    'RCTAppState',
    'Required dispatch_sync',
    'RCTBridge required',
    'RCTDevLoadingView',
    'Sending `orientationDidChange` with no listeners registered',
    'Class RCTCxxModule was not',
    'Module RNDocumentPicker requires main queue setup',
    'Did not receive response to shouldStartLoad',
    'startLoadWithResult invoked with invalid lockIdentifier',
    'Native TextInput',
    'Warning: This synthetic event',
    'You should only render one navigator',
    'UIWebView is deprecated',
    'Setting a timer',
    'VirtualizedLists should never be nested',
    'Animated: `useNativeDriver`',
    'ReactNativeFiberHostComponent',
    'currentlyFocusedField is deprecated',
    'Non-serializable values were found in the navigation state.',
    'Animated.event now requires a second argument for options',
    'Expected style',
    'Can\'t open url: tableau'
  ]);
}

if (!__DEV__ || ErrorService.LogOnDevelopment) {
  // see https://docs.sentry.io/clients/javascript/config/
  Sentry.init({
    dsn: 'https://fae343888dda429483541c539c3cb856@sentry.io/1240637',
    environment: Config.BUILD
    // beforeSend(event) {
    //   // Modify the event here
    //   return event;
    // }
  });
}


// See https://github.com/facebook/react-native/issues/934
// if (__DEV__) {
//   GLOBAL.XMLHttpRequest = GLOBAL.originalXMLHttpRequest || GLOBAL.XMLHttpRequest;
// }

AppRegistry.registerComponent('ccf', () => App);
