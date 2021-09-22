// CPD reducers

import { IDAPState, IDAPQualification, IDAPQualificationMap, ICPDActivityMap, ICPDActivity, ICPDActivityGroup, ICPDActivityGroupMap } from './models';
import dotProp from 'dot-prop-immutable';
import _ from 'lodash';
import { logger } from 'services/logger';

export const INITIAL_STATE: IDAPState = {
  cpdActivities: {},
  adminUserCPDActivityKeys: {},
  userVisibleCPDActivityKeys: {},
  allActivities: {},

  qualifications: {},
  userQualificationKeys: {},
  allQualifications: {},

  cpdActivityGroups: {},
  userCPDActivityGroupKeys: {},
  activityGroupCriteria: {}
};

export default (state: IDAPState = INITIAL_STATE, action): IDAPState => {
  switch (action.type) {
    // case REHYDRATE:
    //   logger('rehydrating, init api', state);
    //   return { // THIS DOES NOT SEEM TO WORK!
    //     ...state,
    //     // do not rehydrate these (NB. redux persist blacklist only works at root level):
    //     pendingEvidenceLinks: {},
    //     pendingEvidence: {}
    //   };

    case 'AUTH_SWITCH_ACCOUNT':
      return { ...state, ...INITIAL_STATE }; // clear cache on switching account

    case 'DAP_QUALIFICATION_LIST_FETCH_SUCCESS':
      return {
        ...state,
        allQualifications: action.allQualifications
      };

    case 'DAP_QUALIFICATIONS_FETCH_SUCCESS':
      // eslint-disable-next-line
      if (action.page === 1) {
        state = dotProp.set(state, `userQualificationKeys.${action.userid}`, action.qualifications.map((q: IDAPQualification) => q.id));
      } else {
        state = dotProp.merge(state, `userQualificationKeys.${action.userid}`, action.qualifications.map((q: IDAPQualification) => q.id));
      }
      let qualifications: IDAPQualificationMap = state.qualifications;
      action.qualifications.forEach((q: IDAPQualification) => {
        qualifications = { ...qualifications, [q.id]: q };
      });
      return {
        ...state,
        qualifications
      };

    case 'DAP_QUALIFICATION_UPSERT_SUCCESS':
      if (action.insert) {
        state = dotProp.merge(state, `userQualificationKeys.${action.userid}`, action.qualification.id);
      }
      return dotProp.set(state, `qualifications.${action.qualification.id}`, action.qualification);

    case 'DAP_QUALIFICATION_DELETE_SUCCESS':
      // delete it from the user's array of ids
      const index = state.userQualificationKeys[action.userid].indexOf(action.id);
      if (index > -1) {
        state = dotProp.delete(state, `userQualificationKeys.${action.userid}.${index}`);
      }
      // delete it from the qualifications map
      return dotProp.delete(state, `qualifications.${action.id}`);

    case 'CPD_ACTIVITY_LIST_FETCH_SUCCESS':
      return {
        ...state,
        allActivities: action.allActivities
      };

    case 'ADMIN_CPD_ACTIVITIES_FETCH_SUCCESS':
      // eslint-disable-next-line
      if (action.page === 1) {
        state = dotProp.set(state, `adminUserCPDActivityKeys.${action.userid}`, action.activities.map((q: ICPDActivity) => q.id));
      } else {
        state = dotProp.merge(state, `adminUserCPDActivityKeys.${action.userid}`, action.activities.map((q: ICPDActivity) => q.id));
      }
      let cpdActivities: ICPDActivityMap = state.cpdActivities;
      action.activities.forEach((a: ICPDActivity) => {
        cpdActivities = { ...cpdActivities, [a.id]: a };
      });
      logger('4', cpdActivities);
      return {
        ...state,
        cpdActivities
      };

    case 'VISIBLE_CPD_ACTIVITIES_FETCH_SUCCESS':
      // eslint-disable-next-line
      if (action.page === 1) {
        state = dotProp.set(state, `userVisibleCPDActivityKeys.${action.userid}`, action.activities.map((q: ICPDActivity) => q.id));
      } else {
        state = dotProp.merge(state, `userVisibleCPDActivityKeys.${action.userid}`, action.activities.map((q: ICPDActivity) => q.id));
      }
      let allCpdActivities: ICPDActivityMap = state.cpdActivities;
      action.activities.forEach((a: ICPDActivity) => {
        allCpdActivities = { ...allCpdActivities, [a.id]: a };
      });
      return {
        ...state,
        cpdActivities: allCpdActivities
      };

    case 'CPD_ACTIVITY_UPSERT_SUCCESS':
      if (action.insert) {
        state = dotProp.merge(state, `adminUserCPDActivityKeys.${action.userid}`, action.activity.id);
      }
      return dotProp.set(state, `cpdActivities.${action.activity.id}`, action.activity);

    case 'CPD_ACTIVITY_DELETE_SUCCESS':
      // delete it from the user's array of ids
      const aindex = state.adminUserCPDActivityKeys[action.userid].indexOf(action.id);
      if (aindex > -1) {
        state = dotProp.delete(state, `adminUserCPDActivityKeys.${action.userid}.${aindex}`);
      }
      // delete it from the cpdActivities map
      return dotProp.delete(state, `cpdActivities.${action.id}`);

    case 'USER_CRITERIA_FETCH_SUCCESS':
      return {
        ...state,
        activityGroupCriteria: action.data
      };

    case 'CPD_ACTIVITY_GROUPS_FETCH_SUCCESS':
      // eslint-disable-next-line
      if (action.page === 1) {
        state = dotProp.set(state, `userCPDActivityGroupKeys.${action.userid}`, action.groups.map((q: ICPDActivityGroup) => q.id));
      } else {
        state = dotProp.merge(state, `userCPDActivityGroupKeys.${action.userid}`, action.groups.map((q: ICPDActivityGroup) => q.id));
      }
      let cpdActivityGroups: ICPDActivityGroupMap = state.cpdActivityGroups;
      action.groups.forEach((a: ICPDActivityGroup) => {
        cpdActivityGroups = { ...cpdActivityGroups, [a.id]: a };
      });
      return {
        ...state,
        cpdActivityGroups
      };

    case 'CPD_ACTIVITY_GROUP_UPSERT_SUCCESS':
      if (action.insert) {
        state = dotProp.merge(state, `userCPDActivityGroupKeys.${action.userid}`, action.group.id);
      }
      return dotProp.set(state, `cpdActivityGroups.${action.group.id}`, action.group);

    case 'CPD_ACTIVITY_GROUP_DELETE_SUCCESS':
      // delete it from the user's array of ids
      const gindex = state.userCPDActivityGroupKeys[action.userid].indexOf(action.id);
      if (gindex > -1) {
        state = dotProp.delete(state, `userCPDActivityGroupKeys.${action.userid}.${gindex}`);
      }
      // delete it from the cpdActivityGroups map
      return dotProp.delete(state, `cpdActivityGroups.${action.id}`);

    default:
      return state;
  }
};
