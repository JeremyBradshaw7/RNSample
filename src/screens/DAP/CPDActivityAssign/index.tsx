import React from 'react';
import { Text, FlatList, View, RefreshControl, Dimensions, Keyboard } from 'react-native';
import { connect } from 'react-redux';
import { logger } from 'services/logger';
import { Wallpaper } from 'components/Wallpaper';
import { $labels, $translate } from 'services/i18n';
import { IState } from 'appstate';
import Toast from 'services/Toast';
import TransparentHeader from 'components/TransparentHeader';
import FullWidthLink from 'components/FullWidthLink';
import ScreenInfo from 'services/ScreenInfo';
import _ from 'lodash';
import { RowView } from 'components/RowView';
import HelpMenu from 'components/HelpMenu';
import Analytics from 'services/Analytics';
import EStyleSheet from 'react-native-extended-stylesheet';
import InlineSpinner from 'components/InlineSpinner';
import RoundButton from 'components/RoundButton';
import { InModal } from 'components/InModal';
import ScreenSpinner from 'components/ScreenSpinner';
import ErrorService from 'services/Error';
import { getVisibleCPDActivities, upsertCPDActivity, getDAPQualificationList } from 'appstate/DAP/actions';
import { NEW_CPD_ACTIVITY, ICPDActivity } from 'appstate/DAP/models';
import { makeGetSortedCPDActivitiesVisible } from 'appstate/DAP/selectors';
import { Icon } from 'native-base';
import dotProp from 'dot-prop-immutable';
import Anim from 'services/Anim';
import { FormVoiceInput } from 'components/FormVoiceInput';
import Theme from 'services/Theme';
import { getEAVAttributes } from 'appstate/auth/actions';
import { getScormList, getAssessmentConfigurationList } from 'appstate/onlineLearning/actions';
import CodePicker from 'components/CodePicker';
import BackIcon from 'components/BackIcon';
import { Branding } from 'services/Branding';

interface Props {
  navigation: any;
  cpdActivities: ICPDActivity[];
  // establishments: ICodeMap;
  getVisibleCPDActivities: typeof getVisibleCPDActivities;
}
interface State {
  fetching: boolean;
  copyBusy: boolean;
  refreshing: boolean;
  // defaultEstablishment: number | null;
  landscape: boolean;
  page: number;
  pagingEnd: boolean;
  total: number;
  paging: boolean;
  copyArmed: boolean;
  copyModal: boolean;
  copyCPDActivity: ICPDActivity | null;
  copyTitle: string;
  // copyEstablishment: number | null;
}

class CPDActivityAssignList extends React.Component<Props, State> {

  // Header configuration
  static navigationOptions = () => {
    return {
      header: null // we'll add our own header
    };
  };

  constructor(props: Props) {
    super(props);
    logger('CPDActivitiesAssign CTR');
    this.state = {
      fetching: false,
      copyBusy: false,
      refreshing: false,
      // defaultEstablishment: Util.isAdmin() || _.isEmpty(props.establishments) ? null : parseInt(Object.keys(props.establishments)[0], 10),
      landscape: ScreenInfo.isLandscape(),
      page: 1,
      pagingEnd: false,
      total: 0,
      paging: false,
      copyArmed: false,
      copyModal: false,
      copyCPDActivity: null,
      copyTitle: '',
      // copyEstablishment: null
    };
  }

  UNSAFE_componentWillReceiveProps(newProps: Props) {
    logger('CPDActivitiesAssign CWRP', newProps);
  //   this.setState({
  //     defaultEstablishment: Util.isAdmin() || _.isEmpty(newProps.establishments) ? null : parseInt(Object.keys(newProps.establishments)[0], 10)
  //   });
  }

  UNSAFE_componentWillMount() {
    logger('CPDActivitiesAssign CWM');
    // this.props.getEstablishments(true); // dont have to wait for this
    this.fetchCPDActivities();
  }

  componentDidMount() {
    logger('CPDActivitiesAssign CDM');
    Analytics.logScreen('CPDActivities');
    Dimensions.addEventListener('change', this.onScreenResize);
  }
  componentWillUnmount() {
    logger('CPDActivitiesAssign CWU');
    Dimensions.removeEventListener('change', this.onScreenResize);
  }
  onScreenResize = () => {
    this.setState({ landscape: ScreenInfo.isLandscape() });
  };
  async refresh() {
    this.setState({ refreshing: true });
    await this.fetchCPDActivities();
    this.setState({ refreshing: false });
  }
  async fetchCPDActivities(page: number = 1) {
    try {
      this.setState({ fetching: true, page });
      // logger('QUERY PAGE', page);
      const pageResult: any = await this.props.getVisibleCPDActivities(page);
      // logger('PAGERESULT', page, pageResult);
      this.setState({ fetching: false, pagingEnd: pageResult.page >= pageResult.lastPage, total: pageResult.total });
    } catch (err) {
      this.setState({ fetching: false });
      Toast.showError($translate('GENERIC.X_FETCH_FAILURE', {entity: $labels.DAP.CPD_ACTIVITY}));
    }
  }
  async nextPage() {
    // logger('nextPage', this.props.configs.length);
    if (!this.state.pagingEnd && !this.state.paging && !this.state.fetching) {
      this.setState({ paging: true });
      await this.fetchCPDActivities(this.state.page + 1);
      this.setState({ paging: false });
    }
  }

  pickCPDActivity(activity: ICPDActivity) {
    this.props.navigation.navigate('CPDActivityAssign', { activity });
  }

