import React from 'react';
import { connect } from 'react-redux';
import { IState } from 'appstate';
import { $labels, $translate } from 'services/i18n';
import { logger } from 'services/logger';
// import { selectEstablishments } from 'appstate/config/selectors';
import Toast from 'services/Toast';
import ErrorService from 'services/Error';
import Analytics from 'services/Analytics';
import Util from 'services/Util';
import { ICPDActivity } from 'appstate/DAP/models';
import { upsertCPDActivity, deleteCPDActivity } from 'appstate/DAP/actions';
import { View, Text, Dimensions } from 'react-native';
import SimpleHeader from 'components/SimpleHeader';
import { FormVoiceInput } from 'components/FormVoiceInput';
import InputScrollView from 'react-native-input-scroll-view';
import ScreenInfo from 'services/ScreenInfo';
import { FormCombo } from 'components/FormCombo';
import LinkButton from 'components/LinkButton';
import RoundButton from 'components/RoundButton';
import Theme from 'services/Theme';
import { FormMedia } from 'components/FormMedia';
import { FormNumericInput } from 'components/FormNumericInput';
import { FormEAVAttributes } from 'components/FormEAVAttributes';
import { FormSwitch } from 'components/FormSwitch';
import { IAnyMap } from 'components/CodePicker';
import { FormRow } from 'components/FormRow';
import { FormSectionHeader } from 'components/FormSectionHeader';
import _ from 'lodash';
import EStyleSheet from 'react-native-extended-stylesheet';
import { EvidenceLevel } from 'appstate/evidence/models';
import EvidenceListContainer from 'components/EvidenceList';
import { makeGetQualificationsList } from 'appstate/DAP/selectors';
import { ICodeMap } from 'appstate/config/models';
import { Branding } from 'services/Branding';

interface Props {
  navigation: any; // the stack navigator
  route: any;
  // establishments: ICodeMap;
  scormList: IAnyMap;
  qualifications: ICodeMap;
  upsertCPDActivity: typeof upsertCPDActivity;
  deleteCPDActivity: typeof deleteCPDActivity;
}
interface State {
  activity: ICPDActivity; // pluck from props.route.params when called by navigate('CPDActivity', { activity });
  landscape: boolean;
  busy: boolean;
  modified: boolean;
}

class CPDActivityAssignComponent extends React.Component<Props, State> {

  // Header configuration
  static navigationOptions = () => {
    return {
      header: null // we'll add our own header
    };
  };

  constructor(props: Props) {
    super(props);
    // logger('ctr', props);
    this.state = {
      activity: props.route.params.activity,
      landscape: ScreenInfo.isLandscape(),
      busy: false,
      modified: false
    };
  }

  goBack() {
    this.props.navigation.goBack();
  }
  componentDidMount() {
    Analytics.logScreen('CPDActivityAssign');
    Dimensions.addEventListener('change', this.onScreenResize);
  }
  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.onScreenResize);
  }
  onScreenResize = () => {
    this.setState({ landscape: ScreenInfo.isLandscape() });
  };

  valError() {
    // const { activity } = this.state;
    // if (!activity.title) {
    //   return $translate('VALIDATION.MANDATORY', { field: $labels.DAP.CPD_ACTIVITY + ' ' + $labels.CONFIG.TITLE });
    // }
    return '';
  }

  async save(goBack: boolean = true) {
    const { activity } = this.state;
    try {
      // this.setState({ busy: true });
      // await this.props.upsertCPDActivity(activity);
      // Toast.showSuccess($translate('GENERIC.X_SAVE_SUCCESS', { entity: $labels.DAP.CPD_ACTIVITY }));
      // this.setState({ busy: false });
      if (goBack) {
        this.props.navigation.goBack();
      }
    } catch (err) {
      this.setState({ busy: false });
      Toast.showError(ErrorService.extractErrors(err) || $translate('GENERIC.X_SAVE_FAILURE', { entity: $labels.DAP.CPD_ACTIVITY_ASSIGN }));
    }
  }
  updateState(attrName: string, value: any) {
    // logger('updateState', attrName, value);
    this.setState({
      activity: { ...this.state.activity, [attrName]: value },
      modified: true
    }, () => logger(this.state));
  }

  render() {
    const { activity } = this.state;
    const fg = Branding.WallpaperForeground();
    return (
      <View style={{ flex: 1 }}>
        <SimpleHeader title={$labels.DAP.CPD_ACTIVITY_ASSIGN}
          left={
            <LinkButton iconName='chevron-left' label={this.state.modified ? $labels.COMMON.SAVE : ''}
              iconStyle={{ color: fg }} textStyle={{ color: fg, fontSize: 16 }}
              disabled={this.state.modified && !!this.valError()}
              onPress={() => {
                if (this.state.modified) {
                  this.save(true);
                } else {
                  this.goBack();
                }
              }}
            />
          }
          right={
            <LinkButton label={this.state.modified ? $labels.COMMON.CANCEL : ''}
              iconStyle={{ color: fg }} textStyle={{ color: fg, fontSize: 16 }}
              onPress={() => this.goBack()}
            />
          }
        />
        <View style={{ flex: 1 }} >
          <InputScrollView keyboardShouldPersistTaps={'always'}>
            <View style={{ flex: 1, paddingHorizontal: 20, marginHorizontal: this.state.landscape ? 90 : 0 }} >
              <Text>will appear here</Text>
            </View>
          </InputScrollView>
        </View>
      </View>
    );
  }
}

const styles: any = EStyleSheet.create({
  hint: {
    color: '#777',
    marginTop: 8,
    marginBottom: 8
  },
});

const mapStateToProps = (state: IState, ownProps: Props) => {
  return {
    // establishments: selectEstablishments()(state),
    qualifications: makeGetQualificationsList()(state),
    scormList: state.onlineLearning.scormList
  };
};

const mapDispatchToProps = { upsertCPDActivity, deleteCPDActivity };

export const CPDActivityAssign = connect(mapStateToProps, mapDispatchToProps)(CPDActivityAssignComponent); // a way to do a named export of a redux connected smart component
