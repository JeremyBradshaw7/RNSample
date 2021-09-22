import React from 'react';
import { View, Animated, Platform } from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import { Icon } from 'native-base';
import { PanGestureHandler, State as PanState } from 'react-native-gesture-handler';
import Spinner from 'react-native-spinkit';
import Analytics from 'services/Analytics';
import { Branding } from 'services/Branding';
import ScreenInfo from 'services/ScreenInfo';

interface Props {
  panHorizontalThreshold?: number;
  panVerticalThreshold?: number;
  waitOnPan?: boolean; // show busy indicator while waiting for async callback
  style?: Object;
  chevron?: boolean; // more prominent chevron style, default shows caret (triangle)
  radius?: number; // circle radiues, if not 25
  offset?: number; // additional offset from top/left/bottom/right
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDragDown?: () => void;
  onDragUp?: () => void;
}
interface State {
  panHorizontalThreshold: number;
  panVerticalThreshold: number;
  left: Animated.Value; // 0 to 1 left swipe state (1 = we will)
  right: Animated.Value; // 0 to 1 right swipe state
  top: Animated.Value;
  bottom: Animated.Value;
  busyLeft: boolean;
  busyRight: boolean;
  busyTop: boolean;
  busyBottom: boolean;
}

/**
 * A view that takes swipe gestures, and animates left/right/up/down swipe chevrons
 */
