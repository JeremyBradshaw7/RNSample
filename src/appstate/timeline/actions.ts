import Api from 'services/Api';
import { IPageInfo, IState } from '..';
import { logger } from 'services/logger';
import ErrorService from 'services/Error';
import { deserialiseEventArray, EventTypeMapping, ITimelineEvent } from './models';

export const getTimelineEvents = (page: number, pageSize: number, throwError: boolean = true) => {
  return async (dispatch, getState): Promise<IPageInfo | null> => {
    try {
      const result: any = await Api.getTimelineEvents(page, pageSize);
      const events: ITimelineEvent[] = deserialiseEventArray(result.data);
      dispatch({
        type: 'TIMELINE_EVENTS_FETCH_SUCCESS',
        page,
        events
      });
      return { page: result.current_page, count: events.length, lastPage: result.last_page, total: result.total, extraData: events };
    } catch (err) {
      dispatch({ type: 'TIMELINE_EVENTS_FETCH_FAIL' });
      if (throwError) {
        // ErrorService.logError('TIMELINE_EVENTS_FETCH_FAIL', err);
        throw err;
      }
      return null;
    }
  };
};

export const setHomeScreenPreference = (showAsHomeScreen: boolean) => {
  return async (dispatch, getState) => {
    try {
      // const json: any = await Api.setHomeScreenPreference(showAsHomeScreen);
      dispatch({
        type: 'TIMELINE_PREFS_HOMESCREEN',
        showAsHomeScreen
      });
    } catch (err) {
      ErrorService.logError('TIMELINE_PREFS_HOMESCREEN_FAIL', err);
      throw err;
    }
  };
};

// export const setEventTypePreferences = (eventTypeMapping: EventTypeMapping) => {
//   return async (dispatch, getState) => {
//     try {
//       // const json: any = await Api.setEventTypePreferences(eventTypeMapping);
//       dispatch({
//         type: 'TIMELINE_PREFS_EVENTTYPES',
//         eventTypeMapping
//       });
//     } catch (err) {
//       ErrorService.logError('TIMELINE_PREFS_EVENTTYPES_FAIL', err);
//       throw err;
//     }
//   };
// };
