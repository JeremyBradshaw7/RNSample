// Dashboard reducers

import { IDashboardState } from './models';
import dotProp from 'dot-prop-immutable';
import _ from 'lodash';
import { logger } from 'services/logger';
import Util from 'services/Util';

export const INITIAL_STATE: IDashboardState = {
  reports: {}
};

export default (state: IDashboardState = INITIAL_STATE, action): IDashboardState => {
  switch (action.type) {
    case 'AUTH_SWITCH_ACCOUNT':
      return { ...state, ...INITIAL_STATE }; // clear cache on switching account

    case 'AUTH_LOGOUT':
      return { ...state, reports: {} }; // clear reports on logging out (why?)

    case 'DASHBOARD_REPORTS_LIST_FETCH_SUCCESS':
      return { ...state, reports: action.reports };

    default:
      return state;
  }
};
