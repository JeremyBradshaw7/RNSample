import { IState } from '..';
import { createSelector } from 'reselect';
import { IDAPQualification, IDAPQualificationMap, ICPDActivityMap, ICPDActivity, ICPDActivityGroupMap, ICPDActivityGroup } from './models';
import { logger } from 'services/logger';
import { ICodeMap } from 'appstate/config/models';
import Util from 'services/Util';

// ----------------------------------------------------------------------------------------------------------------------------------------------------
// SELECTORS - allow us to control which state updates get pushed to components via mapStateToProps, and therefore avoids any unnecessary re-rendering.

export const makeGetSortedCPDActivitiesAdmin = () => createSelector(
  (state: IState) => state.dap.cpdActivities,
  (state: IState) =>  state.dap.adminUserCPDActivityKeys[state.auth.id],
  (allCPDActivities: ICPDActivityMap, adminUserCPDActivityKeys: string[]): ICPDActivity[] => {
    return (adminUserCPDActivityKeys || []).map((key: string) => allCPDActivities[key]);
  }
);

export const makeGetSortedCPDActivitiesVisible = () => createSelector(
  (state: IState) => state.dap.cpdActivities,
  (state: IState) =>  state.dap.userVisibleCPDActivityKeys[state.auth.id],
  (allCPDActivities: ICPDActivityMap, userVisibleCPDActivityKeys: string[]): ICPDActivity[] => {
    return (userVisibleCPDActivityKeys || []).map((key: string) => allCPDActivities[key]);
  }
);

export const makeGetSortedCPDActivityGroups = () => createSelector(
  (state: IState) => state.dap.cpdActivityGroups,
  (state: IState) =>  state.dap.userCPDActivityGroupKeys[state.auth.id],
  (allCPDGroups: ICPDActivityGroupMap, userCPDActivityGroupKeys: string[]): ICPDActivityGroup[] => {
    return (userCPDActivityGroupKeys || []).map((key: string) => allCPDGroups[key]);
  }
);

export const makeGetSortedQualifications = () => createSelector(
  (state: IState) => state.dap.qualifications,
  (state: IState) =>  state.dap.userQualificationKeys[state.auth.id],
  (allQualifications: IDAPQualificationMap, userQualificationKeys: string[]): IDAPQualification[] => {
    return (userQualificationKeys || []).map((key: string) => allQualifications[key]);
  }
);

export const makeGetQualificationsList = (excludeId: string = '') => createSelector(
  (state: IState) => state.dap.allQualifications,
  (allQualifications: ICodeMap): ICodeMap => {
    return allQualifications;
  }
);

export const makeGetCPDActivitiesList = (excludeId: string = '') => createSelector(
  (state: IState) => state.dap.allActivities,
  (allActivities: ICodeMap): ICodeMap => {
    return allActivities;
  }
);