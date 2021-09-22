import React from 'react';
import { connect } from 'react-redux';
// import { getMyLibrary } from 'appstate/evidence/actions';
import { savePreferences } from 'appstate/auth/actions';
import { IState } from 'appstate';
import { logger } from 'services/logger';
import ScoringChart from './ScoringChart';
import { makeGetAssessmentTree } from 'appstate/assessments/selectors';
import { IAssessmentHeader, XAssessmentDetail, XGroup, XDimension } from 'appstate/assessments/models';
import Util from 'services/Util';
import { selectAssessmentReport, getAssessment, getHistoricalAssessments } from 'appstate/assessments/actions';
import Analytics from 'services/Analytics';
import _ from 'lodash';

interface Props {
  navigation: any;
  startingAssessment: IAssessmentHeader; // will be supplied by parent
  // startingGroup?: XGroup; // start at group. If undefined will show across all groups
  // startingDimension?: XDimension; // start at drilled-in dimension.
  reportAssessmentGuid: string; // assessment to report upon, fed in via redux
  // reportAssessmentIndex: string; // assessment to report upon, fed in via redux
  assessmentDetail: XAssessmentDetail; // deserialised detail will be fed in via redux
  selectAssessmentReport: typeof selectAssessmentReport;
  getAssessment: typeof getAssessment;
  getHistoricalAssessments: typeof getHistoricalAssessments;
  preferences: any;
  savePreferences: typeof savePreferences;
}
interface State {
  sortedHeaders: IAssessmentHeader[];
  loading: boolean;
}

/**
 * When ScoringChart used for assessment level summary, this container supports navigation across multiple assessments
 * @class ScoringChartContainer
 * @extends {React.Component<Props, State>}
 */
