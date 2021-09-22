// CPD reducers

import { IActivityLogState, IEMSLearnerMap, IEmsLearner, IActivityLog, IActivityComment } from './models';
import dotProp from 'dot-prop-immutable';
import _ from 'lodash';
import { logger } from 'services/logger';
import Util from 'services/Util';

export const INITIAL_STATE: IActivityLogState = {
  userLearners: {},
  learners: {},
  learnerActivities: {}
};

function computeLearnerPercentageComplete (state: IActivityLogState, learnerId: number): IActivityLogState {
  const tot = (state.learnerActivities[learnerId] || []).reduce((sum: number, a: IActivityLog) => sum + a.minutes, 0);
  const max = ((state.learners[learnerId] || {}).maxHours || 0) * 60;
  const pc = max === 0 ? 0 : (tot * 100) / max;
  state = dotProp.set(state, `learners.${learnerId}.percentageComplete`, Math.round(pc));
  return state;
}

export default (state: IActivityLogState = INITIAL_STATE, action): IActivityLogState => {
  switch (action.type) {

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

    case 'ACTIVITY_LOGS_FETCH_SUCCESS':
      state = dotProp.set(state, `learnerActivities.${action.learnerId}`, action.activities);
      return state;

    case 'ACTIVITY_LOG_ADD_SUCCESS': // learnerId, activity, percentageComplete
      state = dotProp.merge(state, `learnerActivities.${action.learnerId}`, action.activity);
      if (action.percentageComplete !== undefined) {
        state = dotProp.set(state, `learners.${action.learnerId}.percentageComplete`, action.percentageComplete);
      } else {
        state = computeLearnerPercentageComplete(state, action.learnerId);
      }
      return state;

    case 'ACTIVITY_LOG_UPDATE_SUCCESS': // learnerId, activity, percentageComplete
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

    case 'ACTIVITY_LOG_DELETE_SUCCESS': // learnerId, activityGuid, percentageComplete
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

    case 'ACTIVITY_LOG_COMMENT_ADD_SUCCESS': // learnerId, activityGuid, newComment
      const activities: IActivityLog[] = state.learnerActivities[action.learnerId] || [];
      const actIndex = activities.findIndex((activity: IActivityLog) => activity.guid === action.activityGuid);
      if (actIndex > -1) {
        state = dotProp.merge(state, `learnerActivities.${action.learnerId}.${actIndex}.comments`, action.newComment);
      }
      return state;

    case 'ACTIVITY_LOG_COMMENT_UPDATE_SUCCESS': // learnerId, activityGuid, commentId, comment
      return state;

    case 'ACTIVITY_LOG_COMMENT_DELETE_SUCCESS': // learnerId, activityGuid, commentId
      // delete it from the activity's array of comments
      const dActivities: IActivityLog[] = state.learnerActivities[action.learnerId] || [];
      const dActIndex = dActivities.findIndex((activity: IActivityLog) => activity.guid === action.activityGuid);
      if (dActIndex > -1) {
        // then find the comment in the cativity's array
        const comments: IActivityComment[] = dActivities[dActIndex].comments;
        const cIndex = comments.findIndex((comment: IActivityComment) => comment.guid === action.commentId);
        state = dotProp.delete(state, `learnerActivities.${action.learnerId}.${dActIndex}.comments.${cIndex}`);
      }
      return state;

    default:
      return state;
  }
};
