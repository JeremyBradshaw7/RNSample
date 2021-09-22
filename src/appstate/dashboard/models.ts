import ErrorService from 'services/Error';
import { logger } from 'services/logger';
import _ from 'lodash';

// Define our Dashboard State:
export interface IDashboardState {
  reports: IDashboardReportMap;
}

export interface IDashboardReport {
  id: number;
  name: string;
  reportType: 'AssessmentTypeHeatmap' | 'AssessmentTypePerformanceGraph';
  /** assessment type this report is driven by */
  assessmentType: string;
  /** assessment config this report is driven by */
  assessmentConfig: string;
  /** library set this report is restricted to (allows criteria picker) */
  librarySet: string;
  /** scoring set this report is restricted to (app can handle this though not yet in the back-end config) */
  // scoringSet: string;
  /** 0=Standard (scores step must be complete), 1=Filtered (can show incomplete scores - usually in combination with librarySet) */
  scoringMethod: 0 | 1;
  /** selfAssessment: 0: Assessor Only, 1: Assessor and Self, 2: Self Only */
  selfAssessment: 0 | 1 | 2;
  params: any; // everything else to do with this report (may vary per report)
}
export interface IDashboardReportMap { [id: number]: IDashboardReport };

export interface IDashboardRow {
  userId: number;
  displayName: string;
  profileImagePath: string;
  // assessments: IHeatmapAssessment[]; // screen will put these onto columns (if > 1 will deal with it)
  cells: { [columnName: string]: IDashboardAssessment[] };
  index: number; // original sorted index
}
export interface IDashboardAssessment {
  assessmentGuid: string;
  /** state: 0=scheduled, 1=in-progress, 2=complete, 3=closed */
  state: number;
  /** scoresStatus: 0=inProgress, 1=complete, 2=completeAssessee, 3=completeAssessor, undefined=noStep */
  scoresStatus: number | undefined;
  /** selfAssessment: 0: Assessor Only, 1: Assessor and Self, 2: Self Only */
  selfAssessment: 0 | 1 | 2; // Whether SA is on
  columnName: string; // how this aligns to the columns of the heatmap
  revieweeScore: number | null;
  reviewerScore: number | null;
  filteredRevieweeScore: number | null;
  filteredReviewerScore: number | null;
  rangeListId: number | null;
  configGuid: string;
  levels: IDashboardLevel[];
}

export interface IDashboardLevel { // normally groups but dimensions/expressions when filtered at that level
  name: string;
  guid: string;
  revieweeScore: number | null;
  reviewerScore: number | null;
  filteredRevieweeScore: number | null;
  filteredReviewerScore: number | null;
  volumeInput: number | null;
  volumeInputType: 'NUMBER' | 'DECIMAL' | 'DURATION' | null;
  volumeInputUnits: string;
}

