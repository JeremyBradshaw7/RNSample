import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, TouchableOpacity } from 'react-native';
import Analytics from 'services/Analytics';
import EStyleSheet from 'react-native-extended-stylesheet';
import { useBranding, useScreen } from 'services/CustomHooks';
import { $labels, $translate } from 'services/i18n';
import Theme from 'services/Theme';
import HelpMenu from 'components/HelpMenu';
import { ITimelineEvent } from 'appstate/timeline/models';
import { IPageInfo, IState } from 'appstate';
import { getTimelineEvents, setHomeScreenPreference } from 'appstate/timeline/actions';
import Toast from 'services/Toast';
import { RowView } from 'components/RowView';
import Util from 'services/Util';
import InlineSpinner from 'components/InlineSpinner';
import TransparentHeader from 'components/TransparentHeader';
import { Wallpaper } from 'components/Wallpaper';
import { commonStyles, ollStyle } from 'styles/common';
import { eventStyles, EventTile } from './EventTile';
import _ from 'lodash';
import AnimatedFlatList from 'components/AnimatedFlatList';
import ScreenSpinner from 'components/ScreenSpinner';
import BurgerMenu from 'components/BurgerMenu';
import { ROUTE_ICON } from 'services/Globals';
import { Icon } from 'native-base';
import { setScreen } from 'appstate/auth/actions';
import BackIcon from 'components/BackIcon';
import IconWithHint from 'components/IconWithHint';
import { CheckBox } from 'components/CheckBox';
import MenuIcon from 'components/MenuIcon';
import FastImage from 'react-native-fast-image';
import Colour from 'services/Colour';
import Config from 'react-native-config';
import { ProfileImage } from 'components/ProfileImage';
import Anim from 'services/Anim';
import { HorizontalScrollView } from 'components/HorizontalScrollView';
import { makeGetUnreadNotificationCount } from 'appstate/auth/selectors';
import JUtil, { OverlayTopShadow } from 'services/JUtil';

interface Props {
  navigation: any;
  route: any;
}

