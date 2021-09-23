import React from 'react';
import { View, Dimensions } from 'react-native';
import { $labels } from 'services/i18n';
import { logger } from 'services/logger';
import Theme from 'services/Theme';
import { commonStyles } from 'styles/common';
import ScreenInfo from 'services/ScreenInfo';
import Anim from 'services/Anim';
import Learner from '.';
import HelpMenu from 'components/HelpMenu';
import Analytics from 'services/Analytics';
import { Branding } from 'services/Branding';
import SimpleHeader from 'components/SimpleHeader';
import { Icon } from 'native-base';

interface Props {
  navigation: any;
  route: any;
}
interface State {
  learnerIndex: number;
  orientation: 'Portrait' | 'Landscape';
}

/**
 * Wrapper round Learner component which makes it navigable. Deals with the navigation header and passing the prop(s) down.
 */
export default class LearnerNavigable extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      learnerIndex: props.route.params.currentLearnerIndex,
      orientation: ScreenInfo.isPortrait() ? 'Portrait' : 'Landscape'
    };
  }

  componentDidMount() {
    Dimensions.addEventListener('change', this.onScreenResize);
    Analytics.logScreen('ActivityLogs.Learner');
  }
  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.onScreenResize);
  }
  onScreenResize = () => {
    Anim.EaseNext();
    this.setState({
      orientation: ScreenInfo.isPortrait() ? 'Portrait' : 'Landscape' // to ensure screen is refreshed on orientation change
    });
  };

  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    const propsDiff = Object.keys(nextProps).reduce((diff, key) => {
      if (this.props[key] === nextProps[key]) {
        return diff;
      }
      return {
        ...diff,
        [key]: nextProps[key]
      };
    }, {});
    // Dont re-render if only navigation state changed (does thru setParams)
    return this.state !== nextState || !(Object.keys(propsDiff).indexOf('navigation') === 0 && Object.keys(propsDiff).length === 1);
  }

  changeLearner(index: number) {
    this.setState({ learnerIndex: index });
  }
  render() {
    const wide = ScreenInfo.isTablet() && this.state.orientation === 'Landscape' && ScreenInfo.Width() > 700; // needs left/right margins otherwise too stretched
    return (
      <View style={[{ flex: 1 }, wide && {backgroundColor: Theme.background }]}>
        <SimpleHeader
          left={<Icon style={{ color: Branding.WallpaperForeground(), paddingHorizontal: 8 }} type='FontAwesome' name='chevron-left' onPress={() => this.props.navigation.goBack()} />}
          title={$labels.ACTIVITY_LOGS.OFF_THE_JOB_HOURS_LOG}
          right={<HelpMenu />}
        />
        <View style={[{ flex: 1 }, wide && commonStyles.deepShadow, wide && {width: 700, alignSelf: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderLeftColor: 'dimgray', borderRightColor: 'dimgray'}]}>
          <Learner
            navigation={this.props.navigation}
            sortedLearners={this.props.route.params.sortedLearners}
            createPrivilege={this.props.route.params.createPrivilege}
            updatePrivilege={this.props.route.params.updatePrivilege}
            onChangeLearnerIndex={this.changeLearner.bind(this)}
            currentLearnerIndex={this.state.learnerIndex}
          />
        </View>
      </View>
    );
  }
}
