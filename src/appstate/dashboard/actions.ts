import { IPageInfo } from 'appstate';
import { ICodeMap } from 'appstate/config/models';
import { IAnyMap } from 'components/CodePicker';
import Api from 'services/Api';
import ErrorService from 'services/Error';
import { logger } from 'services/logger';
import Util from 'services/Util';
import { deserialiseDashboardReportMap, deserialiseDashboardArray, IDashboardReport, IDashboardRow } from './models';

export const getDashboardReports = () => {
  return async (dispatch, getState) => {
    try {
      const data: any = await Api.getDashboardReports();
      dispatch({
        type: 'DASHBOARD_REPORTS_LIST_FETCH_SUCCESS',
        reports: deserialiseDashboardReportMap(data)
      });
    } catch (err) {
      ErrorService.logError('DASHBOARD_REPORTS_LIST_FETCH_FAIL', err);
      // throw err;
    }
  };
};

export const getDashboardData = (report: IDashboardReport, params: IAnyMap = {}, filterLevel: number = 0, filteredLevels: string[] = [], page: number = 1, pageSize: number = 20) => {
  return async (dispatch, getState): Promise<any> => {
    try {
      const data: any = await Api.getDashboardData(report.id, params, filterLevel, filteredLevels, page, pageSize);
      // different dashboards may return different data. For heatmap screen we're expecting this:
      // logger('getDashboardData', params, { page, data });
      const columns: string[] = data?.heading || [];
      const { rows, groups } = deserialiseDashboardArray(report, data?.users?.data || [], page, pageSize);
      const pageResult = data?.users || {};
      const pageInfo: IPageInfo = { page: pageResult.current_page, count: rows.length, lastPage: pageResult.last_page, total: pageResult.total, extraData: null };
      // logger('=', { columns, rows, groups, pageInfo });
      return ({ columns, rows, groups, pageInfo });
    } catch (err) {
      ErrorService.logError('DASHBOARD_DATA_FETCH_FAIL', err);
      throw err;
    }
  };
};

export const getEducationGroups = () => {
  return async (dispatch, getState) => {
    try {
      const data: any = await Api.getEducationGroups();
      const groups: ICodeMap = Util.arrayToCodeMap(data, 'id', 'name');
      dispatch({
        type: 'EDUCATION_GROUPS_FETCH_SUCCESS',
        groups
      });
    } catch (err) {
      ErrorService.logError('EDUCATION_GROUPS_FETCH_FAIL', err);
      // throw err;
    }
  };
};

export const getTableauTicket = (userName: string) => {
  return async (dispatch, getState): Promise<string> => {
    try {
      const result: any = await Api.getTableauTicket(userName);
      // dispatch({
      //   type: 'TABLEAU_TICKET_SUCCESS',
      //   ticket: data
      // });
      return result === '-1' ? '' : (result || '');
    } catch (err) {
      ErrorService.logError('TABLEAU_TICKET_FAIL', err);
      throw err;
    }
  };
};