export function deserialiseDashboardReport(data: any): IDashboardReport {
  const { id, name, assessment_type_id, assessment_config_guid, library_set_guid, scoring_set_guid, report_type, scoring_method, self_assessment, ...rest } = data;
  return {
    id: data.id,
    name: data.name,
    reportType: report_type || '',
    assessmentType: assessment_type_id || '',
    assessmentConfig: assessment_config_guid || '',
    // scoringSet: scoring_set_guid || '',
    librarySet: scoring_method === 1 ? library_set_guid || '' : '', // only actually need a library set if scoring method = filtered (fix for APP-1394)
    selfAssessment: self_assessment || 0,
    scoringMethod: !library_set_guid ? 0 : scoring_method || 0,     // and if no library set assume standard not filtered
    params: rest
  };
}
export function deserialiseDashboardReportMap(arrayData: any): IDashboardReportMap {
  try {
    const map: IDashboardReportMap = {};
    (arrayData || []).forEach((data: any) => {
      const report: IDashboardReport = deserialiseDashboardReport(data);
      // logger('DESERIALISE REPORT', report.name, {data, report});
      map[report.id] = report;
    });
    // logger('/// deserialiseDashboardReportMap', map);
    return map;
  } catch (err) {
    ErrorService.logError('Exception in deserialising dashboard reports', err);
    throw err;
  }
}
export function deserialiseDashboardArray(report: IDashboardReport, arrayData: any, page: number, pageSize: number): { rows: IDashboardRow[], groups: string[] } {
  const rows: IDashboardRow[] = (arrayData || []).map((data, index) => deserialiseDashboardRow(report, data, ((page - 1) * pageSize) + index));
  // if not based on a library set build the groups we can filter by (old-style)
  const groups: string[] = [];
  if (/*!report.librarySet &&*/ report.scoringMethod === 0 && page === 1) {
    rows.forEach((r) => {
      Object.values(r.cells).forEach((c: IDashboardAssessment[]) => {
        c.forEach((a: IDashboardAssessment) => {
          a.levels.forEach((g: IDashboardLevel) => {
            if (groups.indexOf(g.name) === -1) {
              groups.push(g.name);
            }
          });
        });
      });
    });
  }
  return { rows, groups };
}
export function deserialiseDashboardRow(report: IDashboardReport, data: any, index: number): IDashboardRow {
  // logger('deserialiseDashboardRow', data.display_name, data);
  const row: IDashboardRow = {
    userId: data.id,
    displayName: data.display_name || '',
    profileImagePath: data.profile_image_path || '',
    // assessments: (data.competency_reviews || []).map((rdata) => deserialiseHeatMapAssessment(rdata)),
    cells: {},
    index
  };
  (data.competency_reviews || []).forEach((rdata) => {
    const ass = deserialiseDashboardAssessment(report, rdata);
    // logger('. ', ass.columnName, {rdata, ass});
    row.cells[ass.columnName] = (row.cells[ass.columnName] || []).concat(ass);
  });
  return row;
}
export function deserialiseDashboardAssessment(report: IDashboardReport, data: any): IDashboardAssessment {
  const scoresStep = (data.review_steps || []).find((d) => d.template === 'assessment');
  // logger('. STEP ', scoresStep, data.review_steps);
  let levels: IDashboardLevel[] = [];
  if (report.scoringMethod === 0 || !report.librarySet) {
    levels = (data?.review_groups || []).map((gdata) => deserialiseDashboardAssessmentLevel(gdata, 'group'));
  } else {
    // build based on the lowest level returned
    (data?.review_groups || []).forEach((gdata) => {
      if (!gdata.review_dimensions) {
        levels.push(deserialiseDashboardAssessmentLevel(gdata, 'group'));
      } else {
        (gdata?.review_dimensions || []).forEach((ddata) => {
          if (!ddata.review_expressions) {
            levels.push(deserialiseDashboardAssessmentLevel(ddata, 'dimension'));
          } else {
            (ddata?.review_expressions || []).forEach((edata) => {
              levels.push(deserialiseDashboardAssessmentLevel(edata, 'expression'));
            });
          }
        });
      }
    });
  }
  return {
    assessmentGuid: data.guid || '',
    state: data.state || 0,
    scoresStatus: (scoresStep || {}).status || 0,
    selfAssessment: data.self_assessment || 0,
    columnName: data.name || data?.actual_config?.title || '',
    configGuid: data?.actual_config?.guid || '',
    reviewerScore: Number.parseFloat(data?.overall_score) || null,
    revieweeScore: Number.parseFloat(data?.reviewee_overall_score) || null,
    filteredReviewerScore: Number.parseFloat(data?.filtered_overall_score) || null,
    filteredRevieweeScore: Number.parseFloat(data?.filtered_reviewee_overall_score) || null,
    rangeListId: data?.range_list_id || null,
    levels
  };
}
export function deserialiseDashboardAssessmentLevel(data: any, level: 'group' | 'dimension' | 'expression'): IDashboardLevel {
  const customInput = data.hasOwnProperty('volume_score');
  return {
    name: data?.group?.title || data?.dimension?.title || data?.expression?.title || '',
    guid: data.group_guid || data.dimension_guid || data.expression_guid || '',
    reviewerScore: Number.parseFloat(data?.score || 0) || Number.parseFloat(data?.normalised_score || 0) || null,
    revieweeScore: Number.parseFloat(data?.reviewee_score || 0) || Number.parseFloat(data?.reviewee_normalised_score) || null,
    filteredReviewerScore: Number.parseFloat(data?.filtered_normalised_score) || Number.parseFloat(data?.filtered_score) || Number.parseFloat(data?.filtered_review_score) || Number.parseFloat(data?.score) || null,
    filteredRevieweeScore: Number.parseFloat(data?.filtered_normalised_reviewee_score) || Number.parseFloat(data?.filtered_reviewee_score) || Number.parseFloat(data?.filtered_reviewee_normalised_score) || Number.parseFloat(data?.reviewee_score) || null,
    volumeInput: customInput ? (Number.parseFloat(data.volume_score) || null) : null,
    volumeInputType: customInput ? (data[level]?.input_type || null) : null,
    volumeInputUnits: customInput ? (data[level]?.units || '') : ''
  };
}
// filtered_normalised_score