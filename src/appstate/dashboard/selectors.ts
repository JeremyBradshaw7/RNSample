import { IState } from '..';
import { createSelector } from 'reselect';
import { } from './models';

// ----------------------------------------------------------------------------------------------------------------------------------------------------
// SELECTORS - allow us to control which state updates get pushed to components via mapStateToProps, and therefore avoids any unnecessary re-rendering.

// export const makeGetSortedLearners = () => createSelector(
//   (state: IState) => state.activityLogs.learners,
//   (state: IState) =>  state.activityLogs.userLearners[state.auth.id],
//   (allLearners: IEMSLearnerMap, userlearnerKeys: number[]) => {
//     return (userlearnerKeys || []).map((key: number) => allLearners[key]);
//   }
// );