export const Timeline: React.FC<Props> = ({ navigation, route }) => {
  let timer;

  // Redux:
  const dispatch = useDispatch();
  const events: ITimelineEvent[] = useSelector((state: IState) => state.timeline.events || []);
  const homeScreen = useSelector((state: IState) => !!state.timeline.preferences?.homeScreen);
  const unread = useSelector((state: IState) => useMemo(makeGetUnreadNotificationCount, [])(state, 'notification') + useMemo(makeGetUnreadNotificationCount, [])(state, 'message'));
  const name = useSelector((state: IState) => state.auth.displayName);
  const jobTitle = useSelector((state: IState) => state.auth.jobTitle || '');
  const activeClub = useSelector((state: IState) => state.auth.activeClub || '');

  // until we have actions we'll just render the primary screens as actions
  const actionRoutes = [
    'MyProgressAssessments',
    'MyEvidenceAssessments',
    'ProgressAssessments',
    'EvidenceAssessments',
    'OnlineLearning',
    'FormativeAssessments',
    'EPALite',
    'Metrics',
    'Dashboard',
    'Notifications',
    'Library',
    'Settings',
    'MyCPD',
    'CPDAssessments'
  ];
  const assessmentScreenProgress = useSelector((state: IState) => state.auth.assessmentScreenProgress);
  const myAssessmentScreenProgress = useSelector((state: IState) => state.auth.myAssessmentScreenProgress);
  const assessmentScreenEvidence = useSelector((state: IState) => state.auth.assessmentScreenEvidence);
  const myAssessmentScreenEvidence = useSelector((state: IState) => state.auth.myAssessmentScreenEvidence);
  const filteredRoutes: any[] =
    actionRoutes.filter((routeName) => {
      if (BurgerMenu.routeVisible(routeName)) {
        // additional checks for these
        if (routeName === 'MyProgressAssessments') {
          return !!myAssessmentScreenProgress;
        } else if (routeName === 'ProgressAssessments') {
          return !!assessmentScreenProgress;
        } else if (routeName === 'MyEvidenceAssessments') {
          return !!myAssessmentScreenEvidence;
        } else if (routeName === 'EvidenceAssessments') {
          return !!assessmentScreenEvidence;
        } else {
          return true;
        }
      } else {
        return false;
      }
    });

  // Local state:
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [pagingEnd, setPagingEnd] = useState(false);
  // const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [paging, setPaging] = useState(false);
  const [logoState, setLogoState] = useState({ loaded: false, width: 1, height: 1 });
  const [headerShown, setHeaderShown] = useState(true); // may need for header but also used to disable/enable repeat timer

  // need a useRef on headerShown to be available in timer:
  const headerShownPersist = useRef(headerShown);
  useEffect(() => {
    headerShownPersist.current = headerShown;
  }, [headerShown]);

  // const [expandedEvents, setExpandedEvents] = useState<number[]>([]);
  // const [selectionUpdated, setSelectionUpdated] = useState(0); // timestamp to get list to re-render itself

  // Custom hooks:
  const { linkColor, primaryBackgroundColor, secondaryBackgroundColor, primaryForegroundColor, secondaryForegroundColor, logoBackgroundColor, logoUrl } = useBranding();
  const { isLandscape, isPhone, isTablet, width, height } = useScreen();

  // Constants:

  // Effects:
  useEffect(() => {
    // startup
    Analytics.logScreen('Timeline');
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  // Fetch necessary data on startup, and every minute (if at top)
  useEffect(() => {
    fetchEvents();
    timer = setInterval(() => checkFetchEvents(), 60 * 1000);
  }, []);

  // Styles:
  const styles = EStyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.background },
    textStyle: ollStyle({}),
    dateStyle: { fontFamily: Util.monoFontFamily() },
    name: { fontSize: isTablet ? 30 : 18, fontWeight: 'bold', color: '#fff' },
    subname: { fontSize: isTablet ? 20 : 15, color: '#eee' },
    rightLogo: { position: 'absolute', right: 0, top: 0 },
  });

  // Local methods:
  const fetchEvents = async (_page: number = 1) => {
    try {
      setLoading(true);
      setPage(_page);
      const pageResult: IPageInfo = await dispatch(getTimelineEvents(_page, isTablet ? 25 : 15));
      setLoading(false);
      setPagingEnd(pageResult.page >= pageResult.lastPage);
    } catch (err) {
      setLoading(false);
      Toast.showError($translate('GENERIC.X_FETCH_FAILURE', { entity: $labels.TIMELINE.EVENT }));
    }
  };

  const checkFetchEvents = () => {
    if (headerShownPersist.current) { // only refetch events on timer if we are at the top of the screen, otherwise it may upset paging
      fetchEvents();
    }
  };

  const nextPage = async () => {
    if (!pagingEnd && !paging) {
      setPaging(true);
      await fetchEvents(page + 1);
      setPaging(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  // Render methods:
  const actionSize = isTablet ? 120 : 100;
  const actionPadding = 10;
  const renderShortcutCard = (_route: any, last: boolean) => {
    const label =
      _route === 'MyProgressAssessments' ? myAssessmentScreenProgress.title :
        _route === 'ProgressAssessments' ? assessmentScreenProgress.title :
          _route === 'MyEvidenceAssessments' ? myAssessmentScreenEvidence.title :
            _route === 'EvidenceAssessments' ? assessmentScreenEvidence.title :
              $labels.MENU[_route];
    const iconName = typeof _route !== 'string' ? _route.icon : (ROUTE_ICON[_route]?.name || ROUTE_ICON[_route] || 'angle-right');
    const iconType = typeof _route !== 'string' ? 'FontAwesome5' : (ROUTE_ICON[route]?.type || 'FontAwesome');
    return (
      <TouchableOpacity onPress={() => routePicked(_route)}>
        <View style={{ width: actionSize, height: actionSize, marginVertical: actionPadding, marginLeft: actionPadding, marginRight: last ? actionPadding : 0, borderRadius: 10, backgroundColor: secondaryBackgroundColor }}>
          <Icon name={iconName} type={iconType} style={{ marginVertical: 20, fontSize: isTablet ? 40 : 30, alignSelf: 'center', color: secondaryForegroundColor }} />
          <Text style={{ textAlign: 'center', position: 'absolute', bottom: 0, width: '100%', padding: 5, color: Colour.getContrastColour(secondaryBackgroundColor) }}>{label}</Text>
          {_route === 'Notifications' && !!unread && JUtil.renderBubbleCount(unread, isTablet ? 18 : 16, false, { position: 'absolute', top: 8, right: 8, zIndex: 9999 })}
        </View>
      </TouchableOpacity>
    );
  };

  const routePicked = (_route) => {
    switch (_route) {
      case 'MyProgressAssessments':
        dispatch(setScreen(myAssessmentScreenProgress));
        navigation.navigate('MyProgressAssessments', { fromScreen: 'Timeline' });
        break;
      case 'ProgressAssessments':
        dispatch(setScreen(assessmentScreenProgress));
        navigation.navigate('ProgressAssessments', { fromScreen: 'Timeline' });
        break;
      case 'MyEvidenceAssessments':
        dispatch(setScreen(myAssessmentScreenEvidence));
        navigation.navigate('MyEvidenceAssessments', { fromScreen: 'Timeline' });
        break;
      case 'EvidenceAssessments':
        dispatch(setScreen(assessmentScreenEvidence));
        navigation.navigate('EvidenceAssessments', { fromScreen: 'Timeline' });
        break;
      default:
        navigation.navigate(_route, { fromScreen: 'Timeline' });
        break;
    }
  };

  const renderHomeHeader = () => {
    return (
      <RowView left style={[{ marginBottom: 10, marginHorizontal: isTablet ? 20 : 14 }]}>
        <View style={commonStyles.shadow}>
          <ProfileImage url={Util.GetMyImage()} size={isTablet ? 100 : 70} square borderRadius={8} borderWidth={0} style={[{ marginRight: isTablet ? 12 : 6 }]} />
        </View>
        <View style={[{ flex: 1 }, commonStyles.deepShadow]}>
          <Text style={[styles.name, primaryForegroundColor && { color: primaryForegroundColor, opacity: 0.8 }]}>{name}</Text>
          <Text style={[styles.subname, primaryForegroundColor && { color: primaryForegroundColor, opacity: 0.7 }]}>{activeClub}</Text>
          <Text style={[styles.subname, primaryForegroundColor && { color: primaryForegroundColor, opacity: 0.7 }]}>{jobTitle}</Text>
        </View>
        <FastImage resizeMode='contain'
          style={[!logoState.loaded && { marginRight: -500 }, styles.rightLogo, { width: logoState.width, height: logoState.height }, !!logoBackgroundColor && { backgroundColor: logoBackgroundColor }]}
          onLoad={(e) => handleLoad(e.nativeEvent.width, e.nativeEvent.height)}
          source={!!logoUrl ? { uri: logoUrl } : require('assets/branding/logo_white.png')}
        />
      </RowView>
    );
  };

  const renderShortcutCards = () => {
    return (
      <HorizontalScrollView
        fadeWidth={isTablet ? 50 : 30}
        style={[eventStyles.boxStyle, { height: actionSize + (actionPadding * 2), paddingVertical: 0, paddingHorizontal: 0, marginHorizontal: isTablet ? 20 : 10 }]}
        content={filteredRoutes.map((_route: any, index) => renderShortcutCard(_route, index === filteredRoutes.length - 1))}
      />
    );
  };

  const renderEvent = (event: ITimelineEvent, index: number) => {
    return (
      <EventTile
        event={event}
        index={index}
        navigation={navigation}
      />
    );
  };

  const onScroll = (contentOffest: any) => {
    if (contentOffest.y <= 0 && !headerShown) {
      Anim.EaseNext();
      setHeaderShown(true);
    } else if (contentOffest.y > 0 && headerShown) {
      Anim.EaseNext();
      setHeaderShown(false);
    }
  };

  const handleLoad = (w, h) => {
    const maxWidth = (isTablet ? (isLandscape ? 180 : 140) : 100);
    const maxHeight = (isTablet ? 100 : 70);
    let scale = 1;
    if (h > maxHeight) {
      scale = maxHeight / h;
    }
    if (w > maxWidth && maxWidth / w < scale) {
      scale = maxWidth / w;
    }
    Anim.EaseNext();
    setLogoState({ loaded: true, width: w * scale, height: h * scale });
  };

  // Main render:
  return (
    <View style={styles.container}>
      <Wallpaper>
        <TransparentHeader
          title={homeScreen ? '' : $labels.MENU.Timeline}
          activity={loading}
          left={homeScreen ? <MenuIcon heading={$labels.COMMON.FULL_TITLE} subheading={Config.BUILD === 'Development' ? 'ALPHA' : Config.BUILD === 'Test' ? 'BETA' : ''} /> : <BackIcon />}
          right={<RowView>
            <IconWithHint tapInsideCloses
              iconName={'cog'} type='FontAwesome'
              iconStyle={{ color: 'white', fontSize: 28 }}
              left={-2} top={-6}
              hintComponent={() => (
                <View>
                  <CheckBox checked={homeScreen} square label={$labels.TIMELINE.HOME_PAGE} onPress={() => {
                    Anim.EaseNext();
                    dispatch(setHomeScreenPreference(!homeScreen));
                  }} />
                </View>
              )} />
            <HelpMenu style={{ marginLeft: 8 }} />
          </RowView>}
        />
        {homeScreen && renderHomeHeader()}
        {!headerShown && <OverlayTopShadow />}
        <View style={{ flex: 1, paddingBottom: 12, width: Math.min(width, height), alignSelf: 'center' }}>
          <AnimatedFlatList scrollEnabled
            itemsToAnimate={isTablet ? 25 : 15} // to match pageSize
            style={{ flex: 1 }}
            data={events}
            ListHeaderComponent={homeScreen ? renderShortcutCards() : null}
            ListEmptyComponent={<View style={{ paddingVertical: 14, paddingHorizontal: isTablet ? 18 : 10, marginHorizontal: isTablet ? 20 : 10, borderRadius: 10, backgroundColor: '#ffffff88' }}>
              <Text style={{ textAlign: 'center', color: '#222' }}>
                {loading ? $labels.COMMON.LOADING : $translate('GENERIC.NO_DATA_X', { entities: $labels.TIMELINE.EVENTS })}
              </Text>
            </View>}
            keyExtractor={(item, index) => `${item.id}_${index}`}
            renderItem={({ item, index }) => renderEvent(item, index)}
            onRefresh={() => refresh()}
            refreshing={refreshing}
            onEndReached={() => nextPage()}
            onEndReachedThreshold={0.01}
            bounces={true}
            ListFooterComponent={<InlineSpinner style={{ alignSelf: 'center', marginTop: 0, marginBottom: 0 }} visible={paging} />}
            scrollEventThrottle={16} onScroll={(e: any) => onScroll(e.nativeEvent.contentOffset)}
          />
        </View>
        <ScreenSpinner visible={loading && !paging && !refreshing && !events.length} />
      </Wallpaper>
    </View>
  );
};