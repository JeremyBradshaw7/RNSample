import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, FlatList, TextInput, Keyboard, Linking } from 'react-native';
import Analytics from 'services/Analytics';
import EStyleSheet from 'react-native-extended-stylesheet';
import _ from 'lodash';
import Util from 'services/Util';
import { useBranding, useScreen } from 'services/CustomHooks';
import { ICodeMap } from 'appstate/config/models';
import { IPageInfo, IState } from 'appstate';
import SimpleHeader from 'components/SimpleHeader';
import { RowView } from 'components/RowView';
import LinkButton from 'components/LinkButton';
import { Branding } from 'services/Branding';
import { $labels, $translate } from 'services/i18n';
import HelpMenu from 'components/HelpMenu';
import { getMyCourses, getEPA, exportEPA } from 'appstate/onlineLearning/actions';
import { getCourseLearnerList, ICourse, IEPAAssessment, IEPAView, IPersonCourse } from 'appstate/onlineLearning/models';
import { makeGetAllCourses, makeGetMyCourses, makeGetResponsibleCourses } from 'appstate/onlineLearning/selectors';
import { logger } from 'services/logger';
import CodePicker from 'components/CodePicker';
import { Icon } from 'native-base';
import { commonStyles } from 'styles/common';
import Toast from 'services/Toast';
import { useInfiniteQuery } from 'react-query';
import InlineSpinner from 'components/InlineSpinner';
import { getEstablishments } from 'appstate/config/actions';
import ScreenSpinner from 'components/ScreenSpinner';
import { ProfileImage } from 'components/ProfileImage';
import { getAssessmentFilters, getAssessmentWithHeader } from 'appstate/assessments/actions';
import { CheckBox } from 'components/CheckBox';
import RoundButton from 'components/RoundButton';
import Pie from 'react-native-pie';
import Theme from 'services/Theme';
import { ScorePill } from 'components/ScorePill';
import Anim from 'services/Anim';
import Colour from 'services/Colour';
import { ICollection } from 'appstate/assessments/models';
import IconWithHint from 'components/IconWithHint';
import { InModal } from 'components/InModal';
import { InToast } from 'components/InToast';
import * as EmailValidator from 'email-validator';
import ErrorService from 'services/Error';
import { IEvidence } from 'appstate/evidence/models';
import FlatListCustom from 'components/FlatListCustom';

interface Props {
  navigation: any;
  route: any;
}

/**
 * Example of a functional screen component that uses react-query
 */
