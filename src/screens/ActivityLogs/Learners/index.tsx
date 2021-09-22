import React from 'react';
import EStyleSheet from 'react-native-extended-stylesheet';
import { connect } from 'react-redux';
import { View, Text, ScrollView, Platform, TextInput } from 'react-native';
import { IState } from 'appstate';
import { getActivityLogLearners, getActivityLogNewLearners, addNewAtivityLogLearner, getActivityLogEstablishments, getActivityLogQualifications } from 'appstate/activityLogs/actions';
import Learners from './Learners';
import BackIcon from 'components/BackIcon';
import { logger } from 'services/logger';
import Theme from 'services/Theme';
import { commonStyles } from 'styles/common';
import ScreenInfo from 'services/ScreenInfo';
import { InModal } from 'components/InModal';
import { Wallpaper } from 'components/Wallpaper';
import { $labels } from 'services/i18n';
import Util from 'services/Util';
import Toast from 'services/Toast';
import { IEmsLearner } from 'appstate/activityLogs/models';
import { makeGetSortedLearners } from 'appstate/activityLogs/selectors';
import Learner from '../Learner';
import RoundButton from 'components/RoundButton';
import { RowView } from 'components/RowView';
import CodePicker, { IAnyMap } from 'components/CodePicker';
import { ICodeMap } from 'appstate/config/models';
import Anim from 'services/Anim';
import dotProp from 'dot-prop-immutable';
import HelpMenu from 'components/HelpMenu';
import Analytics from 'services/Analytics';
import SimpleHeader from 'components/SimpleHeader';

interface Props {
  sortedLearners: IEmsLearner[];
  navigation: any;
  route: any;
  getLearners: typeof getActivityLogLearners;
  getNewLearners: typeof getActivityLogNewLearners;
  addNewLearner: typeof addNewAtivityLogLearner;
  getActivityLogEstablishments: typeof getActivityLogEstablishments;
  getActivityLogQualifications: typeof getActivityLogQualifications;
}
interface State {
  loading: boolean;
  page: number;
  pagingEnd: boolean;
  total: number;
  hideHeaders: boolean;
  dualPane: boolean;
  currentLearnerIndex: number;
  addLearnerVisible: boolean;
  newLearners: IAnyMap;
  newLearnerSelected: IEmsLearner | null;
  createPrivilege: boolean;
  updatePrivilege: boolean;

  // filter state:
  filterShown: boolean;
  namePattern: string;
  classPattern: string;
  organisations: ICodeMap;
  selectedOrganisation: string;
  coursePattern: string;
  qualifications: ICodeMap;
  selectedQualification: string;
}