  renderCPDActivity(activity: ICPDActivity, index: number) {
    // const est: string = !activity.establishmentId ? $labels.CONFIG.PUBLIC : !this.props.establishments ? '' : this.props.establishments[activity.establishmentId];
    // const disabled = !Util.isAdmin() && !activity.establishmentId; // dont allow edit of public config by non-admin (if we ever show them)
    // if (!est) { // indicates that establishment shouldn't be visible, so hide it
    //   return null;
    // }
    // logger('CONFIG', config, assType, this.props.assessmentTypes);
    const fg = Branding.WallpaperForeground();
    return (
      <FullWidthLink
        key={index.toString()} // {config.guid}
        // first={index === 0} // doest work if we might hide first, use ListHeaderComponent instead
        label={activity.title}
        disabled={/*disabled ||*/ this.state.copyArmed}
        iconName={ScreenInfo.isTablet() ? 'certificate' : ''} iconType={'MaterialCommunityIcons'} iconStyle={{ opacity: 0.5 }}
        secondaryLabel={activity.description} secondaryLabelLines={2}
        textStyle={{ fontSize: ScreenInfo.isLandscape() ? 16 : 15 }}
        secondaryTextStyle={{ paddingTop: 4, color: fg + '99', fontSize: ScreenInfo.isLandscape() ? 14 : 13 }}
        // secondaryIcon={'gear'}
        onPress={() => this.pickCPDActivity(activity)}
        pickComponent={(
          <RowView>
            {/* <Text numberOfLines={3} style={{ maxWidth: ScreenInfo.isTablet() ? 140 : 100, color: fg + '99', fontSize: 12, paddingHorizontal: 6, textAlign: 'right' }}>{est}</Text> */}
            {this.state.copyArmed ?
              <RoundButton transparent small label={$labels.CONFIG.COPY} style={{ marginRight: -6 }} onPress={() => {
                this.setState({ copyModal: true, copyCPDActivity: activity, copyTitle: activity.title /*, copyEstablishment: activity.establishmentId || this.state.defaultEstablishment*/ });
              }} />
              :
              <Icon type='FontAwesome' name='chevron-right' style={{ color: /*disabled ? '#ffffff11' :*/ fg }} />
            }
          </RowView>
        )}
      />
    );
  }

  renderList(style: any) {
    const fg = Branding.WallpaperForeground();
    return (
      <View style={style}>
        <View style={{ margin: 10 }}>
          <CodePicker
            title={$labels.DAP.ACTIVITY_GROUPS}
            single={true}
            nosort={true}
            style={{margin: 15}}
            onSelectionChanged={() => null}
            selectedKeys={[]}
            data={{}}
            placeholder={$labels.DAP.ALL_ACTIVITIES}
          />

          <RowView left nowrap style={{ marginTop: 6 }}>
            {this.state.copyArmed ?
              <RowView left nowrap style={{ flex: 1 }}>
                <Text style={[styles.label, { flex: 1, color: fg }]}>{$translate('CONFIG.LIST_HINT_OPTION_4', { name: $labels.DAP.CPD_ACTIVITY })}</Text>
                <RoundButton vsmall transparent label={$labels.CONFIG.CANCEL_COPY} onPress={() => {
                  Anim.EaseNext();
                  this.setState({ copyArmed: false });
                }} />
              </RowView>
              :
              <Text style={[styles.label, { flex: 1, marginBottom: -8, color: fg }]}>{'Visible CPD Activities'}</Text>
            }
          </RowView>
        </View>

        <FlatList
          style={{ flex: 1 }}
          data={this.props.cpdActivities}
          renderItem={({ item, index }) => this.renderCPDActivity(item, index)}
          keyExtractor={(a: ICPDActivity, index) => a.id}
          refreshControl={
            <RefreshControl
              colors={[fg]} tintColor={fg}
              onRefresh={this.refresh.bind(this)}
              refreshing={this.state.refreshing}
            />
          }
          ListEmptyComponent={
            <Text style={{ margin: 30, textAlign: 'center', color: fg }}>
              {$translate('GENERIC.NO_XS_VISIBLE', {entities: $labels.DAP.CPD_ACTIVITIES})}
            </Text>
          }
          ListFooterComponent={<View style={{ height: 16 }} />}
          ListHeaderComponent={<View style={{ height: 1 }} />} // so can see first top border
          onEndReached={this.nextPage.bind(this)}
          onEndReachedThreshold={0.01}
        />
        {/* } */}
        <InlineSpinner style={{ marginTop: 2, marginBottom: 2, alignSelf: 'center' }} visible={this.state.paging} />
      </View>
    );
  }

  unfocus() {
    Keyboard.dismiss();
  }

  render() {
    // logger('render Establishments', this.props.establishments);
    const { landscape } = this.state;
    const fg = Branding.WallpaperForeground();
    return (
      <Wallpaper>
        <View style={{ flex: 1 }}>
          <TransparentHeader
            // activity={this.state.fetching}
            left={<BackIcon />}
            right={(
              <RowView nowrap>
                <HelpMenu />
              </RowView>
            )}
            title={$labels.MENU.CPDActivitiesAssign}
          />

          <View style={{ flex: 1, marginHorizontal: ScreenInfo.isTablet() ? 80 : 0 }}>
            {this.renderList({ flex: 1 })}
          </View>
        </View>

        <ScreenSpinner semiOpaque visible={this.state.fetching && !this.state.refreshing && this.state.page === 1} />
      </Wallpaper>
    );
  }
}

const styles: any = EStyleSheet.create({
  label: {
    padding: 4
  },
});

const mapDispatchToProps = {
  getVisibleCPDActivities
};

const mapStateToProps = (state: IState, ownProps: Props) => {
  return {
    // establishments: selectEstablishments()(state),
    cpdActivities: makeGetSortedCPDActivitiesVisible()(state)
  };
};

export const CPDActivitiesAssign = connect(mapStateToProps, mapDispatchToProps)(CPDActivityAssignList); // connect this screen up to redux store