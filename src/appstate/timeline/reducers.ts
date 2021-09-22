// Timeline reducers

import { ITimelineState } from './models';
import dotProp from 'dot-prop-immutable';
import _ from 'lodash';
import { logger } from 'services/logger';
import Util from 'services/Util';

export const INITIAL_STATE: ITimelineState = {
  events: [],
  preferences: {
    homeScreen: false
  }
};

export default (state: ITimelineState = INITIAL_STATE, action): ITimelineState => {
  switch (action.type) {

    case 'TIMELINE_EVENTS_FETCH_SUCCESS':
      if (action.page === 1) {
        state = dotProp.set(state, 'events', action.events);
      } else {
        state = dotProp.merge(state, 'events', action.events);
      }
      return state;

    case 'TIMELINE_EVENTS_FETCH_FAIL':
      return { ...state, events: [] };

    case 'TIMELINE_PREFS_HOMESCREEN':
      return { ...state, preferences: { ...state.preferences, homeScreen: action.showAsHomeScreen } };

    case 'AUTH_SWITCH_ACCOUNT':
      return { ...state, ...INITIAL_STATE }; // clear cache on switching account

    case 'AUTH_LOGOUT': // clear events on logout
      return { ...state, events: [] };

    default:
      return state;
  }
};
