import React from 'react';
import { NativeModules, Platform } from 'react-native';
import { AppRegistry, StatusBar, Text } from 'react-native';
import App from './src/App';
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

// Initialise Sentry:
if (!__DEV__ || ErrorService.LogOnDevelopment) {
  // see https://docs.sentry.io/clients/javascript/config/
  Sentry.init({
    dsn: 'https://fae343888dda429483541c539c3cb856@sentry.io/1240637',
    environment: Config.BUILD
  });
}

// Screen Entry point:
AppRegistry.registerComponent('ccf', () => App);
