import React, { FC, ReactElement, useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, FlatListProps, ListRenderItemInfo, FlatList, View } from 'react-native';
import { useScreen } from 'services/CustomHooks';

interface Props {
  itemsToAnimate?: number;  // items to animate, if data is paged dont go over the pageSize
  duration?: number;        // duration of each animation
  delay?: number;           // delay between successive items
  animate?: boolean;        // in case we want to turn it off conditionally
  fromBottom?: boolean;     // slide up from bottom
  fromRight?: boolean;      // slide in from right
  fromLeft?: boolean;       // slide in from left
  pop?: boolean;            // pop the scale
  opacity?: boolean;        // fade in
}

/**
 * An animated FlatList component that slides and/or fades in the elements of the list (up to a limit, usually the initial pageful)
 * Adapted from https://medium.com/codex/animated-flatlist-in-react-native-7cd1119bb5ca - a wrapper around React Native’s FlatList component
 */
const AnimatedFlatList = <ItemT,>({
  itemsToAnimate = 20,
  duration = 600,
  delay = 100,
  renderItem: originalRenderItem,
  animate = true,
  fromBottom = true,
  fromRight = false,
  fromLeft = false,
  pop = false,
  opacity = true,
  ItemSeparatorComponent,
  ListHeaderComponent,
  ...props
}: FlatListProps<ItemT> & Props): ReactElement => {
  const { height, width } = useScreen();

  /**
   * Subcomponent that slides & fades itself in
   */
  const FadeInComponent: FC<{ index: number }> = useCallback(
    ({ index, children }): ReactElement => {
      if (!animate || index >= itemsToAnimate) {
        return <View>{children}</View>;
      }
      const value = useRef(new Animated.Value(0));
      useEffect(() => {
        value.current.setValue(0);
        if (animate) {
          Animated.timing(value.current, {
            toValue: 1,
            delay: index * delay,
            useNativeDriver: true,
            duration,
            easing: Easing.out(Easing.exp),
          }).start();
        }
      }, []);

      return (
        <Animated.View
          style={[
            fromRight || fromLeft ? { // slide-from-right/left (optionally with pop & opacity)
              opacity: !opacity ? 1 : value.current.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0, 0.2, 1] }),
              transform: [
                { scale: !pop ? 1 : value.current }, // pop
                { translateX: value.current.interpolate({ inputRange: [0, 1], outputRange: [fromLeft ? -width : width, 0] }) }
              ]
            } : fromBottom ? { // slide-up (optionally with pop & opacity)
              opacity: !opacity ? 1 : value.current.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0, 0.2, 1] }),
              transform: [
                { scale: !pop ? 1 : value.current }, // pop
                { translateY: value.current.interpolate({ inputRange: [0, 1], outputRange: [height - (height * (index / itemsToAnimate)), 0] }) }
              ]
            } : { // just pop & opacity
              opacity: !opacity ? 1 : value.current.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0, 0.2, 1] }),
              transform: [
                { scale: !pop ? 1 : value.current }, // pop
              ]
            }
          ]}
        >
          {children}
        </Animated.View>
      );
    },
    [],
  );

  /**
   * Separator component
   */
  const Separator: FC<{ index: number }> = useCallback(
    ({ index }): ReactElement | null =>
      ItemSeparatorComponent && index !== undefined ? (
        <FadeInComponent index={index}>
          <ItemSeparatorComponent />
        </FadeInComponent>
      ) : ItemSeparatorComponent ? (
        <ItemSeparatorComponent />
      ) : null,
    [],
  );

  const Item: FC<{ info: ListRenderItemInfo<ItemT> }> = useCallback(({ info }): ReactElement => {
    useEffect(() => {
      info.separators.updateProps('leading', { index: info.index });
    }, []);
    return <FadeInComponent index={info.index}>{originalRenderItem!(info)}</FadeInComponent>;
  }, []);

  const renderItem = useCallback(
    (info: ListRenderItemInfo<ItemT>): React.ReactElement | null =>
      info.index < itemsToAnimate ? <Item info={info} /> : originalRenderItem!(info),
    [originalRenderItem, itemsToAnimate],
  );

  return (
    <FlatList
      {...props}
      renderItem={renderItem}
      ItemSeparatorComponent={ItemSeparatorComponent ? Separator : null}
      ListHeaderComponent={ListHeaderComponent ? <FadeInComponent index={0}>{ListHeaderComponent}</FadeInComponent> : null}
    />
  );
};

export default AnimatedFlatList;
