import Api from 'services/Api';
// import { Deserialisers } from './models';
import { IPageInfo, IState } from '..';
import { logger } from 'services/logger';
import ErrorService from 'services/Error';
import Util from 'services/Util';
import { deserialiseLearnerArray, IEmsLearner, IActivityLog, deserialiseActivityArray, IActivityComment } from './models';
import { ICodeMap } from '../config/models';
import Analytics from 'services/Analytics';

export const getActivityLogLearners = (page: number, namePattern: string, classPattern: string, orgMatch: string, coursePattern: string, qualMatch: string) => {
  return async (dispatch, getState): Promise<IPageInfo> => {
    try {
      // dispatch({ type: 'LEARNERS_FETCH', userid: getState().auth.id, page });
      const json: any = await Api.getActivityLogLearners(page, namePattern, classPattern, orgMatch, coursePattern, qualMatch);
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

export const getActivityLogNewLearners = () => {
  return async (dispatch, getState): Promise<IEmsLearner[]> => {
    try {
      const json: any = await Api.getActivityLogNewLearners();
      const learners: IEmsLearner[] = deserialiseLearnerArray(json); // these will be sorted by surname
      return learners;
    } catch (err) {
      ErrorService.logError('NEW_LEARNERS_FETCH_FAIL', err);
      throw err;
    }
  };
};

export const addNewAtivityLogLearner = (newUserId: number) => {
  return async (dispatch, getState) => {
    try {
      const json: any = await Api.addNewAtivityLogLearner(newUserId);
      Analytics.logEvent('addNewAtivityLogLearner', { newUserId });
      // const learner: ILearner = deserialiseLearner(json);
      // TODO: when API returns detail just add that to redux data then wont have to refresh in component
    } catch (err) {
      ErrorService.logError('ADD_LEARNER_FAIL', err);
      throw err;
    }
  };
};

export const getActivityLogEstablishments = () => {
  return async (dispatch, getState): Promise<ICodeMap> => {
    try {
      const json: any = await Api.getActivityLogEstablishments();
      const establishments: ICodeMap = Util.arrayToCodeMap(json);
      return establishments;
    } catch (err) {
      ErrorService.logError('ACTIVITY_LOG_ESTABLISHMENTS_FETCH_FAIL', err);
      throw err;
    }
  };
};

export const getActivityLogQualifications = () => {
  return async (dispatch, getState): Promise<ICodeMap> => {
    try {
      const json: any = await Api.getActivityLogQualifications();
      const qualifications: ICodeMap = json; // it is returned from the API as a id: string mapping already
      return qualifications;
    } catch (err) {
      ErrorService.logError('ACTIVITY_LOG_QUALIFICATIONS_FETCH_FAIL', err);
      throw err;
    }
  };
};

export const getActivityLogByUser = (learnerId: number) => {
  return async (dispatch, getState) => {
    try {
      const json: any = await Api.getActivityLogByUser(learnerId);
      const activities: IActivityLog[] = deserialiseActivityArray(json);
      dispatch({
        type: 'ACTIVITY_LOGS_FETCH_SUCCESS',
        learnerId,
        activities
      });

    } catch (err) {
      ErrorService.logError('ACTIVITY_LOG_FETCH_FAIL', err);
      throw err;
    }
  };
};

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

export const updateActivityLogComment = (learnerId: number, activityGuid: string, commentId: string, comment: string) => {
  return async (dispatch, getState) => {
    try {
      const json: any = await Api.updateActivityLogComment(activityGuid, commentId, comment);
      Analytics.logEvent('updateActivityLogComment', { learnerId, activityGuid, commentId });
      dispatch({ type: 'ACTIVITY_LOG_COMMENT_UPDATE_SUCCESS', learnerId, activityGuid, commentId, comment });
    } catch (err) {
      ErrorService.logError('ACTIVITY_LOG_COMMENT_UPDATE_FAIL', err);
      throw err;
    }
  };
};

export const addActivityLogComment = (learnerId: number, activityGuid: string, comment: string) => {
  return async (dispatch, getState: () => IState) => {
    try {
      const json: any = await Api.addActivityLogComment(activityGuid, comment);
      const newComment: IActivityComment = {
        guid: json.id, // new comment id from response
        comment,
        authorId: getState().auth.id,
        authorName: getState().auth.displayName,
        createdAt: Util.now()
      };
      Analytics.logEvent('addActivityLogComment', { learnerId, activityGuid, comment });
      dispatch({ type: 'ACTIVITY_LOG_COMMENT_ADD_SUCCESS', learnerId, activityGuid, newComment });
    } catch (err) {
      ErrorService.logError('ACTIVITY_LOG_COMMENT_ADD_FAIL', err);
      throw err;
    }
  };
};

export const deleteActivityLogComment = (learnerId: number, activityGuid: string, commentId: string) => {
  return async (dispatch, getState) => {
    try {
      const json: any = await Api.deleteActivityLogComment(activityGuid, commentId);
      Analytics.logEvent('deleteActivityLogComment', { learnerId, activityGuid });
      dispatch({ type: 'ACTIVITY_LOG_COMMENT_DELETE_SUCCESS', learnerId, activityGuid, commentId });
    } catch (err) {
      ErrorService.logError('ACTIVITY_LOG_COMMENT_DELETE_FAIL', err);
      throw err;
    }
  };
};