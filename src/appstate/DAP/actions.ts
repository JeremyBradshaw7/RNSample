import Api from 'services/Api';
import { Deserialisers, IDAPQualification, ICPDActivity, ICPDActivityGroup, IPersonDAPQualification } from './models';
import { IPageInfo, IState } from '..';
import { logger } from 'services/logger';
import ErrorService from 'services/Error';
import Util from 'services/Util';
import Analytics from 'services/Analytics';

/**
 * CPD Activities
 */
export const getCPDActivityList = () => {
  return async (dispatch, getState) => {
    try {
      const data: any = await Api.getCPDActivityList();
      dispatch({
        type: 'CPD_ACTIVITY_LIST_FETCH_SUCCESS',
        allActivities: data // already a mapping
      });
    } catch (err) {
      ErrorService.logError('DAP_CPD_ACTIVITY_LIST_FETCH_FAIL', err);
      throw err;
    }
  };
};
export const getAdminCPDActivities = (page: number = 1) => {
  return async (dispatch, getState): Promise<IPageInfo> => {
    try {
      const json: any = await Api.getAdminCPDActivities(page);
      const activities: ICPDActivity[] = Deserialisers.deserialiseCPDActivityArray(json.data);
      dispatch({
        type: 'ADMIN_CPD_ACTIVITIES_FETCH_SUCCESS',
        userid: getState().auth.id,
        page,
        activities
      });
      return { page: json.current_page, count: activities.length, lastPage: json.last_page, total: json.total, extraData: {} };
    } catch (err) {
      ErrorService.logError('ADMIN_CPD_ACTIVITIES_FETCH_FAIL', err);
      throw err;
    }
  };
};
export const getVisibleCPDActivities = (page: number = 1) => {
  return async (dispatch, getState): Promise<IPageInfo> => {
    try {
      const json: any = await Api.getVisibleCPDActivities(page);
      const activities: ICPDActivity[] = Deserialisers.deserialiseCPDActivityArray(json.data);
      dispatch({
        type: 'VISIBLE_CPD_ACTIVITIES_FETCH_SUCCESS',
        userid: getState().auth.id,
        page,
        activities
      });
      return { page: json.current_page, count: activities.length, lastPage: json.last_page, total: json.total, extraData: {} };
    } catch (err) {
      ErrorService.logError('GET_VISILE_CPD_ACTIVITIES_FAIL', err);
      throw err;
    }
  };
};
export const upsertCPDActivity = (activity: ICPDActivity) => {
  return async (dispatch, getState): Promise<string> => {
    try {
      const data: any = await Api.upsertCPDActivity(activity);
      const insert = activity.id === 'NEW';
      if (insert) {
        activity.id = data.id; // new id coming back
      }
      Analytics.logEvent('upsertCPDActivity');
      dispatch({
        type: 'CPD_ACTIVITY_UPSERT_SUCCESS',
        userid: getState().auth.id,
        insert,
        activity
      });
      return activity.id;
    } catch (err) {
      ErrorService.logError('CPD_ACTIVITY_UPSERT_FAIL', err);
      throw err;
    }
  };
};
export const deleteCPDActivity = (activity: ICPDActivity) => {
  return async (dispatch, getState) => {
    try {
      const data: any = await Api.deleteCPDActivity(activity.id);
      Analytics.logEvent('deleteCPDActivity');
      dispatch({
        type: 'CPD_ACTIVITY_DELETE_SUCCESS',
        userid: getState().auth.id,
        id: activity.id
      });
    } catch (err) {
      ErrorService.logError('CPD_ACTIVITY_DELETE_FAIL', err);
      throw err;
    }
  };
};

/**
 * CPD Activity Groups
 */
export const getCPDActivityGroupUserCriteria = () => {
  return async (dispatch, getState) => {
    try {
      const data: any = await Api.getCPDActivityGroupUserCriteria();
      dispatch({
        type: 'USER_CRITERIA_FETCH_SUCCESS',
        data
      });
    } catch (err) {
      ErrorService.logError('USER_CRITERIA_FETCH_FAIL', err);
      throw err;
    }
  };
};
export const getCPDActivityGroups = (page: number) => {
  return async (dispatch, getState): Promise<IPageInfo> => {
    try {
      const json: any = await Api.getCPDActivityGroups(page);
      const groups: ICPDActivityGroup[] = Deserialisers.deserialiseCPDActivityGroupArray(json.data);
      dispatch({
        type: 'CPD_ACTIVITY_GROUPS_FETCH_SUCCESS',
        userid: getState().auth.id,
        page,
        groups
      });
      return { page: json.current_page, count: json.length, lastPage: json.last_page, total: json.total, extraData: {} };
    } catch (err) {
      ErrorService.logError('CPD_ACTIVITY_GROUPS_FETCH_FAIL', err);
      throw err;
    }
  };
};
export const upsertCPDActivityGroup = (group: ICPDActivityGroup) => {
  return async (dispatch, getState): Promise<string> => {
    try {
      const data: any = await Api.upsertCPDActivityGroup(group);
      const insert = group.id === 'NEW';
      if (insert) {
        group.id = data.id; // new id coming back
      }
      Analytics.logEvent('upsertCPDActivityGroup');
      dispatch({
        type: 'CPD_ACTIVITY_GROUP_UPSERT_SUCCESS',
        userid: getState().auth.id,
        insert,
        group
      });
      return group.id;
    } catch (err) {
      ErrorService.logError('CPD_ACTIVITY_UPSERT_FAIL', err);
      throw err;
    }
  };
};
export const deleteCPDActivityGroup = (group: ICPDActivityGroup) => {
  return async (dispatch, getState) => {
    try {
      const data: any = await Api.deleteCPDActivityGroup(group.id);
      Analytics.logEvent('deleteCPDActivityGroup');
      dispatch({
        type: 'CPD_ACTIVITY_GROUP_DELETE_SUCCESS',
        userid: getState().auth.id,
        id: group.id
      });
    } catch (err) {
      ErrorService.logError('CPD_ACTIVITY_GROUP_DELETE_FAIL', err);
      throw err;
    }
  };
};
export const testActivityCriteria = (group: ICPDActivityGroup) => {
  return async (dispatch, getState): Promise<IPageInfo> => {
    try {
      const result: any = await Api.testActivityCriteria(group);
      return { page: result.current_page, count: result.to, lastPage: result.last_page, total: result.total, extraData: {} };
    } catch (err) {
      ErrorService.logError('TEST_ACTIVITY_CRITERIA_FAIL', err);
      throw err;
    }
  };
};

