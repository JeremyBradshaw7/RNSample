import React from 'react';
import { View, Text, ScrollView, Platform, TouchableOpacity, Dimensions } from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import { XAssessmentDetail, XGroup, XDimension, IExpression, IAssessmentHeader } from 'appstate/assessments/models';
import { logger } from 'services/logger';
import ScreenInfo from 'services/ScreenInfo';
import Util from 'services/Util';
import { $labels } from 'services/i18n';
import ScreenSpinner from './../ScreenSpinner';
import Theme from 'services/Theme';
// import { Icon } from 'native-base';
import { commonStyles } from 'styles/common';
import RoundButton from '../RoundButton';
import _ from 'lodash';
import { withNavigation } from 'services/Nav';
import { isIphoneX, ifIphoneX } from 'react-native-iphone-x-helper';
import ColourPicker from '../ColourPicker';
import { ChartJSChart } from './ChartJSChart';
import { savePreferences } from 'appstate/auth/actions';
import { Icon } from 'native-base';
// import LinkButton from '../LinkButton';

interface Props {
  navigation: any;
  assessmentHeader: IAssessmentHeader;
  assessmentDetail: XAssessmentDetail;
  // group?: XGroup; // start at group. We don't do this any more.
  // dimension?: XDimension; // start at drilled-in dimension. We don't do this any more
  preloading?: boolean;
  showNavigation?: boolean;
  onPrevious?: Function;
  onNext?: Function;
  preferences: any; // user prefs come through here
  onSetPreferences: typeof savePreferences;
}
interface State {
  actualEnabled: boolean;
  selfEnabled: boolean;
  targetEnabled: boolean;

  actual: boolean; // show Actuals (assessor score) - whether the option is ticked
  self: boolean;   // show Self-Assessment (if SA on)
  target: boolean; // show Targets (if targets at dim|exp level)

  nodes: INode[];

  loading: boolean;
  max: number;
  // animate: boolean; // turn on when dimensions are same as previous, since changing labels do not animate well!
  dimension?: XDimension; // dimension, when drilled down to dimension
  orientation: string;

  pickSelf: boolean; // whether color picker is enabled for self
  pickAssessor: boolean; // and assessor
  pickTarget: boolean; // and target
  zoomed: boolean;
}

export interface INode {
  index: number;
  shortLabel: string;
  element: XDimension | IExpression | null;
}

class ScoringChart extends React.Component<Props, State> {

  private backgroundShade: string = Theme.blue900;
  private defaultSelfShade = 'rgb(186, 85, 211)'; // MUST be in rgb or # form, NOT a named color
  private defaultAssessorShade = 'rgb(218, 165, 32)';
  private defaultTargetShade = 'rgb(23,123,201)';
  // ref https://www.w3schools.com/colors/colors_converter.asp
  private preferences = {
    selfScoreShade: this.defaultSelfShade,
    assessorScoreShade: this.defaultAssessorShade,
    targetShade: this.defaultTargetShade,
    chartType: 'radar'
  };

  // private timer: any = null;
  // private labelScrollPos = 0;

  constructor(props: Props) {
    super(props);
    // logger('--- ScoringChart ctr', props);
    const targets = Util.hasDetailTargets(props.assessmentDetail) && Util.canViewTargets(props.assessmentDetail, Util.GetMyID() === props.assessmentHeader.coachId);
    this.state = {
      // width: 0, height: 0,
      // coachScores: [], assessorScores: [], labels: [],
      pickSelf: false, pickAssessor: false, pickTarget: false,
      nodes: [],
      loading: false,
      max: 10, // animate: false,
      dimension: undefined, // props.dimension,
      orientation: this.getOrientation(),
      actualEnabled: props.assessmentHeader.selfAssessment < 2 && Util.canViewAssessorScores(props.assessmentDetail, Util.GetMyID() === props.assessmentHeader.coachId),
      selfEnabled: props.assessmentHeader.selfAssessment > 0,
      targetEnabled: targets,
      actual: props.assessmentHeader.selfAssessment < 2,
      self: props.assessmentHeader.selfAssessment > 0,
      target: targets,
      zoomed: false
    };
    this.preferences = {
      ...this.preferences,
      ...this.props.preferences // need these to override defaults IF SET
    };
    // logger('INITIAL PREFS', this.preferences);
    // this._retrievePrefs();
  }