export class GestureView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      left: new Animated.Value(0),
      right: new Animated.Value(0),
      top: new Animated.Value(0),
      bottom: new Animated.Value(0),
      panHorizontalThreshold: props.panHorizontalThreshold || 100,
      panVerticalThreshold: props.panVerticalThreshold || 75,
      busyLeft: false,
      busyRight: false,
      busyTop: false,
      busyBottom: false
    };
  }

  onPanGestureEvent(nativeEvent) {
    const _left = !this.props.onSwipeLeft ? 0 : nativeEvent.translationX >= 20 ? Math.min((nativeEvent.translationX / this.state.panHorizontalThreshold), 1) : 0;
    const _right = !this.props.onSwipeRight ? 0 : nativeEvent.translationX <= -20 ? Math.min((-nativeEvent.translationX / this.state.panHorizontalThreshold), 1) : 0;
    const _top = !!_left || !!_right || !this.props.onDragDown ? 0 : nativeEvent.translationY >= 20 ? Math.min((nativeEvent.translationY / this.state.panVerticalThreshold), 1) : 0;
    const _bottom = !!_left || !!_right || !this.props.onDragUp ? 0 : nativeEvent.translationY <= -20 ? Math.min((-nativeEvent.translationY / this.state.panVerticalThreshold), 1) : 0;
    this.setState({ left: new Animated.Value(_left), right: new Animated.Value(_right), top: new Animated.Value(_top), bottom: new Animated.Value(_bottom) });
  }

  onHandlerStateChange(nativeEvent) {
    if (nativeEvent.state === PanState.END) {
      if (nativeEvent.translationX >= this.state.panHorizontalThreshold && !!this.props.onSwipeLeft) {
        this.swipeLeft();
        Analytics.logEvent('swipeLeft');
      } else if (nativeEvent.translationX <= -this.state.panHorizontalThreshold && !!this.props.onSwipeRight) {
        this.swipeRight();
        Analytics.logEvent('swipeRight');
      } else if (nativeEvent.translationY >= this.state.panVerticalThreshold && !!this.props.onDragDown) {
        this.dragDown();
        Analytics.logEvent('dragDown');
      } else if (nativeEvent.translationY <= -this.state.panVerticalThreshold && !!this.props.onDragUp) {
        this.dragUp();
        Analytics.logEvent('dragUp');
      } else {
        Animated.parallel([
          Animated.timing(this.state.left, { useNativeDriver: false, toValue: 0 }),
          Animated.timing(this.state.right, { useNativeDriver: false, toValue: 0 }),
          Animated.timing(this.state.top, { useNativeDriver: false, toValue: 0 }),
          Animated.timing(this.state.bottom, { useNativeDriver: false, toValue: 0 })
        ]).start();
      }
    }
  }

  swipeLeft() {
    if (!this.props.waitOnPan) {
      Animated.timing(this.state.left, { useNativeDriver: false, toValue: 0, duration: 100 }).start();
    }
    setTimeout(async () => {
      if (!!this.props.onSwipeLeft) {
        if (!!this.props.waitOnPan) {
          this.setState({ busyLeft: true });
        }
        await this.props.onSwipeLeft();
        if (!!this.props.waitOnPan) {
          Animated.timing(this.state.left, { useNativeDriver: false, toValue: 0, duration: 100 }).start();
          setTimeout(() => this.setState({ busyLeft: false }), 100);
        }
      }
    }, !this.props.waitOnPan ? 100 : 0);
  }

  swipeRight() {
    if (!this.props.waitOnPan) {
      Animated.timing(this.state.right, { useNativeDriver: false, toValue: 0, duration: 100 }).start();
    }
    setTimeout(async () => {
      if (!!this.props.onSwipeRight) {
        if (!!this.props.waitOnPan) {
          this.setState({ busyRight: true });
        }
        await this.props.onSwipeRight();
        if (!!this.props.waitOnPan) {
          Animated.timing(this.state.right, { useNativeDriver: false, toValue: 0, duration: 100 }).start();
          setTimeout(() => this.setState({ busyRight: false }), 100);
        }
      }
    }, !this.props.waitOnPan ? 100 : 0);
  }

  dragDown() {
    if (!this.props.waitOnPan) {
      Animated.timing(this.state.top, { useNativeDriver: false, toValue: 0, duration: 100 }).start();
    }
    setTimeout(async () => {
      if (!!this.props.onDragDown) {
        if (!!this.props.waitOnPan) {
          this.setState({ busyTop: true });
        }
        await this.props.onDragDown();
        if (!!this.props.waitOnPan) {
          Animated.timing(this.state.top, { useNativeDriver: false, toValue: 0, duration: 100 }).start();
          setTimeout(() => this.setState({ busyTop: false }), 100);
        }
      }
    }, !this.props.waitOnPan ? 100 : 0);
  }

  dragUp() {
    if (!this.props.waitOnPan) {
      Animated.timing(this.state.bottom, { useNativeDriver: false, toValue: 0, duration: 100 }).start();
    }
    setTimeout(async () => {
      if (!!this.props.onDragUp) {
        if (!!this.props.waitOnPan) {
          this.setState({ busyBottom: true });
        }
        await this.props.onDragUp();
        if (!!this.props.waitOnPan) {
          Animated.timing(this.state.bottom, { useNativeDriver: false, toValue: 0, duration: 100 }).start();
          setTimeout(() => this.setState({ busyBottom: false }), 100);
        }
      }
    }, !this.props.waitOnPan ? 100 : 0);
  }

  render() {
    const chevron = !!this.props.chevron;
    const offset = this.props.offset || 0;
    const r = this.props.radius || (chevron ? 35 : 25);
    const styles = this.styles;
    const linkColor = Branding.getLinkColor();
    const iconStyle = [styles.icon, !!linkColor && {color: linkColor, opacity: 0.35}, chevron && {fontSize: 36, color: 'white'}];
    return (
      <PanGestureHandler
        onGestureEvent={(event) => this.onPanGestureEvent(event.nativeEvent)}
        onHandlerStateChange={(event) => this.onHandlerStateChange(event.nativeEvent)}
        activeOffsetX={[-this.state.panHorizontalThreshold, this.state.panHorizontalThreshold]}
        activeOffsetY={[-this.state.panVerticalThreshold, this.state.panVerticalThreshold]}
      >
        <View style={this.props.style}>

          {!!this.props.onDragDown && (
            <Animated.View style={[
              styles.top,
              styles.iconContainer,
              {
                height: r * 2, width: r * 2, borderBottomLeftRadius: r, borderBottomRightRadius: r, marginLeft: -r, marginTop: (-r * 0.8) + offset,
                opacity: this.state.top.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0.02, 0.5, 1] }),
                // transform: [{ scale: this.state.top.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0.5, 0.7, 1] }) }]
              }
            ]} />
          )}
          {!!this.props.onDragDown && (
            <Animated.View style={[
              styles.top,
              {
                width: 30, marginLeft: -15, alignItems: 'center',
                marginTop: this.state.top.interpolate({ inputRange: [0, 1], outputRange: [-9 + offset, -2 + offset] }),
                opacity: this.state.top.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                // transform: [{ scale: this.state.top.interpolate({ inputRange: [0, 1], outputRange: [0.67, 1] }) }]
              }
            ]}>
              {this.state.busyTop && !!this.props.waitOnPan ?
                <View  style={{ marginTop: 6 }}><Spinner isVisible size={15} type={Platform.OS === 'ios' ? 'Arc' : 'ThreeBounce'} color='white' /></View> :
                <Icon style={iconStyle} name={chevron ? 'chevron-down' : 'caret-down'} type='FontAwesome' onPress={() => {
                  Animated.timing(this.state.top, { useNativeDriver: false, toValue: 1, duration: 0 }).start();
                  this.dragDown();
                }} />
              }
            </Animated.View>
          )}

          {!!this.props.onSwipeLeft && (
            <Animated.View style={[
              styles.left,
              styles.iconContainer,
              {
                height: r * 2, width: r * 2, borderTopRightRadius: r, borderBottomRightRadius: r, marginLeft: (-r * 0.8) + offset, marginTop: -r,
                opacity: this.state.left.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0, 0.5, 1] }),
                // transform: [{ scale: this.state.left.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0.5, 0.7, 1] }) }]
              }
            ]} />
          )}
          {!!this.props.onSwipeLeft && (
            <Animated.View style={[
              styles.left,
              {
                height: 30, marginTop: -15, justifyContent: 'center',
                marginLeft: this.state.left.interpolate({ inputRange: [0, 1], outputRange: [offset, 4 + offset] }),
                opacity: this.state.left.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                // transform: [{ scale: this.state.left.interpolate({ inputRange: [0, 1], outputRange: [0.67, 1] }) }]
              }
            ]}>
              {this.state.busyLeft && !!this.props.waitOnPan ?
                <View style={{ marginLeft: 2 }} ><Spinner isVisible size={15} type={Platform.OS === 'ios' ? 'Arc' : 'ThreeBounce'} color='white' /></View> :
                <Icon style={[iconStyle, {paddingRight: 10}]} name={chevron ? 'chevron-left' : 'caret-left'} type='FontAwesome' onPress={() => {
                  Animated.timing(this.state.left, { useNativeDriver: false, toValue: 1, duration: 0 }).start();
                  this.swipeLeft();
                }} />
              }
            </Animated.View>
          )}

          {this.props.children}

          {!!this.props.onSwipeRight && (
            <Animated.View style={[
              styles.right,
              styles.iconContainer,
              {
                height: r * 2, width: r * 2, borderTopLeftRadius: r, borderBottomLeftRadius: r, marginRight: (-r * 0.8) + offset, marginTop: -r,
                opacity: this.state.right.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0.02, 0.5, 1] }),
                // transform: [{ scale: this.state.right.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0.5, 0.7, 1] }) }]
              }
            ]} />
          )}
          {!!this.props.onSwipeRight && (
            <Animated.View style={[
              styles.right,
              {
                height: 30, marginTop: -15, justifyContent: 'center',
                marginRight: this.state.right.interpolate({ inputRange: [0, 1], outputRange: [offset, 4 + offset] }),
                opacity: this.state.right.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                // transform: [{ scale: this.state.right.interpolate({ inputRange: [0, 1], outputRange: [0.67, 1] }) }]
              }
            ]}>
              {this.state.busyRight && !!this.props.waitOnPan ?
                <Spinner isVisible size={15} type={Platform.OS === 'ios' ? 'Arc' : 'ThreeBounce'} color='white' /> :
                <Icon style={[iconStyle, {paddingLeft: 10}]} name={chevron ? 'chevron-right' : 'caret-right'} type='FontAwesome' onPress={() => {
                  Animated.timing(this.state.right, { useNativeDriver: false, toValue: 1, duration: 0 }).start();
                  this.swipeRight();
                }} />
              }
            </Animated.View>
          )}

          {!!this.props.onDragUp && (
            <Animated.View style={[
              styles.bottom,
              styles.iconContainer,
              {
                height: r * 2, width: r * 2, borderTopLeftRadius: r, borderTopRightRadius: r, marginLeft: -r, marginBottom: (-r * 0.8) + offset,
                opacity: this.state.bottom.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0.02, 0.5, 1] }),
                // transform: [{ scale: this.state.bottom.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0.5, 0.7, 1] }) }]
              }
            ]} />
          )}
          {!!this.props.onDragUp && (
            <Animated.View style={[
              styles.bottom,
              {
                width: 30, marginLeft: -15, alignItems: 'center',
                marginBottom: this.state.bottom.interpolate({ inputRange: [0, 1], outputRange: [-5 + offset, offset] }),
                opacity: this.state.bottom.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                // transform: [{ scale: this.state.bottom.interpolate({ inputRange: [0, 1], outputRange: [0.67, 1] }) }]
              }
            ]}>
              {this.state.busyBottom && !!this.props.waitOnPan ?
                <View style={{ marginBottom: 3 }} ><Spinner isVisible size={15} type={Platform.OS === 'ios' ? 'Arc' : 'ThreeBounce'} color='white' /></View> :
                <Icon style={iconStyle} name={chevron ? 'chevron-up' : 'caret-up'} type='FontAwesome' onPress={() => {
                  Animated.timing(this.state.bottom, { useNativeDriver: false, toValue: 1, duration: 0 }).start();
                  this.dragUp();
                }} />
              }
            </Animated.View>
          )}

        </View>
      </PanGestureHandler>
    );
  }

  private styles: any = EStyleSheet.create({
    icon: {
      color: 'thistle',
      zIndex: 999999,
      fontSize: ScreenInfo.isTablet() ? 30 : 25
    },
    iconContainer: {
      backgroundColor: Branding.getLinkColor() + '77',
      justifyContent: 'center',
      alignItems: 'center'
    },
    left: {
      left: 0,
      top: '50%',
      zIndex: 999998,
      position: 'absolute'
    },
    right: {
      right: 0,
      top: '50%',
      zIndex: 999998,
      position: 'absolute'
    },
    top: {
      top: -2,
      left: '50%',
      zIndex: 999998,
      position: 'absolute'
    },
    bottom: {
      bottom: -1,
      left: '50%',
      zIndex: 999998,
      position: 'absolute'
    }
  });
}