/**
 * DAP Qualifications
 */
export const getDAPQualificationList = () => {
  return async (dispatch, getState) => {
    try {
      const data: any = await Api.getDAPQualificationList();
      dispatch({
        type: 'DAP_QUALIFICATION_LIST_FETCH_SUCCESS',
        allQualifications: data // already a mapping
      });
    } catch (err) {
      ErrorService.logError('DAP_QUALIFICATION_LIST_FETCH_FAIL', err);
      throw err;
    }
  };
};
export const getDAPQualifications = (page: number = 1) => {
  return async (dispatch, getState): Promise<IPageInfo> => {
    try {
      // dispatch({ type: 'DAP_QUALIFICATIONS_FETCH', userid: getState().auth.id, page });
      const json: any = await Api.getDAPQualifications(page);
      const qualifications: IDAPQualification[] = Deserialisers.deserialiseDAPQualificationArray(json.data);
      dispatch({
        type: 'DAP_QUALIFICATIONS_FETCH_SUCCESS',
        userid: getState().auth.id,
        page,
        qualifications
      });
      return { page: json.current_page, count: qualifications.length, lastPage: json.last_page, total: json.total, extraData: {} };
    } catch (err) {
      ErrorService.logError('DAP_QUALIFICATIONS_FETCH_FAIL', err);
      throw err;
    }
  };
};
export const getDAPQualification = (qualificationId: string) => {
  return async (dispatch, getState): Promise<IDAPQualification> => {
    try {
      // dispatch({ type: 'DAP_QUALIFICATIONS_FETCH', userid: getState().auth.id, page });
      const data: any = await Api.getDAPQualification(qualificationId);
      const qualification: IDAPQualification = Deserialisers.deserialiseDAPQualification(data);
      return qualification;
    } catch (err) {
      ErrorService.logError('DAP_QUALIFICATION_FETCH_FAIL', err);
      throw err;
    }
  };
};

export const upsertDAPQualification = (qualification: IDAPQualification) => {
  return async (dispatch, getState): Promise<string> => {
    try {
      const data: any = await Api.upsertQualification(qualification);
      const insert = qualification.id === 'NEW';
      if (insert) {
        qualification.id = data.id; // new id coming back
      }
      Analytics.logEvent('upsertDAPQualification');
      dispatch({
        type: 'DAP_QUALIFICATION_UPSERT_SUCCESS',
        userid: getState().auth.id,
        insert,
        qualification
      });
      return qualification.id;
    } catch (err) {
      ErrorService.logError('DAP_QUALIFICATION_UPSERT_FAIL', err);
      throw err;
    }
  };
};
export const deleteDAPQualification = (qualification: IDAPQualification) => {
  return async (dispatch, getState) => {
    try {
      const data: any = await Api.deleteQualification(qualification.id);
      Analytics.logEvent('deleteDAPQualification');
      dispatch({
        type: 'DAP_QUALIFICATION_DELETE_SUCCESS',
        userid: getState().auth.id,
        id: qualification.id
      });
    } catch (err) {
      ErrorService.logError('DAP_QUALIFICATION_DELETE_FAIL', err);
      throw err;
    }
  };
};

/* Person Qualifications */

export const upsertPersonQualification = (pq: IPersonDAPQualification) => {
  return async (dispatch, getState): Promise<string> => {
    try {
      const data: any = await Api.upsertPersonQualification(pq);
      Analytics.logEvent('upsertPersonQualification');
      // dispatch({
      //   type: 'DAP_PERSON_QUALIFICATION_UPSERT_SUCCESS',
      //   userid: getState().auth.id,
      //   id: qualification.id
      // });
      return data.id; // new ID on an insert
    } catch (err) {
      ErrorService.logError('DAP_PERSON_QUALIFICATION_UPSERT_FAIL', err);
      throw err;
    }
  };
};

export const deletePersonQualification = (id: string) => {
  return async (dispatch, getState) => {
    try {
      const data: any = await Api.deletePersonQualification(id);
      Analytics.logEvent('deletePersonQualification');
      // dispatch({
      //   type: 'DAP_PERSON_QUALIFICATION_DELETE_SUCCESS'
      // });
    } catch (err) {
      ErrorService.logError('DAP_PERSON_QUALIFICATION_DELETE_FAIL', err);
      throw err;
    }
  };
};
