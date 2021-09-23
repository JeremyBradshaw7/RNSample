import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import { ITimelineEvent } from 'appstate/timeline/models';
import { RowView } from 'components/RowView';
import Util from 'services/Util';
import { commonStyles, ollStyle } from 'styles/common';
import { Icon } from 'native-base';
import Theme from 'services/Theme';
import { useBranding, useScreen } from 'services/CustomHooks';
import RoundButton from 'components/RoundButton';
import { $labels } from 'services/i18n';
import Anim from 'services/Anim';
import Toast from 'services/Toast';
import { getAssessmentWithHeader } from 'appstate/assessments/actions';
import ScreenInfo from 'services/ScreenInfo';
import { ProfileImage } from 'components/ProfileImage';

// Styles:
export const eventStyles = EStyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  textStyle: ollStyle({}),
  // dateStyle: { fontFamily: Util.monoFontFamily() },
  boxStyle: { paddingVertical: 14, paddingHorizontal: ScreenInfo.isTablet() ? 18 : 10, marginBottom: 10, borderRadius: 10, backgroundColor: '#fff' }
});

interface Props {
  event: ITimelineEvent;
  index: number;
  showDateHeader?: boolean;
  navigation: any;
}

export const EventTile: React.FC<Props> = ({ event, index, showDateHeader, navigation }) => {

  const dispatch = useDispatch();
  const { isPortrait, isPhone, isTablet, width, height } = useScreen();
  const { linkColor } = useBranding();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggle = () => {
    Anim.EaseNext();
    setExpanded(!expanded);
  };

  const navigate = async (_route: string) => {
    if (_route === 'Assessment') {
      // Go to assessment
      try {
        setBusy(true);
        const hdr = await dispatch(getAssessmentWithHeader(event.data.link));
        setBusy(false);
        if (!!hdr) {
          navigation.navigate('Assessment', {
            sortedHeaders: [hdr],
            currentAssessmentIndex: 0
          });
        } else {
          Toast.showWarning($labels.ASSESSMENT.NAV_ISSUE);
        }
      } catch {
        setBusy(false);
        Toast.showWarning($labels.ASSESSMENT.NAV_ISSUE);
      }
    }
  };

  // Main render:
  return (
    // Below width setting only works because this tile is given the full width of the screen by the parent screen
    <View>
      {showDateHeader &&
        <View style={[eventStyles.boxStyle, { backgroundColor: '#ffffff88' }]}>
          <Text style={[eventStyles.textStyle, { alignSelf: 'center', fontSize: 16 }]}>
            {Util.formatDateWith(event.timestamp, 'dddd, Do MMMM YYYY')}
          </Text>
        </View>
      }
      <TouchableOpacity onPress={() => toggle()}>
        <View style={[
          eventStyles.boxStyle,
          Platform.OS === 'ios' && commonStyles.shadow,
          { marginHorizontal: isTablet ? 20 : 10 } // room for shadow
        ]}>
          <RowView top nowrap>
            {isTablet && !!event.data.image && <ProfileImage square size={56} url={event.data.image} borderRadius={6} style={{ marginTop: -6, marginLeft: -10, marginBottom: -8, marginRight: 10 }} />}
            <View style={{ flex: 1 }}>
              <RowView style={{ marginBottom: 10 }} nowrap>
                <Icon name={'clock-o'} type={'FontAwesome'} style={{ color: linkColor + 'aa', fontSize: 20, marginRight: 6, marginTop: isTablet ? -5 : -2 }} />
                <Text style={[eventStyles.textStyle, { color: linkColor, flex: 1 }]}>{Util.formatDateWith(event.timestamp, (Util.timePortionOfDate(event.timestamp) !== 0 ? 'h:mma, ' : '') + (isTablet ? 'dddd Do MMMM' : 'Do MMMM'))}</Text>
                <Text style={[eventStyles.textStyle, { color: linkColor, marginRight: 10 }]}>{Util.fromNow(event.timestamp)}</Text>
                <Icon name={expanded ? 'chevron-up' : 'chevron-down'} type={'FontAwesome'} style={{ fontSize: 16, color: linkColor }} />
              </RowView>
              <Text numberOfLines={expanded ? undefined : 1} style={[eventStyles.textStyle]}>{event.message}</Text>
            </View>
          </RowView>
          {expanded && <RowView>
            {event.data.type === 'assessment' && <RoundButton iconAfterText iconName={'chevron-right'} busy={busy} style={{ marginTop: 8 }} label={$labels.NOTIFICATIONS.GO_ASSESSMENT} radius={8} onPress={() => navigate('Assessment')} />}
          </RowView>}
        </View>
      </TouchableOpacity>
    </View>
  );
};