class ScoringChartContainer extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    const startingHeaders: IAssessmentHeader[] = [];
    startingHeaders.push(props.startingAssessment);
    this.state = { loading: false, sortedHeaders: startingHeaders };
    // logger('//// ScoringChartContainer CTR', props);
  }

  UNSAFE_componentWillMount() {
    // logger('//// ScoringChartContainer componentWillMount props', this.props);
    if (this.props.reportAssessmentGuid === '') {
      // logger('not ready');
      return;
    }

    // fetch all headers for this coach
    // logger('(1) fetchHistoricalAssessments');
    this.fetchHistoricalAssessments(this.props.startingAssessment.coachId);

    // and refetch detail for this assessment if stale
    if (this.props.assessmentDetail && Util.isStale(this.props.assessmentDetail)) {
      // logger('(2) fetchAssessment', this.props.assessmentDetail.assessmentGuid);
      const pos: number = this.state.sortedHeaders.findIndex((ass: IAssessmentHeader) => ass.guid === this.props.reportAssessmentGuid);
      if (pos > -1) {
        this.fetchAssessment(this.state.sortedHeaders[pos]);
      }
    }
  }

  UNSAFE_componentWillReceiveProps(newProps: Props) {
    // logger('//// ScoringChartContainer CWRP', newProps);
    if (newProps.reportAssessmentGuid !== this.props.reportAssessmentGuid) { // detect change of assessment (on navigating prev/next)
      if (Util.isStale(newProps.assessmentDetail, 180)) { // refresh less often on step-thru?
        const pos: number = this.state.sortedHeaders.findIndex((ass: IAssessmentHeader) => ass.guid === newProps.reportAssessmentGuid);
        if (pos > -1) {
          this.fetchAssessment(this.state.sortedHeaders[pos]);
        }
      }
      // LayoutAnimation.configureNext(this.CustomLayoutLinear);
    }
  }

  componentDidMount() {
    Analytics.logScreen('ScoringChart');
  }

  async fetchHistoricalAssessments(coachId: number) {
    try {
      // logger('//// ScoringChartContainer fetchHistoricalAssessments', coachId);
      this.setState({ loading: true });
      let res: any = await this.props.getHistoricalAssessments(coachId, this.props.assessmentDetail.assessmentTypeId, this.props.assessmentDetail.configGuid, coachId === Util.GetMyID() ? Util.screenUrlMy(1) : Util.screenUrl(1));
      // if from a course form submission (evidence item) must filter by same course topic/item
      if (!!this.props.startingAssessment && !!this.props.startingAssessment.courseId) {
        // eslint-disable-next-line eqeqeq
        res = res.filter((ass: IAssessmentHeader) => ass.courseId == this.props.startingAssessment.courseId && (ass.moduleId || '0') == (this.props.startingAssessment.moduleId || '0') && (ass.topicId || '0') == (this.props.startingAssessment.topicId || '0') && (ass.itemId || '0') == (this.props.startingAssessment.itemId || '0') && (ass.buttonNumber || 0) == (this.props.startingAssessment.buttonNumber || 0));
        res = _.sortBy(res, ['openDate']); // standard query by due date will not work for these assessments, must post-sort by openDate (start_date in backend)
      }
      // logger('====', res, this.state.sortedHeaders, res.length > 0);
      this.setState({ loading: false, sortedHeaders: res.length > 0 ? res : this.state.sortedHeaders });
    } catch (err) {
      // logger('fetchHistoricalAssessments failure in component', err);
      this.setState({ loading: false });
      // Toast.showError($labels.ASSESSMENTS.FETCH_FAILURE);
    }
  }

  async fetchAssessment(assessmentHeader: IAssessmentHeader) {
    try {
      // logger('//// ScoringChartContainer fetchAssessment', assessmentId);
      this.setState({ loading: true });
      const res = await this.props.getAssessment(assessmentHeader.guid);
      this.setState({ loading: false });
    } catch (err) {
      // logger('fetchAssessment failure in component', err);
      this.setState({ loading: false });
      // Toast.showError($labels.ASSESSMENTS.FETCH_FAILURE);
    }
  }

  goPrevious() {
    const pos: number = this.state.sortedHeaders.findIndex((ass: IAssessmentHeader) => ass.guid === this.props.reportAssessmentGuid);
    this.props.selectAssessmentReport(this.state.sortedHeaders[pos - 1].guid);
  }
  goNext() {
    const pos: number = this.state.sortedHeaders.findIndex((ass: IAssessmentHeader) => ass.guid === this.props.reportAssessmentGuid);
    this.props.selectAssessmentReport(this.state.sortedHeaders[pos + 1].guid);
  }

  render() {
    // logger('//// ScoringChartContainer render', this.props);
    // const hdr: IAssessmentHeader | undefined = this.props.sortedHeaders.find((ass: IAssessmentHeader) => ass.guid === this.props.reportAssessmentGuid);
    const pos: number = this.state.sortedHeaders.findIndex((ass: IAssessmentHeader) => ass.guid === this.props.reportAssessmentGuid);
    if (pos === -1 || !this.props.assessmentDetail) {
      return null;
    }
    // logger('#' + pos);
    const hdr: IAssessmentHeader = this.state.sortedHeaders[pos];
    return (
      <ScoringChart
        // navigation={this.props.navigation}
        assessmentHeader={hdr}
        assessmentDetail={this.props.assessmentDetail}
        // group={this.props.startingGroup}
        // dimension={this.props.startingDimension}
        showNavigation={this.state.sortedHeaders.length > 1}
        onPrevious={pos === 0 ? undefined : this.goPrevious.bind(this)}
        onNext={pos === this.state.sortedHeaders.length - 1 ? undefined : this.goNext.bind(this)}
        preloading={this.state.loading}
        preferences={this.props.preferences}
        onSetPreferences={(prefs) => this.props.savePreferences(prefs)}
      />
    );
  }
}

const mapDispatchToProps = {
  // getMyLibrary,
  selectAssessmentReport,
  getAssessment,
  getHistoricalAssessments,
  savePreferences
};

const mapStateToProps = (state: IState, ownProps: Props) => {
  const getAssessmentTree = makeGetAssessmentTree();
  return {
    // reportAssessmentIndex: state.assessments.reportAssessmentIndex,
    reportAssessmentGuid: state.assessments.reportAssessmentGuid,
    assessmentDetail: getAssessmentTree(state, state.assessments.reportAssessmentGuid),
    preferences: state.auth.userPreferences[state.auth.id] || {}
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ScoringChartContainer);