class LearnersContainer extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      page: 1,
      pagingEnd: false,
      total: 0,
      hideHeaders: false,
      dualPane: ScreenInfo.supportsDualPane(),
      currentLearnerIndex: -1,
      createPrivilege: true, // assume so until we know otherwise
      updatePrivilege: true, // ditto

      addLearnerVisible: false,
      newLearners: {},
      newLearnerSelected: null,

      filterShown: false,
      namePattern: '',
      classPattern: '',
      organisations: {},
      selectedOrganisation: '',
      coursePattern: '',
      qualifications: {},
      selectedQualification: ''
    };
  }

  UNSAFE_componentWillMount() {
    this.fetchLearnerLogs();
  }

  UNSAFE_componentWillReceiveProps() {
    Anim.EaseNext();
  }

  componentDidMount() {
    Analytics.logScreen('ActivityLogs.Learners');
  }
  async refresh() {
    await this.fetchLearnerLogs();
  }

  async nextPage() {
    if (!this.state.pagingEnd && !this.state.loading) {
      await this.fetchLearnerLogs(this.state.page + 1);
    }
  }

  async fetchLearnerLogs(page: number = 1) {
    try {
      this.setState({ loading: true, page });
      const pageResult: any = await this.props.getLearners(page, this.state.namePattern, this.state.classPattern, this.state.selectedOrganisation, this.state.coursePattern, this.state.selectedQualification); // , this.state.sort, this.props.savedCPDFilter);
      Anim.EaseNext();
      this.setState({
        loading: false,
        pagingEnd: pageResult.page >= pageResult.lastPage,
        total: pageResult.total,
        createPrivilege: !!dotProp.get(pageResult, 'extraData.activity_logs_create'),
        updatePrivilege: !!dotProp.get(pageResult, 'extraData.activity_logs_update')
      });
    } catch (err) {
      logger(err);
      this.setState({ loading: false });
      Toast.showError($labels.ACTIVITY_LOGS.FETCH_FAILURE);
    }
  }

  selectLearnerIndex(index: number, guid: string) {
    this.setState({ currentLearnerIndex: index });
    if (!this.state.dualPane) {
      this.props.navigation.navigate('LearnerNavigable', {
        sortedLearners: this.props.sortedLearners,
        currentLearnerIndex: index,
        createPrivilege: this.state.createPrivilege,
        updatePrivilege: this.state.updatePrivilege
      });
    }
  }

  // FILTER
  showFilter() {
    this.setState({ filterShown: true }, async () => {
      const organisations: any = await this.props.getActivityLogEstablishments();
      const qualifications: any = await this.props.getActivityLogQualifications();
      this.setState({ organisations, qualifications });
    });
  }
  onSelectOrganisation(keys: string[]) {
    if (keys.length > 0) {
      this.setState({ selectedOrganisation: keys[0] });
    }
  }
  onSelectQualification(keys: string[]) {
    if (keys.length > 0) {
      this.setState({ selectedQualification: keys[0] });
    }
  }
  onApplyFilter() {
    this.setState({ filterShown: false }, () => {
      this.refresh();
    });
  }
  onClearFilter() {
    this.setState({ filterShown: false, selectedOrganisation: '', selectedQualification: '', coursePattern: '', namePattern: '', classPattern: '' }, () => {
      this.refresh();
    });
  }

  // ADDING A LEARNER
  addLearner() {
    this.setState({ addLearnerVisible: true }, async () => {
      const learners: any = await this.props.getNewLearners();
      const newLearners: IAnyMap = Util.arrayToMap(learners, 'id', true);
      // logger('LEARNERS', learners);
      this.setState({ newLearners });
    });
  }
  onAddLearner(keys: string[]) {
    // logger('onAddLearner', keys, this.state.newLearners);
    if (keys.length > 0) {
      const newLearner: IEmsLearner = this.state.newLearners[keys[0]];
      // logger(newLearner);
      if (newLearner) {
        this.setState({ newLearnerSelected: newLearner });
      }
    }
  }
  async doAddLearner() {
    if (this.state.newLearnerSelected) {
      try {
        this.setState({ loading: true });
        await this.props.addNewLearner(this.state.newLearnerSelected.id);
        this.setState({ loading: false });
        this.refresh(); // TODO: when we can persist new learner directly in redux do that instead
      } catch (err) {
        Toast.showError($labels.ACTIVITY_LOGS.ADD_LEARNER_FAILURE);
        this.setState({ loading: false });
      }
    }
    this.setState({ addLearnerVisible: false, newLearnerSelected: null });
  }

  // handleScroll(y: number) {
  //   if (y > 50 && !this.state.hideHeaders) {
  //     this.setState({ hideHeaders: true, sortVisible: false }); // TODO: instead of a switch animate the hide/show for smoother transition
  //   } else if (y < 30 && this.state.hideHeaders) {
  //     this.setState({ hideHeaders: false });
  //   }
  // }
  // async onFilterApply() {
  //   this.setState({ filterShown: false, total: 0 }, () => {
  //     this.fetchCPDAssessments(1);
  //   });
  // }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <SimpleHeader left={<BackIcon />}
          title={$labels.ACTIVITY_LOGS.OFF_THE_JOB_HOURS}
          activity={this.state.loading}
          right={<HelpMenu />}
        />
        <View style={styles.wallpaper}>
          <View style={styles.leftPane}>

            <Learners
              createPrivilege={this.state.createPrivilege}
              updatePrivilege={this.state.updatePrivilege}
              filtered={this.state.namePattern !== '' || this.state.classPattern !== '' || this.state.coursePattern !== '' || this.state.selectedOrganisation !== '' || this.state.selectedQualification !== ''}
              currentLearnerIndex={this.state.currentLearnerIndex}
              sortedLearners={this.props.sortedLearners}
              loading={this.state.loading}
              myid={Util.GetMyID()}
              onRefresh={this.refresh.bind(this)}
              onNextPage={this.nextPage.bind(this)}
              onSelectLearner={this.selectLearnerIndex.bind(this)}
              // onScroll={this.handleScroll.bind(this)}
              onAddLearner={() => this.addLearner()}
              onToggleFilter={() => this.showFilter()}
            />
          </View>
          {/* <Image style={[commonStyles.leftPaneShadow, this.state.currentLearnerIndex > -1 && { marginTop: 100 }]} resizeMode='stretch' source={require('assets/shadow20.png')} /> */}

          {this.state.dualPane &&
            <View style={styles.rightPane}>
              {this.state.currentLearnerIndex > -1 ?
                <Learner
                  navigation={this.props.navigation}
                  sortedLearners={this.props.sortedLearners}
                  currentLearnerIndex={this.state.currentLearnerIndex}
                  createPrivilege={this.state.createPrivilege}
                  updatePrivilege={this.state.updatePrivilege}
                  onChangeLearnerIndex={(index) => this.setState({ currentLearnerIndex: index })}
                />
                :
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'gray' }}>{$labels.ACTIVITY_LOGS.SELECT_LEARNER_HINT}</Text>
                </View>
              }
            </View>
          }

          <InModal
            isVisible={this.state.addLearnerVisible}
            backgroundColor={Theme.background}
            adjustHeight
            title={$labels.ACTIVITY_LOGS.ADD_LEARNER}
            onClose={() => this.setState({ addLearnerVisible: false })}
          >
            <View style={{ padding: 16 }}>
              <CodePicker single style={{ flex: 1 }}
                title={$labels.ACTIVITY_LOGS.ADD_LEARNER_BUTTON}
                onSelectionChanged={this.onAddLearner.bind(this)}
                selectedKeys={this.state.newLearnerSelected === null ? [] : [this.state.newLearnerSelected.id.toString()]}
                data={this.state.newLearners}
                sortProperty={'sortKey'}
                dataProperty={'name'}
                dataFormat={(learner: IEmsLearner, index: number, selected: boolean) => <Text>{learner.name}</Text>}
                placeholder={$labels.ACTIVITY_LOGS.SELECT_LEARNER}
              />
              <RowView style={{ paddingTop: 16 }}>
                <RoundButton label={$labels.COMMON.CANCEL} backColor={'#999'} onPress={() => this.setState({ addLearnerVisible: false })} radius={6} />
                <RoundButton label={$labels.ACTIVITY_LOGS.ADD_LEARNER_BUTTON} backColor={Theme.green} radius={6} onPress={() => this.doAddLearner()} disabled={!this.state.newLearnerSelected} />
              </RowView>
            </View>
          </InModal>

          <InModal avoidKeyboard adjustHeight
            isVisible={this.state.filterShown}
            onClose={() => this.setState({ filterShown: false })}
          >
            <Wallpaper nofill>
              <ScrollView style={{ padding: 16, flex: 1 }} keyboardShouldPersistTaps='always' keyboardDismissMode={'on-drag'}>
                <Text style={styles.title}>{$labels.ACTIVITY_LOGS.FILTER_TITLE}</Text>
                <Text style={styles.flabel}>{$labels.COMMON.LEARNER}</Text>
                <TextInput
                  value={this.state.namePattern}
                  style={[commonStyles.textInput, styles.input]}
                  placeholder={$labels.ACTIVITY_LOGS.LEARNER_HINT}
                  onChangeText={(txt) => this.setState({ namePattern: txt })}
                />

                <Text style={styles.flabel}>{$labels.ACTIVITY_LOGS.CLASS}</Text>
                <TextInput
                  value={this.state.classPattern}
                  style={[commonStyles.textInput, styles.input]}
                  placeholder={$labels.ACTIVITY_LOGS.CLASS_HINT}
                  onChangeText={(txt) => this.setState({ classPattern: txt })}
                />

                <Text style={styles.flabel}>{$labels.ACTIVITY_LOGS.ORGANISATION}</Text>
                <CodePicker single
                  boxStyle={[commonStyles.textInput, { height: Platform.OS === 'android' ? 36 : 32, paddingLeft: 6 }]}
                  textStyle={{ fontSize: 16, paddingTop: 5 }}
                  title={$labels.ACTIVITY_LOGS.ORGANISATION_HINT}
                  onSelectionChanged={this.onSelectOrganisation.bind(this)}
                  selectedKeys={this.state.selectedOrganisation === '' ? [] : [this.state.selectedOrganisation]}
                  data={this.state.organisations}
                  placeholder={$labels.ACTIVITY_LOGS.ORGANISATION_PLACEHOLDER}
                />

                <Text style={styles.flabel}>{$labels.ACTIVITY_LOGS.COURSE}</Text>
                <TextInput
                  value={this.state.coursePattern}
                  style={[commonStyles.textInput, styles.input]}
                  placeholder={$labels.ACTIVITY_LOGS.COURSE_HINT}
                  onChangeText={(txt) => this.setState({ coursePattern: txt })}
                />

                <Text style={styles.flabel}>{$labels.ACTIVITY_LOGS.QUALIFICATION}</Text>
                <CodePicker single
                  boxStyle={[commonStyles.textInput, { height: 32, paddingLeft: 6 }]}
                  textStyle={{ fontSize: 16, paddingTop: 5 }}
                  title={$labels.ACTIVITY_LOGS.QUALIFICATION_HINT}
                  onSelectionChanged={this.onSelectQualification.bind(this)}
                  selectedKeys={this.state.selectedQualification === '' ? [] : [this.state.selectedQualification]}
                  data={this.state.qualifications}
                  placeholder={$labels.ACTIVITY_LOGS.QUALIFICATION_PLACEHOLDER}
                />

                <RowView style={{ paddingTop: 12 }}>
                  <RoundButton label={$labels.FILTER.APPLY} backColor={Theme.green} onPress={() => this.onApplyFilter()} radius={6} />
                  <RoundButton label={$labels.FILTER.CLEAR} backColor={'#999'} onPress={() => this.onClearFilter()} radius={6} />
                </RowView>

              </ScrollView>
            </Wallpaper>
          </InModal>

        </View>
      </View>
    );
  }
}