  getOrientation() {
    return ScreenInfo.isLandscape() ? 'L' : 'P';
  }
  componentDidMount() {
    // logger('--- ScoringChart cdm', this.props);
    this.makeData(this.props.assessmentDetail);
    Dimensions.addEventListener('change', this.onScreenResize);
  }
  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.onScreenResize);
  }
  onScreenResize = (data) => {
    this.setState({ orientation: this.getOrientation()});
  };

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    // logger('--- ScoringChart cwrp', nextProps);
    // logger('NEW PREFS', nextProps.preferences); // don't need to set since will be === this.preferences anyway
    if (this.props.assessmentDetail.guid !== nextProps.assessmentDetail.guid) {
      // logger('/// change of assessment detail', nextProps.assessmentDetail.targetMethod);
      this.setState({
        selfEnabled: nextProps.assessmentHeader.selfAssessment > 0,
        targetEnabled: Util.hasDetailTargets(nextProps.assessmentDetail) && Util.canViewTargets(nextProps.assessmentDetail, Util.GetMyID() === nextProps.assessmentHeader.coachId),
        actualEnabled: nextProps.assessmentHeader.selfAssessment < 2 && Util.canViewTargets(nextProps.assessmentDetail, Util.GetMyID() === nextProps.assessmentHeader.coachId)
      });

      if (!!this.state.dimension) {
        // if we've drilled down to a Dimension must find same Dimension (by name) in new assessment
        let fdim: XDimension | undefined;
        nextProps.assessmentDetail.data.forEach((grp: XGroup) => {
          fdim = fdim || grp.data.find((dim: XDimension) => this.state.dimension && dim.title === this.state.dimension.title);
        });
        this.setState({ dimension: fdim }); // set even if undefined, means it goes back up to root level if it cannot find same dimension by name
      }

      this.makeData(nextProps.assessmentDetail);
    }
  }

  genKey(i: number): string {
    // 1,2,... => a,b,c,...,z,A,B,C,...,Z,1,2,...
    if (i > 52) {
      return (i - 52).toString() + '.';
    }
    return String.fromCharCode((i <= 26 ? 96 : 38) + i) + '.';
  }

  makeData(assessmentDetail: XAssessmentDetail) {
    // logger('ScoringChart makeData!!!!!!!', assessmentDetail, this.state.dimension);
    if (!assessmentDetail) {
      return;
    }
    const nodes: INode[] = [];
    let i = 0;

    assessmentDetail.data.forEach((grp: XGroup) => {
      // if (!this.props.group || grp.title === this.props.group.title) {
      grp.data.forEach((dim: XDimension) => {
        if (!!this.state.dimension) { // we are at dimension level
          if (dim.title === this.state.dimension.title) {
            dim.data.forEach((exp: IExpression) => {
              if (this.props.assessmentHeader.completeAllScores || exp.selfScore || exp.assessorScore) {
                i++;
                const label = this.genKey(i);
                nodes.push({ index: i, shortLabel: label, element: exp });
              }
            });
          }
        } else {
          if (this.props.assessmentHeader.completeAllScores || dim.selfScore || dim.assessorScore) {
            i++;
            nodes.push({ index: i, shortLabel: this.genKey(i), element: dim });
          }
        }
      });
      // }
    });

    // charts break with one node - add blank one so that something is plotted
    if (i === 1) {
      i++;
      nodes.push({ index: i, shortLabel: ' ', element: null });
    }

    // const anim = _.isEqual(labeldata, prevLabelData);
    this.setState({
      max: Util.maxVal(assessmentDetail),
      nodes
    });

    setTimeout(() => {
      this.setState({ loading: false });
    }, 0);
    // logger('i', i);
    // logger('made data', nodes);
  }

  selectDimension(dim: XDimension) {
    if (!!dim && dim.expressions.length > 0) {
      this.setState({ dimension: dim, loading: true }, () => {
        this.makeData(this.props.assessmentDetail);
      });
    }
  }

  goBack() {
    if (!this.state.dimension /* || this.props.dimension */) {
      this.props.navigation.goBack();
    } else {
      // back to assessment/group level
      this.setState({ dimension: undefined, loading: true }, () => {
        this.makeData(this.props.assessmentDetail);
      });
    }
  }

  switchChart() {
    this.preferences.chartType = this.preferences.chartType === 'radar' ? 'line' : this.preferences.chartType === 'line' ? 'bar' : 'radar'; // cycle
    // logger('SWITCH CHART', this.preferences);
    this.savePreferences();
  }

  touchNode(n: INode) {
    this.selectDimension(n.element as XDimension);
  }

  goUp() {
    this.setState({ dimension: undefined, loading: true }, () => {
      this.makeData(this.props.assessmentDetail);
    });
  }

  tableHeader() {
    if (this.state.dimension) {
      // if (!this.props.dimension) {
      // DRILLED DOWN DIMENSION: we drilled down into dimension, so offer UP icon
      return (
        <View style={styles.keyTableHeaderContainer}>
          <View style={commonStyles.row}>
            <RoundButton small radius={8} height={24} transparent iconName='level-up' style={styles.keyUp} onPress={() => this.goUp()} />
            <Text style={[styles.keyTableHeader, { alignSelf: 'center' }]}>{this.state.dimension.title}</Text>
          </View>
          {/* {this.renderColourBand(false)} */}
        </View>
      );
    }
    return null;
  }

  renderGroupHeader(groupGuid: string) {
    const grp: XGroup = this.props.assessmentDetail.data.find((g: XGroup) => g.guid === groupGuid);
    return !grp ? null : (
      <View style={styles.keyGroup}>
        <Text style={styles.keyGroupText}>{grp.title.toUpperCase()}</Text>
        {/* {this.renderColourBand(grp.data.length > 0 && grp.data[0].expressions.length > 0)} */}
      </View>
    );
  }
  renderGroupFooter(groupGuid: string) {
    const grp: XGroup = this.props.assessmentDetail.data.find((g: XGroup) => g.guid === groupGuid);
    if (grp.data.length <= 1) {
      return <View style={{ marginTop: -6 }} />;
    }
    const drilldown = grp.data.length > 0 && grp.data[0].data.length > 0;
    return !grp ? null : (
      <View style={styles.keyFooterRow}>
        <Text style={styles.footerLabel}>{$labels.CHARTS.GROUP_SUMMARY}</Text>
        <Text style={styles.keyIndex} />
        {drilldown && <Text style={styles.keyIcon} />}
        {this.state.actualEnabled && this.state.actual && this.renderCell(grp.assessorScore, this.preferences.assessorScoreShade)}
        {this.state.selfEnabled && this.state.self && this.renderCell(grp.selfScore, this.preferences.selfScoreShade)}
        {this.state.targetEnabled && this.state.target && this.renderCell(grp.target, this.preferences.targetShade)}
        {this.state.targetEnabled && this.state.target && this.percentageOfTarget(grp)}
      </View>
    );
  }
  renderDimensionFooter() {
    return !this.state.dimension ? null :
      this.state.dimension.expressions.length <= 1 ? <View style={{ marginTop: -6 }} /> : (
        <View style={styles.keyFooterRow}>
          <Text style={styles.footerLabel}>{$labels.CHARTS.DIMENSION_SUMMARY}</Text>
          <Text style={styles.keyIndex} />
          {this.state.actualEnabled && this.state.actual && this.renderCell(this.state.dimension.assessorScore, this.preferences.assessorScoreShade)}
          {this.state.selfEnabled && this.state.self && this.renderCell(this.state.dimension.selfScore, this.preferences.selfScoreShade)}
          {this.state.targetEnabled && this.state.target && this.renderCell(this.state.dimension.target, this.preferences.targetShade)}
          {this.state.targetEnabled && this.state.target && this.percentageOfTarget(this.state.dimension)}
        </View>
      );
  }

  // is value1 25% or more under value2 (and both defined)
  isSignificantlyUnder(value1: number | null, value2: number | null, scale: number = this.state.max) {
    if (value1 && value2 && scale && value1 <= value2 - (scale * 0.25)) {
      return true;
    }
    return false;
  }

  private lastGroupGuid: any;
  renderRows() {
    this.lastGroupGuid = null;
    return this.state.nodes ? this.state.nodes.map((n: INode) => this.renderRow(n)) : null;
  }
  percentageOfTarget(element: XGroup | XDimension | IExpression): any {
    if (this.state.actual && this.state.actualEnabled && this.state.self && this.state.selfEnabled) {
      return null; // cant show % of 2 values
    }
    if (!this.state.actual && !this.state.self) {
      return null; // cant show % of no values
    }
    let i;
    if (this.state.actual && this.state.actualEnabled) {
      i = element['assessorScore'] || 0;
    } else if (this.state.self && this.state.selfEnabled) {
      i = element['selfScore'] || 0;
    }
    const pc: number = !element.target ? 0 : Math.round((i * 100) / element.target);
    const val = !element.target ? '—' : pc.toString() + '%';
    return <Text style={[styles.keyPC, pc < 100 && { color: 'indianred' }, pc > 100 && { color: 'lightgreen' }]}>{val}</Text>;
  }
  renderCell(value: number | null, textColor: string, error: boolean = false) {
    return (
      <View style={styles.keyValueContainer}>
        <View style={[styles.keyValueInner, error && { borderBottomColor: 'red' }]}>
          <Text style={[
            styles.keyValue,
            { color: textColor }
          ]}>
            {Math.round(value || 0) || '—'}
          </Text>
        </View>
      </View>
    );
  }
  renderRow(n: INode) {
    if (!n.element) {
      return null;
    }
    const drillDown = !!n.element['expressions'] && n.element['expressions'].length > 0;
    const groupGuid = n.element['groupGuid']; // undefined if an expression
    const newGroup = (groupGuid && groupGuid !== this.lastGroupGuid);
    const lastGroup = this.lastGroupGuid;
    this.lastGroupGuid = groupGuid;
    return (
      <View key={n.index}>
        {newGroup && !!lastGroup && this.renderGroupFooter(lastGroup)}
        {newGroup && this.renderGroupHeader(groupGuid)}
        <View style={styles.keyRow}>
          <Text style={styles.keyIndex}>{n.shortLabel}</Text>
          <Text style={styles.keyLabel}>{n.element.title}</Text>

          {drillDown && <RoundButton small height={24} radius={8} transparent iconName='angle-right' style={styles.keyIcon} onPress={() => this.touchNode(n)} />}

          {this.state.actualEnabled && this.state.actual &&
            this.renderCell(n.element.assessorScore, this.preferences.assessorScoreShade,
              this.isSignificantlyUnder(n.element.assessorScore, n.element.selfScore))
          }

          {this.state.selfEnabled && this.state.self &&
            this.renderCell(n.element.selfScore, this.preferences.selfScoreShade,
              this.isSignificantlyUnder(n.element.selfScore, n.element.assessorScore))
          }

          {this.state.targetEnabled && this.state.target &&
            this.renderCell(n.element.target, this.preferences.targetShade)
          }

          {this.state.targetEnabled && this.state.target && this.percentageOfTarget(n.element)}

        </View>
      </View>
    );
  }

  resetColors() {
    this._resetShades();
  }
  cancelColor() {
    this.setState({ pickSelf: false, pickAssessor: false, pickTarget: false });
  }

  pickColor(col) {
    // logger(col);
    if (this.state.pickSelf) {
      this.preferences.selfScoreShade = col;
    } else if (this.state.pickAssessor) {
      this.preferences.assessorScoreShade = col;
    } else if (this.state.pickTarget) {
      this.preferences.targetShade = col;
    }
    // logger('SET COLOR', this.preferences);
    this.setState({
      pickSelf: false,
      pickAssessor: false,
      pickTarget: false
    });
    this.savePreferences();
  }

  savePreferences() {
    // logger('SAVE PREFS!!!!!!!!!!!!', this.preferences);
    this.props.onSetPreferences(this.preferences);
  }

  _resetShades = async () => {
    this.preferences.selfScoreShade = this.defaultSelfShade;
    this.preferences.assessorScoreShade = this.defaultAssessorShade;
    this.preferences.targetShade = this.defaultTargetShade;
    // logger('RESET SHADES', this.preferences);
    this.savePreferences();
    this.setState({
      pickSelf: false,
      pickAssessor: false,
      pickTarget: false
    });
  };

  render() {
    // logger('ScoringChart render', this.props, this.preferences);
    const landscape = this.state.orientation === 'L'; // ScreenInfo.isLandscape();
    // const showValues = true; // ScreenInfo.isTabletLandscapeMode() && !this.state.animate; // value labels do not animate with the chart!
    const tableRows = this.renderRows();
    // calculate width & height of chart container assuming 3:2 ratio with table and room for header
    const width = landscape ? ScreenInfo.Width() * 0.6 : ScreenInfo.Width();
    // ios/android need adjustments to work out height:
    const height = landscape ? ScreenInfo.Height() - (Platform.OS === 'ios' ? 60 : 86) - 40
      : (ScreenInfo.Height() - (isIphoneX() ? 70 : 60)) * (Platform.OS === 'ios' ? 0.6 : 0.58) - 40; // account for header & footer
    // logger('render ScoringChart', this.props, this.state, width + 'x' + height,
    //   'LOADING=' + this.state.loading + '/' + !!this.props.preloading, 'MAX=' + this.state.max); // , this.state.coachScores);
    const title = Util.getAssessmentCoachName(this.props.assessmentHeader);
    const subtitle =
      (landscape && !!this.props.assessmentHeader.role ? this.props.assessmentHeader.role + ' | ' : '') +
      Util.formatDateRange(this.props.assessmentHeader.startDate, this.props.assessmentHeader.dueDate);
    const preferences = this.preferences;

    return (
      <View
        style={[
          { flex: 1, backgroundColor: this.backgroundShade }
        ]}
      >
        <View style={styles.header}>
          <Text style={landscape ? styles.title : styles.subtitle}>{title}</Text>
          <Text style={landscape ? styles.subtitle : styles.subsubtitle}>{subtitle}</Text>
        </View>

        <View style={{ flex: 1, flexDirection: landscape ? 'row' : 'column' }}>

          {/* The chart */}
          <View style={[
            { flex: 3 }
            // , __DEV__ && { borderWidth: 0.5, borderColor: 'magenta' }
          ]}>
            <View style={[
              { flex: 1, borderWidth: 1, borderColor: Theme.blue900 } // to remove RH black line on tablet
              // , __DEV__ && { flex: 0, width, height, borderWidth: 1, borderColor: Theme.blue200 }
            ]}>
              <ChartJSChart
                chartType={this.preferences.chartType as 'radar' | 'line' | 'bar'}
                actual={this.state.actualEnabled && this.state.actual} self={this.state.selfEnabled && this.state.self} target={this.state.targetEnabled && this.state.target}
                guid={this.props.assessmentDetail.guid}
                width={width} height={height}
                selfScoreShade={preferences.selfScoreShade} assessorScoreShade={preferences.assessorScoreShade} targetShade={preferences.targetShade}
                nodes={this.state.nodes}
                max={this.state.max}
                zoomed={this.state.zoomed}
              />
            </View>

            {/* The Legend, with colour pickers */}
            <View style={[commonStyles.row, { height: 40, padding: 5, marginLeft: 5 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                {this.state.actualEnabled && <TouchableOpacity style={commonStyles.row}
                  onPress={() => this.setState({ actual: !this.state.actual })}
                  onLongPress={() => this.setState({ pickAssessor: true })}
                >
                  <View style={{ borderColor: preferences.assessorScoreShade, borderWidth: 1, marginRight: 5 }}>
                    {this.state.actual && <Icon type='FontAwesome' name='check' style={[styles.legendTick, { color: preferences.assessorScoreShade }]} />}
                    <View style={[styles.legendBox, { backgroundColor: preferences.assessorScoreShade }]} />
                  </View>
                  <Text style={styles.legendLabel}>{$labels.CHARTS.ASSESSOR_SCORES}</Text>
                </TouchableOpacity>}

                {this.state.selfEnabled && <TouchableOpacity style={commonStyles.row}
                  onPress={() => this.setState({ self: !this.state.self })}
                  onLongPress={() => this.setState({ pickSelf: true })}
                >
                  <View style={{ borderColor: preferences.selfScoreShade, borderWidth: 1, marginRight: 5 }}>
                    {this.state.self && <Icon type='FontAwesome' name='check' style={[styles.legendTick, { color: preferences.selfScoreShade }]} />}
                    <View style={[styles.legendBox, { backgroundColor: preferences.selfScoreShade }]} />
                  </View>
                  <Text style={styles.legendLabel}>{$labels.CHARTS.COACH_SCORES}</Text>
                </TouchableOpacity>}

                {this.state.targetEnabled && <TouchableOpacity style={commonStyles.row}
                  onPress={() => this.setState({ target: !this.state.target })}
                  onLongPress={() => this.setState({ pickTarget: true })}
                >
                  <View style={{ borderColor: preferences.targetShade, borderWidth: 1, marginRight: 5 }}>
                    {this.state.target && <Icon type='FontAwesome' name='check' style={[styles.legendTick, { color: preferences.targetShade }]} />}
                    <View style={[styles.legendBox, { backgroundColor: preferences.targetShade }]} />
                  </View>
                  <Text style={styles.legendLabel}>{$labels.CHARTS.TARGET}</Text>
                </TouchableOpacity>}

                {/* {this.state.showReset && <RoundButton small transparent label={$labels.COMMON.RESET} onPress={() => this._resetShades()} />} */}
              </View>

              <View style={commonStyles.fill} />

              <View style={{ flexDirection: 'row' }}>
                {this.props.showNavigation &&
                  <RoundButton small radius={8} transparent iconName='arrow-left' style={styles.nextprev} disabled={!this.props.onPrevious} onPress={() => {
                    if (this.props.onPrevious) {
                      // this.setState({ dimension: undefined });
                      this.props.onPrevious();
                    }
                  }} />}
                {this.props.showNavigation &&
                  <RoundButton small radius={8} transparent iconName='arrow-right' style={styles.nextprev} disabled={!this.props.onNext} onPress={() => {
                    if (this.props.onNext) {
                      // this.setState({ dimension: undefined });
                      this.props.onNext();
                    }
                  }} />}
                <RoundButton small radius={8} transparent iconName={this.state.zoomed ? 'expand' : 'compress'} style={styles.nextprev} onPress={() => {
                  this.setState({ zoomed: !this.state.zoomed });
                }} />
              </View>
            </View>

            <ScreenSpinner semiOpaque visible={this.state.loading || !!this.props.preloading} overlay={false} style={{ marginTop: -25, marginLeft: 0 }} />
          </View>

          {/* The data table */}
          <View style={{ flex: 2 }}>
            <ScrollView style={styles.keyTable}>
              <View style={{ flex: 2, paddingHorizontal: 10, paddingVertical: 4 }}>
                {this.tableHeader()}
                {tableRows}
                {this.lastGroupGuid && this.renderGroupFooter(this.lastGroupGuid)}
                {this.state.dimension && this.renderDimensionFooter()}
              </View>
            </ScrollView>
          </View>
        </View>

        <View style={styles.headerOverlay}>
          <RoundButton iconName='chevron-left' type='FontAwesome' radius={8} transparent style={{ marginLeft: 10 }} onPress={() => this.goBack()} />
          <View style={commonStyles.fill} />
          <RoundButton radius={8} transparent
            iconName={preferences.chartType === 'radar' ? 'area-chart' : preferences.chartType === 'bar' ? 'pie-chart' : 'bar-chart'}
            style={{ marginRight: 10 }} textStyle={{ color: preferences.assessorScoreShade }}
            onPress={() => this.switchChart()} />
        </View>

        <ColourPicker
          visible={this.state.pickSelf || this.state.pickAssessor || this.state.pickTarget}
          color={this.state.pickSelf ? preferences.selfScoreShade : this.state.pickAssessor ? preferences.assessorScoreShade : preferences.targetShade}
          backColor={Theme.blue800}
          onColorSelected={this.pickColor.bind(this)}
          onCancel={this.cancelColor.bind(this)}
          onReset={this.resetColors.bind(this)}
          resetLabel={this.preferences.assessorScoreShade !== this.defaultAssessorShade ||
            this.preferences.selfScoreShade !== this.defaultSelfShade ||
            this.preferences.targetShade !== this.defaultTargetShade ? $labels.CHARTS.RESET_COLORS : ''}
        />
      </View >
    );
  }
}

const styles: any = EStyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: Theme.blue800,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...ifIphoneX({
      paddingTop: 30,
      height: 70
    }, {})
  },
  title: {
    color: 'white',
    fontSize: 18
  },
  subtitle: {
    color: 'whitesmoke',
    fontSize: 14
  },
  subsubtitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12
  },
  nextprev: {
  },
  headerOverlay: {
    flexDirection: 'row',
    position: 'absolute',
    top: 10,
    left: 0,
    ...ifIphoneX({
      top: 26
    }, {})
  },
  buttons: {
    backgroundColor: Theme.hiliteMid
  },
  legendLabel: { color: 'lightgray', marginRight: 14, fontSize: 11, alignSelf: 'center' },
  legendTick: { fontSize: 12, height: 20, paddingTop: 4, paddingLeft: 4, marginBottom: -20 },
  legendBox: { width: 20, height: 20, opacity: 0.15 },
  keyTable: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    margin: 10,
    borderRadius: 10
  },
  keyUp: {
    marginRight: 6,
    // marginLeft: -4,
    transform: [{ rotateY: '180deg' }] // mirror
  },
  keyTableHeaderContainer: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: Theme.blue700,
    // marginTop: -4,
    marginHorizontal: -10
  },
  keyTableHeader: {
    fontSize: 14,
    paddingTop: 2,
    color: 'khaki',
    fontWeight: 'bold'
  },
  keyGroup: {
    backgroundColor: Theme.blue700,
    marginHorizontal: -10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4
  },
  keyGroupText: {
    fontSize: 14,
    color: 'khaki'
  },
  keyRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderBottomWidth: EStyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.3)'
  },
  // keyRowLine: {
  //   marginTop: 3,
  //   height: 1 // EStyleSheet.hairlineWidth,
  //   // backgroundColor: 'rgba(255,255,255,0.2)'
  // },
  keyIndex: {
    color: 'lightsteelblue',
    width: 20,
    fontSize: ScreenInfo.isTablet() ? 14 : 12,
    alignSelf: 'center'
  },
  // keyIndexWidth: {
  //   width: 20
  // },
  keyLabel: {
    color: 'whitesmoke',
    fontSize: ScreenInfo.isTablet() ? 14 : 12,
    flex: 1,
    alignSelf: 'center'
  },
  keyValueContainer: {
    width: 30,
    alignSelf: 'center'
  },
  keyValueInner: {
    alignSelf: 'flex-end',
    borderBottomColor: 'transparent',
    borderBottomWidth: 1
  },
  keyValue: {
    color: 'lightsteelblue',
    fontSize: ScreenInfo.isTablet() ? 14 : 12,
    textAlign: 'right',
    alignSelf: 'center'
  },
  // keyValueWidth: {
  //   height: 1, // EStyleSheet.hairlineWidth,
  //   width: 29,
  //   marginHorizontal: EStyleSheet.hairlineWidth
  // },
  keyPC: {
    color: 'lightsteelblue',
    width: 40,
    fontSize: ScreenInfo.isTablet() ? 12 : 10,
    textAlign: 'right',
    alignSelf: 'center'
  },
  // keyPCWidth: {
  //   height: 1, // EStyleSheet.hairlineWidth,
  //   width: 39,
  //   marginHorizontal: EStyleSheet.hairlineWidth
  // },
  keyIcon: {
    width: 23,
    marginLeft: 8,
    marginRight: 0, // -2,
    paddingHorizontal: 8,
    alignSelf: 'center'
  },
  keyFooterRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 2
  },
  footerLabel: {
    flex: 1,
    fontSize: 12,
    color: '#999'
  },
  keyValueFooter: {
    color: '#999',
    fontSize: 12,
    textAlign: 'right',
    alignSelf: 'center'
  }
});

export default withNavigation(ScoringChart);