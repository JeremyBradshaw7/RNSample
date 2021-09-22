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
  getVisibleCPDActivities: typeof getVisibleCPDActivities;
}
interface State {
  fetching: boolean;
  copyBusy: boolean;
  refreshing: boolean;
  landscape: boolean;
  page: number;
  pagingEnd: boolean;
  total: number;
  paging: boolean;
  copyArmed: boolean;
  copyModal: boolean;
  copyCPDActivity: ICPDActivity | null;
  copyTitle: string;
}

class CPDActivityAssignList extends React.Component<Props, State> {

  // Header configuration
  static navigationOptions = () => {
    return {
      header: null
    };
  };

  constructor(props: Props) {
    super(props);
    logger('CPDActivitiesAssign CTR');
    this.state = {
      fetching: false,
      copyBusy: false,
      refreshing: false,
      landscape: ScreenInfo.isLandscape(),
      page: 1,
      pagingEnd: false,
      total: 0,
      paging: false,
      copyArmed: false,
      copyModal: false,
      copyCPDActivity: null,
      copyTitle: ''
    };
  }

  UNSAFE_componentWillMount() {
    this.fetchCPDActivities();
  }

  componentDidMount() {
    Analytics.logScreen('CPDActivities');
    Dimensions.addEventListener('change', this.onScreenResize);
  }
  componentWillUnmount() {
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
      const pageResult: any = await this.props.getVisibleCPDActivities(page);
      this.setState({ fetching: false, pagingEnd: pageResult.page >= pageResult.lastPage, total: pageResult.total });
    } catch (err) {
      this.setState({ fetching: false });
      Toast.showError($translate('GENERIC.X_FETCH_FAILURE', {entity: $labels.DAP.CPD_ACTIVITY}));
    }
  }
  async nextPage() {
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
    const fg = Branding.WallpaperForeground();
    return (
      <FullWidthLink
        key={index.toString()}
        label={activity.title}
        disabled={this.state.copyArmed}
        iconName={ScreenInfo.isTablet() ? 'certificate' : ''} iconType={'MaterialCommunityIcons'} iconStyle={{ opacity: 0.5 }}
        secondaryLabel={activity.description} secondaryLabelLines={2}
        textStyle={{ fontSize: ScreenInfo.isLandscape() ? 16 : 15 }}
        secondaryTextStyle={{ paddingTop: 4, color: fg + '99', fontSize: ScreenInfo.isLandscape() ? 14 : 13 }}
        onPress={() => this.pickCPDActivity(activity)}
        pickComponent={(
          <RowView>
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
        <InlineSpinner style={{ marginTop: 2, marginBottom: 2, alignSelf: 'center' }} visible={this.state.paging} />
      </View>
    );
  }

  unfocus() {
    Keyboard.dismiss();
  }

  render() {
    const { landscape } = this.state;
    const fg = Branding.WallpaperForeground();
    return (
      <Wallpaper>
        <View style={{ flex: 1 }}>
          <TransparentHeader
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
    cpdActivities: makeGetSortedCPDActivitiesVisible()(state)
  };
};

export const CPDActivitiesAssign = connect(mapStateToProps, mapDispatchToProps)(CPDActivityAssignList); // connect this screen up to redux store