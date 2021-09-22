import 'react-native-gesture-handler'; // https://github.com/kmagiera/react-native-gesture-handler/issues/320
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, UIManager, Platform, Alert } from 'react-native';
import { Root } from 'native-base';
import PrimaryNav from './screens/PrimaryNav';
import { Provider } from 'react-redux';
import ReduxThunk from 'redux-thunk';
import logger from 'redux-logger';
import { createStore, applyMiddleware } from 'redux';
import { persistStore } from 'redux-persist';
// eslint-disable-next-line import/no-internal-modules
import { PersistGate } from 'redux-persist/lib/integration/react';
import persistedReducer from './appstate';
import authMiddleware from './appstate/auth/authMiddleware';
import EStyleSheet from 'react-native-extended-stylesheet';
import { InToast } from './components/InToast';
import ScreenInfo from './services/ScreenInfo';
import KB from './services/KB';
import Help from './components/Help';
import Util from 'services/Util';
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
import ErrorService from 'services/Error';
import SplashScreen from 'react-native-splash-screen';
import { QueryClient, QueryClientProvider } from 'react-query';

EStyleSheet.build(); // always call EStyleSheet.build() even if you don't use global variables!

const middleware = [
  authMiddleware,
  ReduxThunk,
  ...(__DEV__ ? [logger] : [])
].filter(Boolean);

// create application state (store) with combined reducers, arg2 is any initial state, arg3 is for store ehnancers:
export const store = createStore(persistedReducer, applyMiddleware(...middleware));
export const persistor = persistStore(store);

export const queryClient = new QueryClient();

// CAPTURE UNHANDLED JS EVENTS TO PREVENT APP CRASH AND LOG ISSUE IN SENTRY
const errorHandler = (e, isFatal) => {
  ErrorService.logError('Unhandled JS Exception', e, {}, { name: e?.name || '', isFatal });
  if (!!isFatal) {
    SplashScreen.hide();
    if (!!e) {
      Util.OK('Unexpected Error', `${!!isFatal ? 'Fatal ' : ''} ${e?.name || ''} ${e?.message || ''}

This issue has been logged. We recommend that you close the app and restart it.`);
    } else {
      Util.OK('Unexpected Error', `${!!isFatal ? 'Fatal ' : ''} (Unknown)

This issue has been logged. We recommend that you close the app and restart it.`);
    }
  } else {
    console.log(e); // So that we can see it in the ADB logs in case of Android if needed
  }
};
setJSExceptionHandler(errorHandler, false);
setNativeExceptionHandler((errorString) => {
  ErrorService.trackEvent('Native Exception', { error: errorString });
});

interface Props { }
interface State { }

class App extends React.Component<Props, State> {

  constructor(props) {
    super(props);
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  componentDidMount() {
    ScreenInfo.applyOrientationLock();
    KB.DisableManager(); // disable until we want it, can remove when all screens use it
  }

  render() {
    // wrap base element with Redux Provider, and PersistGate for redux-persist. Root is for native-base Toast service.
    return (
      <Provider store={store}>
        <PersistGate loading={<View />} persistor={persistor}>
          <NavigationContainer>
            <Root>
              <QueryClientProvider client={queryClient}>
                <PrimaryNav />
                <Help />
                <InToast id='app' />
              </QueryClientProvider>
            </Root>
          </NavigationContainer>
        </PersistGate>
      </Provider>
    );
  }
}

export default App;