import React from 'react';
import { Animated } from 'react-native';

interface Props {
  duration?: number; // duration to fade in contents
  style?: Object;    // additional style
}
interface State {
  fadeAnim: Animated.Value; // Initial value for opacity: 0
  duration: number;
}

/**
 * Generic component that fades in the contents (children)
 */
export class FadeInView extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      fadeAnim: new Animated.Value(0),
      duration: props.duration || 500
    };
  }

  componentDidMount() {
    Animated.timing(
      this.state.fadeAnim,
      {
        useNativeDriver: true,
        toValue: 1,
        duration: this.state.duration
      }
    ).start();
  }

  render() {
    const { fadeAnim } = this.state;

    return (
      <Animated.View
        style={{
          ...this.props.style,
          opacity: fadeAnim
        }}
      >
        {this.props.children}
      </Animated.View>
    );
  }
}