import Api from 'services/Api';
import { IPageInfo, IState } from '..';
import { logger } from 'services/logger';
import ErrorService from 'services/Error';
import { deserialiseEventArray, EventTypeMapping, ITimelineEvent } from './models';

// Redux Action Creators for Activity Logs

/**
 * Get the timeline events
 *
 * @param   {number}   page        Page number
 * @param   {number}   pageSize    Page size
 * @param   {boolean}  throwError  Whether to throw an error on failure (default true)
 *
 * @return  {Promise<PageInfo>}    Page result information (actual event data injected via redux)
 */
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
        throw err;
      }
      return null;
    }
  };
};

/**
 * Persist timeline preferences
 *
 * @param   {boolean}  showAsHomeScreen  [showAsHomeScreen description]
 */
export const setHomeScreenPreference = (showAsHomeScreen: boolean) => {
  return async (dispatch, getState) => {
    try {
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
