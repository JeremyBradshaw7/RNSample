// CPD reducers

import { IActivityLogState, IEMSLearnerMap, IEmsLearner, IActivityLog, IActivityComment } from './models';
import dotProp from 'dot-prop-immutable';
import _ from 'lodash';

/**
 * Initial Activity Log State
 */
export const INITIAL_STATE: IActivityLogState = {
  userLearners: {},
  learners: {},
  learnerActivities: {}
};

/**
 * Compute percentage complete for learner and apply to state in order to produce new state
 *
 * @param   {IActivityLogState}  state      Our current state
 * @param   {number}             learnerId  Learner ID
 *
 * @return  {IActivityLogState}             New state
 */
function computeLearnerPercentageComplete (state: IActivityLogState, learnerId: number): IActivityLogState {
  const tot = (state.learnerActivities[learnerId] || []).reduce((sum: number, a: IActivityLog) => sum + a.minutes, 0);
  const max = ((state.learners[learnerId] || {}).maxHours || 0) * 60;
  const pc = max === 0 ? 0 : (tot * 100) / max;
  state = dotProp.set(state, `learners.${learnerId}.percentageComplete`, Math.round(pc));
  return state;
}

/**
 * Activity Log State Reducers
 *
 * @param   {IActivityLogState}  state          Initial state
 * @param   {[type]}             action         Dispatched Redux action
 * @return  {IActivityLogState}                 New state
 */
export default (state: IActivityLogState = INITIAL_STATE, action): IActivityLogState => {
  switch (action.type) {

    /**
     * Fetched Learner Logs
     */
    case 'LEARNERLOGS_FETCH_SUCCESS':
      if (action.page === 1) {
        state = dotProp.set(state, `userLearners.${action.userid}`, action.learners.map((learner: IEmsLearner) => learner.id));
      } else {
        state = dotProp.merge(state, `userLearners.${action.userid}`, action.learners.map((learner: IEmsLearner) => learner.id));
      }

      let learners: IEMSLearnerMap = state.learners;
      action.learners.forEach((learner: IEmsLearner) => {
        learners = { ...learners, [learner.id]: learner };
      });
      return {
        ...state,
        learners
      };

    /**
     * Fetched Activity Logs
     */
    case 'ACTIVITY_LOGS_FETCH_SUCCESS':
      state = dotProp.set(state, `learnerActivities.${action.learnerId}`, action.activities);
      return state;

    /**
     * Added Activity Log
     */
    case 'ACTIVITY_LOG_ADD_SUCCESS':
      state = dotProp.merge(state, `learnerActivities.${action.learnerId}`, action.activity);
      if (action.percentageComplete !== undefined) {
        state = dotProp.set(state, `learners.${action.learnerId}.percentageComplete`, action.percentageComplete);
      } else {
        state = computeLearnerPercentageComplete(state, action.learnerId);
      }
      return state;

    /**
     * Updated Activity Log
     */
    case 'ACTIVITY_LOG_UPDATE_SUCCESS':
      const uActivities: IActivityLog[] = state.learnerActivities[action.learnerId] || [];
      const uActIndex = uActivities.findIndex((activity: IActivityLog) => activity.guid === action.activity.guid);
      if (uActIndex > -1) {
        state = dotProp.set(state, `learnerActivities.${action.learnerId}.${uActIndex}`, action.activity);
      }
      if (action.percentageComplete !== undefined) {
        state = dotProp.set(state, `learners.${action.learnerId}.percentageComplete`, action.percentageComplete);
      } else {
        state = computeLearnerPercentageComplete(state, action.learnerId);
      }
      return state;

    /**
     * Deleted Activity Log
     */
    case 'ACTIVITY_LOG_DELETE_SUCCESS':
      const adActivities: IActivityLog[] = state.learnerActivities[action.learnerId] || [];
      const adActIndex = adActivities.findIndex((activity: IActivityLog) => activity.guid === action.activityGuid);
      if (adActIndex > -1) {
        state = dotProp.delete(state, `learnerActivities.${action.learnerId}.${adActIndex}`, action.activity);
      }
      if (action.percentageComplete !== undefined) {
        state = dotProp.set(state, `learners.${action.learnerId}.percentageComplete`, action.percentageComplete);
      } else {
        state = computeLearnerPercentageComplete(state, action.learnerId);
      }
      return state;

    default:
      return state;
  }
};