const styles: any = EStyleSheet.create({
  wallpaper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Theme.lightbg
  },
  leftPane: {
    flex: 37,
    minWidth: 100,
    zIndex: 2,
    backgroundColor: Theme.background
  },
  rightPane: {
    flex: 63
  },
  sort: {
    padding: 0,
    marginTop: 12,
    marginHorizontal: 15
  },
  sortsubheader: {
    flexDirection: 'row'
  },
  subheaderLabel: {
    color: Theme.dimBlue,
    fontSize: 12,
    paddingVertical: 6,
    fontWeight: 'bold',
    flex: 1
  },
  subheaderSort: {
    flex: 1,
    textAlign: 'right'
  },
  subheaderSortText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Theme.dimBlue
  },
  smallchevron: {
    fontSize: 12,
    marginLeft: 4,
    color: Theme.dimBlue
  },
  sortOptions: {
    paddingTop: 4
  },
  label: {
    paddingRight: 6,
    color: 'gray'
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
    fontSize: 18
  },
  flabel: {
    paddingTop: 9,
    paddingBottom: 3,
    color: 'rgba(255,255,255,0.7)'
  },
  input: {
    paddingVertical: Platform.OS === 'android' ? 3 : 6
  }
});

const mapDispatchToProps = {
  getLearners: getActivityLogLearners,
  getNewLearners: getActivityLogNewLearners,
  addNewLearner: addNewAtivityLogLearner,
  getActivityLogEstablishments,
  getActivityLogQualifications
  // setCPDAssessmentFilter,
  // setCPDAssessmentSort
};

// function within a function form of mapStateToProps allows us to pass ownProps to selectors
const mapStateToProps = () => {
  // logger('>');
  const getSortedLearners = makeGetSortedLearners();

  return (state: IState, ownProps: Props) => {
    return {
      sortedLearners: getSortedLearners(state)
      // savedCPDFilter: state.cpd.userCPDFilters[state.auth.id]
    };
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(LearnersContainer);