import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { logger } from 'services/logger';
// import Orientation from 'react-native-orientation-locker';
import Analytics from 'services/Analytics';

interface Props {
  navigation: any;
  route: any;
  // onBack?: Function;
  chart: any;
}
interface State {
  // height: number;
  // width: number;
  chart: any;
}

export class ViewChart extends React.Component<Props, State> {

  // private exiting: boolean = false;

  constructor(props: Props) {
    super(props);
    // logger('////////////// ViewChart ctr', props.navigation);

    this.state = {
      // pass it an arbitrary chart, ViewChart is just a chart container that allows re-orientation & navigation, the chart itself can come from props or from navigation
      chart: props.chart ? props.chart : props.route.params.chart // direct from props or from navigation
      // height: Dimensions.get('window').height,
      // width: Dimensions.get('window').width
    };
  }

  componentDidMount() {
    // this.exiting = false;
    // ScreenInfo.removeOrientationLock(); // this will unlock the view to all Orientations
    // Orientation.addOrientationListener(this.onOrientationDidChange.bind(this));
    Analytics.logScreen('ViewChart');
  }

  componentWillUnmount() {
    // logger('componentWillUnmount');
    // this.exiting = true;
    // ScreenInfo.applyOrientationLock();
    // cancel any download in progress
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar hidden={Platform.OS === 'ios'} />

        <View style={{ flex: 1 }}>
          {this.state.chart}
        </View>

        {/* {this.props.onBack && <View style={styles.headerOverlay}>
          <Button
            style={styles.buttons}
            onPress={() => {
              // logger('onPress');
              if (this.props.onBack) {
                // logger('fire onBack');
                this.props.onBack();
              } else if (!!this.props.navigation) {
                // logger('fire goBack', this.props.navigation);
                this.props.navigation.goBack();
              }
            }}
          >
            <Icon name='chevron-right' type='FontAwesome' />
          </Button>
        </View>} */}

      </View>
    );
  }
}

// const styles: any = EStyleSheet.create({
//   headerOverlay: {
//     position: 'absolute',
//     top: 10,
//     left: 10
//   },
//   buttons: {
//     backgroundColor: Theme.hiliteMid
//   }
// });