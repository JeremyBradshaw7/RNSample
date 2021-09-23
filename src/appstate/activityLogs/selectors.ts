import { IState } from '..';
import { createSelector } from 'reselect';
import { IEMSLearnerMap } from './models';

/**
 * Selector to feed subscribing components with Activity Log learners
 * Selectors control which state updates get pushed to components via mapStateToProps, and therefore avoids any unnecessary
 * re-rendering.
 *
 * @return  {IEmsLearner[]}  Sorted learner array
 */
export const makeGetSortedLearners = () => createSelector(
  (state: IState) => state.activityLogs.learners,
  (state: IState) => state.activityLogs.userLearners[state.auth.id],
  (allLearners: IEMSLearnerMap, userlearnerKeys: number[]) => {
    return (userlearnerKeys || []).map((key: number) => allLearners[key]);
  }
);