export const EPALite: React.FC<Props> = ({ navigation, route }) => {
  let courseRef: any = null;
  const isLearner = Util.isLearner();

  // Redux:
  const dispatch = useDispatch();
  const allEstablishments: ICodeMap = useSelector((state: IState) => state.config.userEstablishments[state.auth.id] || {});
  const cohortsFilter: ICollection = useSelector((state: IState) => state.assessments?.userCollections[state.auth.id + '_cat1']?.cohorts || {});
  const allCourses: ICourse[] = useSelector((state: IState) => useMemo(makeGetAllCourses, [])(state));
  const assignedCourses: ICourse[] = useSelector((state: IState) => useMemo(makeGetMyCourses, [])(state));
  const responsibleCourses: ICourse[] = useSelector((state: IState) => useMemo(makeGetResponsibleCourses, [])(state));
  const [assignedLearners, setAssignedLearners] = useState<IPersonCourse[]>([]);
  const defaultEmail: string = useSelector((state: IState) => state.vault.email || '');

  const mergeCourses = (): ICourse[] => {
    // My courses must merge in responsible and all;
    const _courses: ICourse[] = _.clone(assignedCourses);
    responsibleCourses.forEach((rCourse: ICourse) => {
      // eslint-disable-next-line eqeqeq
      if (!_courses.find((mc: ICourse) => mc.id == rCourse.id)) {
        _courses.push(rCourse);
      }
    });
    allCourses.forEach((aCourse: ICourse) => {
      // eslint-disable-next-line eqeqeq
      if (!_courses.find((mc: ICourse) => mc.id == aCourse.id)) {
        _courses.push(aCourse);
      }
    });
    return _courses;
  };
  const isAssignedCourse = (course: ICourse) => {
    // eslint-disable-next-line eqeqeq
    return !!assignedCourses.find((mc: ICourse) => mc.id == course.id);
  };
  const isResponsibleCourse = (course: ICourse) => {
    // eslint-disable-next-line eqeqeq
    return !!responsibleCourses.find((mc: ICourse) => mc.id == course.id);
  };
  const getRoleForCourse = (_courseId): (0 | 1 | 2) => {
    if (!_courseId) {
      return 0;
    }
    // eslint-disable-next-line eqeqeq
    const course = courses.find((c) => c.id == _courseId);
    if (!course) {
      return 0;
    }
    const _role = isAssignedCourse(course) ? 1 : isResponsibleCourse(course) ? 2 : 0;
    return _role;
  };

  // Local state:
  const [loading, setLoading] = useState<boolean>(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [initialising, setInitialising] = useState(true);
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [courseId, setCourseId] = useState<string>(''); // selected course
  const [person, setPerson] = useState<IPersonCourse | null>(null); // selected person on course
  const [establishments, setEstablishments] = useState<string[]>([]);
  const [cohorts, setCohorts] = useState<string[]>([]);
  const [view, setView] = useState<IEPAView | null>(null);
  /** 0=admin, 1=learner, 2=assessor */
  const [role, setRole] = useState(Util.isAdmin() ? 0 : isLearner ? 1 : 2);
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([]);
  const [availableAssessments, setAvailableAssessments] = useState<number>(0);
  const [selectedAllAssessments, setSelectedAllAssessments] = useState<boolean>(false);
  const [headerMinimised, setHeaderMinimised] = useState(false);
  const [showAssessmentScores, setShowAssessmentScores] = useState(true);
  const [showCriteriaScores, setShowCriteriaScores] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState<boolean>(false);
  const [openLink, setOpenLink] = useState(false);

  // Custom hooks:
  const { linkColor } = useBranding();
  const { isLandscape, isPhone, isTablet } = useScreen();

  // Effects:
  useEffect(() => {
    // startup
    Analytics.logScreen('EPALite');
    return () => {
      // teardown
    };
  }, []);

  // Fetch necessary data on startup
  useEffect(() => {
    if (!isLearner) {
      dispatch(getEstablishments());
      dispatch(getAssessmentFilters('_cat1', Util.screenUrl(1), null)); // borrow assessment filters to get cohorts list
    }
    fetchCourses();
  }, []);
  // fetchCourses when completed invokes this:
  useEffect(() => {
    // only want to do this after courses refreshed else can show picker of all courses before resticting it to just the evidence item courses
    if (!initialising) {
      setCourses(mergeCourses());
    }
  }, [initialising]);
  // which then invokes this to show picker or auto-pick the course if only 1:
  useEffect(() => {
    // if no course selected (won't be because this only called on startup) invoke the course selection now
    if (!!courses && courses.length > 0 && !!courseRef && !courseId) {
      if (!!courses && courses.length === 1) {
        // auto-select if only one
        pickCourse(courses[0].id.toString());
      } else {
        courseRef.show();
      }
    }
  }, [courses]);

  useEffect(() => {
    if (!!courseId && !!person) {
      setSelectedAllAssessments(false);
      setView(null);
      fetchDetail();
    }
  }, [courseId, person]);

  // Styles:
  const styles = EStyleSheet.create({
    container: { flex: 1 },
  });

  // Local methods:
  const fetchCourses = async () => {
    try {
      setLoading(true);
      await dispatch(getMyCourses(true));
      setLoading(false);
      setInitialising(false);
    } catch (err) {
      logger(err);
      setLoading(false);
      Toast.showError($translate('GENERIC.X_FETCH_FAILURE', { entity: $labels.OLL.COURSE }));
    }
  };

  const fetchDetail = async () => {
    try {
      if (!isQuerying) { // prevent double-load as can sometimes happen in learner view, needs state separate from loading
        setIsQuerying(true);
        const v: IEPAView = await dispatch(getEPA(courseId, person?.id || ''));
        setView(v);
        setAvailableAssessments(v.modules.reduce((arr: string[], m) => arr.concat(m.evidenceActivities.reduce((arr2: string[], ass) => arr2.concat(ass.guid), [])), []).length);
        setIsQuerying(false);
      }
    } catch (err) {
      setLoading(false);
      setIsQuerying(false);
      Toast.showError($labels.EPA.ERR_EPA_VIEW);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchDetail();
    setRefreshing(false);
  };

  // PAGED COURSE LEARNERS VIA REACT-QUERY (since we already have this elsewhere)
  const queryKey = () => ['getCourseLearnerList', { courseId, establishments, cohorts }];
  const {
    isFetching, isFetchingNextPage, fetchNextPage, hasNextPage, isLoading, isError, data, status, refetch
  } = useInfiniteQuery(
    queryKey(), // query id and any extra query params
    ({ pageParam = 0 }) => getCourseLearnerList(courseId, establishments, cohorts, pageParam),
    {
      // A getNextPageParam option is available for both determining if there is more data to load and the
      // information to fetch it. This information is supplied as an additional parameter in the query function
      getNextPageParam: (lastPageInfo) => {
        return lastPageInfo.page < lastPageInfo.lastPage ? lastPageInfo.page + 1 : false; // return page number of next if more is available, else falsy
      },
      onError: (err) => {
        Toast.showError($labels.OLL.QUERY_ASSIGNED_USER_ERROR, 3000);
      },
      enabled: !!courseId, // only query when we have a course ID!
      retry: false,
      refetchOnMount: true,
      staleTime: 60000 // dont requery same data if last queried less than a minute ago
    });
  // flatten the paged data to show in our user picker
  useEffect(() => {
    let users: IPersonCourse[] = !data || data.pages.length === 0 ? [] : _.flatten(data.pages.map((p: IPageInfo) => p.extraData));
    if (isLearner) {
      users = users.filter((u) => u.id === Util.GetMyID().toString());
    }
    setAssignedLearners(users);
    if (users.length === 1) {
      pickUser(users[0]);
    }
  }, [data]);
  useEffect(() => {
    // when last person selected check if there are more to fetch
    if (!!person && assignedLearners.length > 0 && person.id === assignedLearners[assignedLearners.length - 1].id && hasNextPage && !isFetching) {
      fetchNextPage(); // this gets the next page based on the getNextPageParam result
    }
  }, [person]);

  const pickCourse = async (_courseId: string) => {
    setCourseId(_courseId);
    setRole(getRoleForCourse(_courseId));
    setPerson(null);
    setView(null);
  };

  const pickUser = (pc: IPersonCourse | null) => {
    setPerson(pc);
  };

  const prevUser = (): IPersonCourse | null => {
    if (!person) {
      return null;
    }
    const index = assignedLearners.findIndex((p) => p.id === person.id);
    if (index <= 0) {
      return null;
    }
    return assignedLearners[index - 1];
  };

  const nextUser = (): IPersonCourse | null => {
    if (!person) {
      return null;
    }
    const index = assignedLearners.findIndex((p) => p.id === person.id);
    if (index === -1 || index >= assignedLearners.length - 1) {
      return null;
    }
    return assignedLearners[index + 1];
  };

  const gotoAssessment = async (guid: string) => {
    try {
      setLoading(true);
      const hdr = await dispatch(getAssessmentWithHeader(guid));
      setLoading(false);
      if (!!hdr) {
        navigation.navigate('OtherAssessment', {
          sortedHeaders: [hdr],
          currentAssessmentIndex: 0,
          learnerSubmission: role === 1
        });
      }
    } catch (e) {
      setLoading(false);
      Toast.showWarning($labels.ASSESSMENT.NAV_ISSUE);
    }
  };

  const toggleAssessment = (guid: string) => {
    const keys = [...selectedAssessments];
    const idx = _.indexOf(keys, guid);
    if (idx !== -1) {
      keys.splice(idx, 1);
    } else {
      keys.push(guid);
    }
    setSelectedAssessments(keys);
  };
  const toggleAllAssessments = () => {
    if (selectedAllAssessments) {
      setSelectedAssessments([]);
    } else if (!!view) {
      setSelectedAssessments(view.modules.reduce((arr: string[], m) => arr.concat(m.evidenceActivities.reduce((arr2: string[], ass) => arr2.concat(ass.guid), [])), []));
    }
    setSelectedAllAssessments(!selectedAllAssessments);
  };

  const onScroll = (contentOffset: any) => {
    const y = contentOffset.y;
    if (y > 140 && !headerMinimised) {
      Anim.EaseNext(500);
      setHeaderMinimised(true);
    } else if (y < 130 && headerMinimised) {
      Anim.EaseNext(500);
      setHeaderMinimised(false);
    }
  };

  const askExport = async () => {
    setExporting(true);
  };

  // Render methods:
  const renderFilter = () => {
    return (
      <View style={{ flexDirection: isTablet ? 'row' : 'column', padding: 10 }}>
        <CodePicker single mandatory
          disabled={!!courseId && courses.length === 1}
          style={[isTablet && { flex: 1 }, commonStyles.shadow]}
          boxStyle={{ borderRadius: 8 }}
          ref={(ref) => courseRef = ref}
          autoHeight={courses.length < 15}
          title={$labels.OLL.PICK_COURSE}
          data={Util.arrayToMap(courses, 'id')}
          dataProperty={'title'}
          sortProperty={'sequence'}
          noIcon={isLearner && courses.length === 1}
          dataFormat={(course: ICourse) => (
            <View style={{ flex: 1 }}>
              <RowView>
                <Text style={{ flex: 1, fontSize: 18 }}>{Util.stripReturns(course.title)}</Text>
                {__DEV__ && isResponsibleCourse(course) && <Icon name='user-tie' type='FontAwesome5' style={{ paddingLeft: 8, color: 'dimgray', fontSize: 18 }} />}
                {__DEV__ && isAssignedCourse(course) && <Icon name='user' type='FontAwesome5' style={{ paddingLeft: 8, color: 'dimgray', fontSize: 18 }} />}
              </RowView>
            </View>
          )}
          selectedKeys={!!courseId ? [courseId] : []}
          onSelectionChanged={(keys) => pickCourse(keys.length > 0 ? keys[0] : '')}
          placeholder={$labels.OLL.PICK_COURSE}
        />
        {!isLearner && <RowView style={[commonStyles.shadow, { marginHorizontal: -3 }, isTablet ? { flex: 1, marginLeft: 12 } : { marginTop: 6 }]}>
          <RoundButton
            disabled={!courseId || !person || prevUser() === null}
            iconName='chevron-left' hollowBorder={1} radius={8}
            style={{ height: 40, marginRight: -1, borderTopRightRadius: 0, borderBottomRightRadius: 0, paddingHorizontal: 10, shadowOpacity: 0, elevation: 0 }}
            onPress={() => setPerson(prevUser())}
          />
          <CodePicker single mandatory
            style={[{ flex: 1 }]}
            boxStyle={{ borderRadius: 0, maxHeight: 40 }}
            disabled={!courseId || isLearner}
            activity={loading || isFetching}
            title={$labels.FORMATIVE.PICK_LEARNER}
            data={Util.arrayToMap(assignedLearners, 'id', true)}
            dataProperty={'displayName'}
            sortProperty={'sortKey'}
            selectedKeys={!!person ? [person.id] : []}
            onSelectionChanged={(keys) => pickUser(keys.length > 0 ? (assignedLearners.find((pc) => pc.id === keys[0]) || null) : null)}
            placeholder={$labels.FORMATIVE.PICK_LEARNER}
            noSearch
            noIcon={isLearner}
            customFilter={() => isLearner ? undefined : (
              <View style={{ padding: 8 }}>
                <CodePicker title={$labels.CONFIG.ESTABLISHMENTS}
                  boxStyle={{ paddingLeft: 8, borderRadius: 8 }}
                  onSelectionChanged={(keys) => setEstablishments(keys)}
                  selectedKeys={establishments}
                  data={allEstablishments}
                  placeholder={$labels.FILTER.ALL_CLUBS}
                />
                {!_.isEmpty(cohortsFilter) && <CodePicker title={cohortsFilter.title}
                  style={{ marginTop: 5 }} boxStyle={{ paddingLeft: 8, borderRadius: 8 }}
                  onSelectionChanged={(keys) => setCohorts(keys)}
                  selectedKeys={cohorts}
                  data={cohortsFilter.values}
                  placeholder={cohortsFilter.values[''] || 'All Cohorts'}
                />}
              </View>
            )}
            onEndReachedThreshold={0}
            onEndReached={() => {
              if (hasNextPage && !isFetching) { // hasNextPage is set by use... based on whether getNextPageParam returns a truthy
                fetchNextPage();      // this gets the next page based on the getNextPageParam result
              }
            }}
            ListFooterComponent={<InlineSpinner style={{ alignSelf: 'center', marginTop: 0, marginBottom: 0 }} visible={!!isFetchingNextPage} />}
          />
          <RoundButton
            disabled={!courseId || !person || nextUser() === null}
            iconName='chevron-right' hollowBorder={1} radius={8}
            style={{ height: 40, marginLeft: -2, paddingHorizontal: 10, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, shadowOpacity: 0, elevation: 0 }}
            onPress={() => setPerson(nextUser())}
          />
          {/* <RoundButton disabled={!courseId || !allEstablishments || Object.values(allEstablishments).length < 1} iconName='search' hollowBorder={1} radius={8} style={{height: 40, marginLeft: -4, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, paddingHorizontal: 8, shadowOpacity: 0, elevation: 0}}  /> */}
        </RowView>}
      </View>
    );
  };

  const renderHeader = () => {
    // eslint-disable-next-line eqeqeq
    const course = courses.find((c) => c.id == courseId);
    const courseName = !course ? '' : course.title;
    const hdrStyle = { fontSize: isTablet ? 14 : 12, color: '#555', flex: 1 };
    return (
      <View style={{ paddingHorizontal: 12, paddingBottom: 4, borderBottomWidth: EStyleSheet.hairlineWidth, borderBottomColor: '#666' }}>
        <View style={{ marginBottom: 4 }}>
          {!!person && <RowView left>
            {!headerMinimised && <ProfileImage square url={person?.profileImageUrl || ''} size={isTablet ? 60 : 40} />}
            {!headerMinimised && <View style={{ flex: 1, paddingLeft: 10 }}>
              <Text style={{ fontSize: 16 }}>{person.displayName}</Text>
              {!!courseName && <Text style={{ fontSize: isTablet ? 18 : 16, color: '#666' }}>{courseName}</Text>}
            </View>}
            {headerMinimised && !!view && <Text style={[hdrStyle]}>{$translate('EPA.CRITERIA_COUNTS', { count: view.criteriaAchieved, total: view.criteriaCount })}</Text>}
            <IconWithHint iconName='cog' type='FontAwesome' iconStyle={{ fontSize: 24, color: linkColor }} hintComponent={() => (
              <View>
                <CheckBox label={$labels.EPA.ASSESSMENT_SCORES} labelStyle={{ color: '#444' }} square size={24} outerStyle={{ marginBottom: 4 }} checked={showAssessmentScores} onPress={() => { Anim.EaseNext(); setShowAssessmentScores(!showAssessmentScores); }} />
                <CheckBox label={$labels.EPA.CRITERIA_SCORES} labelStyle={{ color: '#444' }} square size={24} checked={showCriteriaScores} onPress={() => { Anim.EaseNext(); setShowCriteriaScores(!showCriteriaScores); }} />
              </View>
            )} />
          </RowView>}
        </View>
        {renderSummary()}
        {renderFixedHeader()}
      </View>
    );
  };

  const renderGraph = (extraStyle: any = {}) => {
    if (!view) {
      return null;
    }
    const max = Math.max(...view.chartData.map((c) => c.count), 0);
    return (
      <View style={[{ alignItems: 'center' }, extraStyle]}>
        <Text style={{ fontSize: 10, color: '#777' }}>{$labels.EPA.CRITERIA_SCORING}</Text>
        <RowView style={{ maxWidth: 240, height: 70 }} nowrap left>
          {view.chartData.map((col) => {
            const h = max === 0 ? 0 : Math.round((55 * col.count) / max);
            return (
              <View key={`col_${col.score}`} style={{ flex: 1, alignItems: 'center', height: 63 }}>
                <View style={{ width: '90%', height: 55, justifyContent: 'flex-end' }}>
                  {h > 0 && h <= 27 && <Text style={{ fontSize: 10, paddingTop: 1, textAlign: 'center', color: '#aaa' }}>{col.count}</Text>}
                  <View style={{ width: '100%', height: h, minHeight: EStyleSheet.hairlineWidth, backgroundColor: col.count === 0 ? '#bbb' : col.backgroundColor }}>
                    {h > 27 && <Text style={{ fontSize: 10, paddingTop: 1, textAlign: 'center', color: Colour.getContrastColour(col.backgroundColor) + 'cc' }}>{col.count}</Text>}
                  </View>
                </View>
                <Text style={{ fontSize: 10, color: '#555' }}>{col.score}</Text>
              </View>
            );
          })}
        </RowView>
      </View>
    );
  };

  const renderSummary = () => {
    if (!person || !view) {
      return null;
    }
    const hdrStyle = { fontSize: isTablet ? 14 : 12, color: '#555' };
    return (
      <View>
        {!headerMinimised && <RowView nowrap left bottom style={{ marginBottom: 10 }}>
          <View>
            <View>
              <Text style={[hdrStyle]}>{$translate('EPA.CRITERIA_COUNTS', { count: view.criteriaAchieved, total: view.criteriaCount })}</Text>
              <Pie radius={32} innerRadius={16} strokeCap={'butt'} backgroundColor={'#ddd'} dividerSize={0}
                sections={[
                  { percentage: view.criteriaCount < 1 ? 0 : (view.criteriaAchieved * 100) / view.criteriaCount, color: Theme.green }
                ]}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            {renderGraph({ marginHorizontal: 10 })}
          </View>
        </RowView>}
        <RowView left>
          <Text style={[hdrStyle, { marginRight: 8 }]}>{$translate('EPA.SELECTED', { count: selectedAssessments.length })}</Text>
          <Text style={[hdrStyle, { flex: 1 }]}>{$translate('EPA.AVAILABLE', { total: availableAssessments })}</Text>
          <RoundButton disabled={selectedAssessments.length === 0} small style={{ alignSelf: 'flex-end', marginTop: 4, marginRight: -2 }} hollowBorder={2} radius={8} label={$labels.EPA.EXPORT} iconName={'cloud-download'} onPress={() => askExport()} />
        </RowView>
      </View>
    );
  };

  const twoColumn = isLandscape;
  const renderFixedHeader = () => {
    if (!person || !view) {
      return null;
    }
    const hdrStyle = { fontSize: isTablet ? 12 : 10, color: '#999' };
    return (
      <RowView>
        {!!twoColumn && <Text style={[hdrStyle, { flex: twoColumn ? 1 : 0 }]}>{$labels.OLL.MODULE}</Text>}
        <RowView nowrap left style={{ marginTop: 4, flex: twoColumn ? 2 : 0 }}>
          <CheckBox square size={isTablet ? 24 : 20} outerStyle={{ marginRight: 8 }} checked={selectedAllAssessments} onPress={() => toggleAllAssessments()} />
          <Text style={[hdrStyle, { flex: 2 }]}>{$labels.EPA.EVIDENCE_ACTIVITY}</Text>
          <Text style={[hdrStyle, { flex: 1 }]}>{$labels.EPA.CRITERIA}</Text>
          <Text style={[hdrStyle, { width: 20, textAlign: 'right' }]}>{$labels.FORMATIVE.ATTEMPT_SHORT}</Text>
          <Text style={[hdrStyle, { width: isPhone ? 70 : 80, textAlign: 'right' }]}>{$labels.ASSESSMENT.COMPLETED}</Text>
          {showAssessmentScores && <Text style={[hdrStyle, { width: 36, textAlign: 'right' }]}>{$labels.COMMON.SCORE}</Text>}
          <LinkButton iconName='chevron-right' iconStyle={{ marginLeft: 10, fontSize: isPhone ? 20 : 24, color: 'transparent' }} />
        </RowView>
      </RowView>
    );
  };

  const sortActivities = (a: IEPAAssessment[]): IEPAAssessment[] => {
    return a.sort((a1, a2) => {
      // Sort by criteria by activity name by attempt (should really be by topic sequence by attempt but back-end doesnt iterate topics properly (yet))
      const key1 = (a1.criteria.length === 0 ? '_' : a1.criteria[0]) + a1.name + a1.attempt.toString();
      const key2 = (a2.criteria.length === 0 ? '_' : a2.criteria[0]) + a2.name + a2.attempt.toString();
      return key1 < key2 ? -1 : key1 > key2 ? 1 : 0;
    });
  };

  const renderExportModal = () => {
    return (
      <InModal noX title={$labels.EPA.EXPORT} style={{ borderRadius: 10 }} adjustHeight isVisible={exporting} onClose={() => setExporting(false)}>
        <View style={{ padding: 10, backgroundColor: '#eee' }}>
          <Text>{$labels.EPA.EMAIL_PROMPT}</Text>
          <TextInput
            style={[{ margin: 16 }, commonStyles.textInput]}
            value={email}
            autoCapitalize={'none'}
            autoCorrect={false}
            spellCheck={false}
            placeholder={$labels.EPA.EMAIL}
            onChangeText={(text) => setEmail(text)}
            importantForAutofill={'no'}
          />
          <CheckBox square disabled={sending} checked={openLink} onPress={() => setOpenLink(!openLink)} label={$labels.EPA.DOWNLOAD} secondaryLabel={$labels.EPA.DOWNLOAD_HINT} />
          <RowView style={{ marginTop: 16 }}>
            <RoundButton radius={8} disabled={false} backColor={Theme.green} label={$labels.EPA.EXPORT} onPress={async () => {
              try {
                if (sending || !courseId || !person || selectedAssessments.length === 0) {
                  return;
                }
                if (!email || !EmailValidator.validate(email)) {
                  Toast.showError($labels.EPA.EMAIL_INVALID);
                } else {
                  Keyboard.dismiss();
                  setSending(true);
                  const _link = await dispatch(exportEPA(email, courseId, person.id, selectedAssessments, openLink));
                  // _link = 'https://emslfe.innovedapp.co.uk/downloadLink/15/cdaa712a7a5a72713e41738f18984e4212d6b28b/60819b35a1d00.zip';
                  setSending(false);
                  if (openLink) {
                    setExporting(false); // closes the modal
                    setTimeout(() => {
                      // must wait until modal closes
                      const file: IEvidence = {
                        guid: 'x', ownerGuid: 'x', name: Util.getFileFromPath(_link).replace('.zip', ''), description: '', size: 0, type: 'zip',
                        url: _link, thumbnailUrl: '', deleteUrl: '', readOnly: true, extension: 'zip', pending: false,
                        percentageComplete: 0, path: '', tags: [], fixedTags: [],
                        entityType: '', entityId: '', author: Util.GetMyName(),
                        createdDate: Util.now(), updatedDate: null
                      };
                      navigation.navigate('ViewEvidence', {evidence: file, forcePreload: true});
                    }, 600);
                  } else {
                    setExporting(false); // closes the modal
                    Toast.showSuccess($labels.EPA.OK_EPA_EXPORT, 5000);
                  }
                }
              } catch (err) {
                setSending(false);
                Toast.showError($labels.EPA.ERR_EPA_EXPORT + ' ' + ErrorService.extractErrors(err), 5000, 'exp');
              }
            }} busy={sending} iconName={'cloud-download'} iconAfterText />
            <RoundButton radius={8} disabled={sending} backColor={'#777'} hollowBorder={2} label={$labels.COMMON.CANCEL} onPress={() => {
              setExporting(false); // close the modal
            }} />
          </RowView>
        </View>
        <InToast id='exp' />
      </InModal>
    );
  };

  const renderDetail = () => {
    if (!view) {
      return null;
    }
    const txtStyle = { fontSize: isTablet ? 14 : 12, color: '#222' };
    const rowStyle = { borderBottomWidth: 1.5, borderBottomColor: '#ddd', paddingTop: 6 };
    const subrowStyle = { borderBottomWidth: EStyleSheet.hairlineWidth, borderBottomColor: '#ccc' };
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', paddingVertical: 10 }}>
        <FlatList style={{ flex: 1 }}
          data={view.modules}
          ItemSeparatorComponent={() => <View style={rowStyle} />}
          renderItem={({ item: m }) => (
            <View style={[{ marginHorizontal: 10, flexDirection: twoColumn ? 'row' : 'column' }]}>
              <Text style={{ fontWeight: 'bold', paddingVertical: 6, fontSize: 16, flex: twoColumn ? 1 : 0 }}>{m.moduleName}</Text>
              <View style={[{ flex: twoColumn ? 2 : 0 }]}>
                <FlatListCustom
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={subrowStyle} />}
                  data={sortActivities(m.evidenceActivities)}
                  keyExtractor={(item) => item.guid}
                  initialNumToRender={m.evidenceActivities.length}
                  renderItem={({ item: ea }) => (
                    <RowView nowrap left top style={{ marginVertical: 6 }}>
                      <CheckBox square size={isTablet ? 24 : 20} outerStyle={{ marginRight: 8 }} checked={selectedAssessments.indexOf(ea.guid) > -1} onPress={() => toggleAssessment(ea.guid)} />
                      <Text style={[txtStyle, { flex: 2, paddingRight: 4 }]} onPress={() => toggleAssessment(ea.guid)}>{ea.name}</Text>
                      <RowView left style={{ flex: 1 }}>
                        {ea.criteria.map((ec, i) => {
                          const col = !showCriteriaScores || !ec.score || !view.scoringInfo?.rangeList ? '#999' : Util.getRangeFromValue(ec.score, view.scoringInfo.rangeList)?.backgroundColor || '#999';
                          return (
                            <View key={`${ea.guid}_${i}`} style={{ marginRight: isTablet ? 3 : 2, paddingHorizontal: isTablet ? 3 : 1, borderBottomWidth: showCriteriaScores ? 5 : 0, borderBottomColor: col }} >
                              <Text style={[txtStyle]}>{ec.shortCode}</Text>
                            </View>
                          );
                        })}
                      </RowView>
                      <Text style={[txtStyle, { width: 20, textAlign: 'right' }]}>{ea.attempt}</Text>
                      <Text style={[txtStyle, { width: isPhone ? 70 : 80, textAlign: 'right', fontSize: 12 }]}>{Util.formatDate(ea.completedDate, isPhone)}</Text>
                      {showAssessmentScores && !!ea.score && <ScorePill style={{ width: 36 }} scoreDefiner={view.scoringInfo || { scoreOutOf: null, gradeList: [], rangeList: [], rangeListHeader: null }} value={ea.score} dimension={null} expression={null} />}
                      {showAssessmentScores && !ea.score && <Text style={{ width: 36, textAlign: 'center', color: '#aaa', paddingLeft: 10 }}>{'—'}</Text>}
                      <LinkButton iconName='chevron-right' iconStyle={{ marginLeft: 10, fontSize: isPhone ? 20 : 24 }} onPress={() => gotoAssessment(ea.guid)} />
                    </RowView>
                  )}
                />
              </View>
            </View>
          )}
          keyExtractor={(item, index) => item.moduleId}
          scrollEventThrottle={16} onScroll={(event: any) => availableAssessments > 30 && onScroll(event.nativeEvent.contentOffset)}
          onRefresh={() => refresh()}
          refreshing={refreshing}
        />
      </View>
    );
  };

  // Main render:
  return (
    <View style={{ flex: 1, backgroundColor: '#eee' }}>
      <SimpleHeader
        activity={loading || isQuerying || ((isLoading || isFetching) && !isFetchingNextPage)}
        left={
          <RowView>
            <LinkButton iconName='chevron-left'
              iconStyle={{ paddingRight: 8, fontSize: 26, color: Branding.WallpaperForeground() }}
              onPress={() => navigation.goBack()}
            />
          </RowView>}
        title={$labels.EPA.TITLE}
        right={
          <HelpMenu />
        }
      />
      <View style={{ flex: 1 }}>
        {renderFilter()}
        {renderHeader()}
        {renderDetail()}
        <ScreenSpinner visible={(loading || isQuerying) && !refreshing} />
      </View>
      {renderExportModal()}
    </View>
  );
};
