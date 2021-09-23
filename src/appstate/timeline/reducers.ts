// Timeline reducers

import { ITimelineState } from './models';
import dotProp from 'dot-prop-immutable';
import _ from 'lodash';

/**
 * Initial timeline state
 */
export const INITIAL_STATE: ITimelineState = {
  events: [],
  preferences: {
    homeScreen: false
  }
};

/**
 * Timeline State Reducers
 *
 * @param   {ITimelineState}  state          Initial state
 * @param   {[type]}          action         Dispatched Redux action
 * @return  {ITimelineState}                 New state
 */
 export default (state: ITimelineState = INITIAL_STATE, action): ITimelineState => {
  switch (action.type) {

    /**
     * Timeline Events Fetched
     */
    case 'TIMELINE_EVENTS_FETCH_SUCCESS':
      if (action.page === 1) {
        state = dotProp.set(state, 'events', action.events);
      } else {
        state = dotProp.merge(state, 'events', action.events);
      }
      return state;

    /**
     * Timeline event fetch failure
     */
    case 'TIMELINE_EVENTS_FETCH_FAIL':
      return { ...state, events: [] };

    /**
     * Timeline event preference for home screen
     */
    case 'TIMELINE_PREFS_HOMESCREEN':
      return { ...state, preferences: { ...state.preferences, homeScreen: action.showAsHomeScreen } };

    /**
     * Switch Account
     */
    case 'AUTH_SWITCH_ACCOUNT':
      return { ...state, ...INITIAL_STATE }; // clear cache on switching account

    /**
     * On logout
     */
    case 'AUTH_LOGOUT': // clear events on logout
      return { ...state, events: [] };

    default:
      return state;
  }
};
