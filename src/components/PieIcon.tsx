import React from 'react';
import { View, Platform } from 'react-native';
import { Icon } from 'native-base';
import EStyleSheet from 'react-native-extended-stylesheet';
import Pie from 'react-native-pie';
import Colour from 'services/Colour';
import ProgressCircle from 'react-native-progress-circle';

interface Props {
  percentYes: number | null;
  yesColour: string;
  percentNo?: number | null;
  noColour?: string;
  showIcon?: boolean;        // cross or tick for 0% and 100%
  nullColour?: string;       // empty/full circle colour if null/unscored
  backgroundColour?: string; // empty section of pie
  size?: number;
  ringWidth?: number;
  style?: any;
  unscored?: boolean;
}

/**
 * Generic Pie graphic component
 */
export function PieIcon({
  percentYes,
  percentNo = null,
  yesColour,
  noColour,
  showIcon = false,
  nullColour = '#bbbbbb',
  backgroundColour = '#aaaaaa88',
  size = 22,
  ringWidth = 6,
  style = {},
  unscored = false
}: Props) {
  if ((percentYes === null && percentNo === null) || unscored) {
    return (
      <View style={style}>
        <Icon
          name={unscored ? 'circle' : 'circle-outline'} type={'MaterialCommunityIcons'}
          style={{
            transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
            fontSize: size,
            paddingLeft: EStyleSheet.hairlineWidth,
            color: nullColour
          }}
        />
      </View>
    );
  }
  const icon =
    percentNo && percentNo >= 100 && showIcon ? 'times' :
      percentYes && percentYes >= 100 && showIcon ? 'check' : '';

  return (
    <View style={style}>
      {percentYes && percentYes >= 100 ?
        <View style={{ backgroundColor: yesColour, height: size, width: size, borderRadius: size / 2 }} /> :
        percentNo && percentNo >= 100 ?
          <View style={{ backgroundColor: noColour, height: size, width: size, borderRadius: size / 2 }} /> :
          __DEV__ && Platform.OS === 'android' ? // <Pie> throws Error while updating property 'stroke' in shadow node of type: ARTShape on Android in dev mode!!
            <ProgressCircle
              percent={percentYes || 0}
              radius={size / 2}
              borderWidth={!icon && !!ringWidth ? ringWidth || (size / 2) : size / 2}
              color={yesColour}
              shadowColor={noColour || backgroundColour} // must show remainder as noColour, ProgressCircle can't show 3 colours unless we render another one over the top rotated
            />
            :
            <Pie
              radius={size / 2}
              innerRadius={!icon && !!ringWidth ? (size / 2) - ringWidth : undefined}
              strokeCap={'butt'}
              backgroundColor={backgroundColour}
              dividerSize={(percentYes || 0) > 0 && (percentNo || 0) > 0 ? 10 : undefined}
              sections={[
                {
                  percentage: percentYes || 0,
                  color: yesColour,
                },
                {
                  percentage: percentNo || 0,
                  color: noColour,
                }
              ]}
            />
      }
      {!!icon && <Icon
        name={icon}
        type={'FontAwesome5'}
        style={[
          styles.shadow,
          icon === 'times' && {marginLeft: 3},
          {
            fontSize: size,
            color: percentYes === null && percentNo === null ? nullColour :
              (percentYes || 0) >= 100 ? Colour.getContrastColour(yesColour || '#000000') :
                Colour.getContrastColour(noColour || '#000000')
          }
        ]}
      />}
    </View>
  );
}

const styles: any = EStyleSheet.create({
  shadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 1,
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }]
  }
});