import Api from 'services/Api';
import { IPageInfo } from '..';
import ErrorService from 'services/Error';
import { deserialiseLearnerArray, IEmsLearner, IActivityLog, deserialiseActivityArray, IActivityComment } from './models';
import Analytics from 'services/Analytics';

// Redux Action Creators for Activity Logs

/**
 * Get a paged list of Learners (asynch)
 *
 * @param   {number}  page           Page number
 * @param   {string}  namePattern    Name filter pattern
 * @param   {string}  classPattern   Class filter patterm
 * @param   {string}  orgMatch       Org unit id filter
 *
 * @return  {Promise<PageInfo>}      Page result information (actual learner data injected via redux)
 */
export const getActivityLogLearners = (page: number, namePattern: string, classPattern: string, orgMatch: string) => {
  return async (dispatch, getState): Promise<IPageInfo> => {
    try {
      const json: any = await Api.getActivityLogLearners(page, namePattern, classPattern, orgMatch);
      const result = json.result || {};
      const learners: IEmsLearner[] = deserialiseLearnerArray(result.data);
      dispatch({
        type: 'LEARNERLOGS_FETCH_SUCCESS',
        userid: getState().auth.id,
        page,
        learners
      });
      return { page: result.current_page, count: learners.length, lastPage: result.last_page, total: result.total, extraData: json.privileges };
    } catch (err) {
      ErrorService.logError('LEARNERLOGS_FETCH_FAIL', err);
      throw err;
    }
  };
};

/**
 * Add a new Learner to the Activity log
 *
 * @param   {number}  newUserId  New learner ID
 */
export const addNewAtivityLogLearner = (newUserId: number) => {
  return async (dispatch, getState) => {
    try {
      const json: any = await Api.addNewAtivityLogLearner(newUserId);
      Analytics.logEvent('addNewAtivityLogLearner', { newUserId });
    } catch (err) {
      ErrorService.logError('ADD_LEARNER_FAIL', err);
      throw err;
    }
  };
};

/**
 * Update a learner activity log
 *
 * @param   {number}        learnerId  Learner ID
 * @param   {IActivityLog}  activity   Activity Log details
 */
export const updateActivityLog = (learnerId: number, activity: IActivityLog) => {
  return async (dispatch, getState) => {
    try {
      const json: any = await Api.updateActivityLog(activity.guid, activity.description, activity.date, activity.minutes);
      Analytics.logEvent('updateActivityLog', { learnerId });
      dispatch({
        type: 'ACTIVITY_LOG_UPDATE_SUCCESS',
        learnerId,
        activity,
        percentageComplete: json.percentage_complete
      });
    } catch (err) {
      ErrorService.logError('ACTIVITY_LOG_UPDATE_FAIL', err);
      throw err;
    }
  };
};

/**
 * Add a learner activity log
 *
 * @param   {number}        learnerId  Learner ID
 * @param   {IActivityLog}  activity   Activity Log details
 */
 export const addActivityLog = (learnerId: number, activity: IActivityLog) => {
  return async (dispatch, getState): Promise<string> => {
    try {
      const json: any = await Api.addActivityLog(learnerId, activity.description, activity.date, activity.minutes);
      activity.guid = json.log.guid; // new guid
      Analytics.logEvent('addActivityLog', { learnerId });
      dispatch({
        type: 'ACTIVITY_LOG_ADD_SUCCESS',
        learnerId,
        activity,
        percentageComplete: json.percentage_complete
      });
      return json.log.guid;
    } catch (err) {
      ErrorService.logError('ACTIVITY_LOG_ADD_FAIL', err);
      throw err;
    }
  };
};

/**
 * Delete a learner activity log
 *
 * @param   {number}  learnerId     Learner ID
 * @param   {string}  activityGuid  Activity GUID
 */
export const deleteActivityLog = (learnerId: number, activityGuid: string) => {
  return async (dispatch, getState) => {
    try {
      const json: any = await Api.deleteActivityLog(activityGuid);
      Analytics.logEvent('deleteActivityLog', { learnerId, activityGuid });
      dispatch({
        type: 'ACTIVITY_LOG_DELETE_SUCCESS',
        learnerId,
        activityGuid,
        percentageComplete: json.percentage_complete
      });
    } catch (err) {
      ErrorService.logError('ACTIVITY_LOG_DELETE_FAIL', err);
      throw err;
    }
  };
};
