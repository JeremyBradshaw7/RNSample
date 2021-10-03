import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import _ from 'lodash';
import LinearGradient from 'react-native-linear-gradient';
import { Icon } from 'native-base';
import { useScreen } from 'services/CustomHooks';

interface Props {
  children: React.ReactNode; // children are expected
  fadeWidth?: number;
  fadeHexColor?: string; // #nnnnnn
  style?: any;
}

/**
 * A generic horizontal ScrollView that detects when scrollable to the left or right and overlays fade-out and caret icons
 */
export const HorizontalScrollView: React.FC<Props> = ({
  children,
  fadeWidth = 40,
  fadeHexColor = '#ffffff',
  style = {}
}: Props) => {

  const { isTablet } = useScreen();
  const scrollRef = useRef<any>(null);

  // Local state:
  const [scrollState, setScrollState] = useState({ left: false, right: false, width: 0, contentWidth: 0, offset: 0 }); // whether there's content to see left/right

  // Effects:
  useEffect(() => {
    // startup
    return () => {
      // teardown
    };
  }, []);

  // Styles:
  const styles = EStyleSheet.create({
    container: { flex: 1 },
  });

  return (
    <View style={[{ flexDirection: 'row', overflow: 'hidden', flexWrap: 'nowrap' }, style]}>
      {scrollState.left &&
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={[fadeHexColor + 'ff', fadeHexColor + '00']}
          style={{ width: fadeWidth, marginRight: -fadeWidth, zIndex: 9999, height: '100%', justifyContent: 'center' }}
        >
          <Icon
            name='caret-left' type='FontAwesome'
            style={{ fontSize: isTablet ? 30 : 24, color: 'thistle', textAlign: 'left' }}
            onPress={() => scrollRef && scrollRef.current.scrollTo({ x: 0, y: 0, animated: true })}
          />
        </LinearGradient>
      }
      <ScrollView
        horizontal
        ref={scrollRef}
        onLayout={(event) => {
          const _width = event?.nativeEvent?.layout?.width || 0;
          setScrollState((prevState) => ({
            ...prevState,
            width: _width,
            left: prevState.contentWidth > _width && prevState.offset > 0,
            right: prevState.contentWidth > _width && prevState.offset < prevState.contentWidth - _width
          }));
        }}
        scrollEventThrottle={32}
        onScroll={(event) => {
          const _offset = event?.nativeEvent?.contentOffset?.x || 0;
          setScrollState((prevState) => ({
            ...prevState,
            offset: _offset,
            left: prevState.contentWidth > prevState.width && _offset > 0,
            right: prevState.contentWidth > prevState.width && _offset < prevState.contentWidth - prevState.width
          }));
        }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'nowrap' }}
          onLayout={(event) => {
            const _contentWidth = event?.nativeEvent?.layout?.width || 0;
            setScrollState((prevState) => ({
              ...prevState,
              contentWidth: _contentWidth,
              left: _contentWidth > prevState.width && prevState.offset > 0,
              right: _contentWidth > prevState.width && prevState.offset < _contentWidth - prevState.width
            }));
          }}
        >
          {children}
        </View>
      </ScrollView>
      {scrollState.right &&
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={[fadeHexColor + '00', fadeHexColor + 'ff']}
          style={{ width: fadeWidth, marginLeft: -fadeWidth, zIndex: 9999, height: '100%', justifyContent: 'center' }}
        >
          <Icon
            name='caret-right' type='FontAwesome'
            style={{ fontSize: isTablet ? 30 : 24, color: 'thistle', textAlign: 'right' }}
            onPress={() => scrollRef && scrollRef.current.scrollToEnd({ animated: true })}
          />
        </LinearGradient>}
    </View>
  );
};
