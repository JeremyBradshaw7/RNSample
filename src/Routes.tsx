import 'react-native-gesture-handler'; // https://github.com/kmagiera/react-native-gesture-handler/issues/320
import React from 'react';
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Welcome from './screens/Welcome';
import About from './screens/About';
import Settings from './screens/Settings';
import LibraryContainer from './screens/Library';
import { WallpaperPrimaryColor } from './components/Wallpaper';
import { logger } from './services/logger';
import { ViewChart } from './screens/ViewChart';
import BurgerMenu from './components/BurgerMenu';
import Login from './screens/Login';
import ResetPassword from './screens/ResetPassword';
import AssessmentsContainer from './screens/Assessments';
import UserList from './screens/AssessmentReport/UserList';
import AssessmentList from './screens/AssessmentReport/AssessmentList';
import AssessmentNavigable from './screens/Assessment/AssessmentNavigable';
import WebViewNavigable from './screens/WebViewNavigable';
import { ViewEvidence } from './screens/ViewEvidence';
import CPDAssessmentsContainer from './screens/CPD_Original/CPDAssessments';
import CPDAssessmentNavigable from './screens/CPD_Original/CPDAssessment/CPDAssessmentNavigable';
import MyCPDContainer from './screens/CPD_Original/MyCPD';
import ChangePassword from './screens/ChangePassword';
import Courses from './screens/OnlineLearning/Courses';
import Establishment from './screens/OnlineLearningEdit/Establishment';
import CourseEdit from './screens/OnlineLearningEdit/CourseEdit';
import ModuleEdit from './screens/OnlineLearningEdit/ModuleEdit';
import TopicEdit from './screens/OnlineLearningEdit/TopicEdit';
import ItemEdit from './screens/OnlineLearningEdit/ItemEdit';
import ContentEdit from './screens/OnlineLearningEdit/ContentEdit';
import ContentView from './screens/OnlineLearning/ContentView';
import Course from './screens/OnlineLearning/Course';
import { CourseAssign } from './screens/OnlineLearning/Courses/CourseAssign';
import Establishments from './screens/OnlineLearningEdit/Establishments';
import { ConfigLandingPage } from './screens/Config';
import { AssessmentConfigurations } from './screens/Config/AssessmentConfigurations';
import { AssessmentConfiguration } from './screens/Config/AssessmentConfiguration';
import { AssessmentType } from './screens/Config/AssessmentType';
import { FieldLocations } from './screens/Config/FieldLocations';
import { CommentGroup } from './screens/Config/CommentGroup';
import { GradeList } from './screens/Config/GradeList';
import { RangeList } from './screens/Config/RangeList';
import { ScoringSet } from './screens/Config/ScoringSet';
import { QuestionGroup } from './screens/Config/QuestionGroup';
import AssessmentReport from './screens/AssessmentReport/AssessmentReport';
import { ResponsibilitiesConfig } from './screens/ResponsibilitiesConfig';
import { Notifications } from './screens/Notifications';
import LearnersContainer from './screens/ActivityLogs/Learners';
import LearnerNavigable from './screens/ActivityLogs/Learner/LearnerNavigable';
import { EmsTaskList } from './screens/EmsCourses/EmsTaskList';
import { $labels } from './services/i18n';
import { EmsTask } from './screens/EmsCourses/EmsTask';
import { FormativeRoot } from 'screens/Formative/CourseLearner';
import FormativeViewNavigable from 'screens/Formative/FormativeViewNavigable';
import { Qualifications } from 'screens/DAPConfig/Qualifications';
import { Qualification } from 'screens/DAPConfig/Qualifications/Qualification';
import { CPDActivities } from 'screens/DAPConfig/CPDActivities';
import { CPDActivity } from 'screens/DAPConfig/CPDActivities/CPDActivity';
import { CPDActivityGroups } from 'screens/DAPConfig/CPDActivityGroups';
import { CPDActivityGroup } from 'screens/DAPConfig/CPDActivityGroups/CPDActivityGroup';
import { CPDActivitiesAssign } from 'screens/DAP/CPDActivityAssign';
import { CPDActivityAssign } from 'screens/DAP/CPDActivityAssign/CPDActivityAssign';
import BulkAssessments from 'screens/BulkAssessments';
import { PdfPager } from 'screens/PdfPager';
import { Metrics } from 'screens/Metrics/Metrics';
import { Persons } from 'screens/Persons';
import { Person } from 'screens/Persons/Person';
import Util from 'services/Util';
import { DisciplineReports } from 'screens/ArmyBespoke/DisciplineReports';
import { RecruitDisciplineReports } from 'screens/ArmyBespoke/RecruitDisciplineReports';
import { TrainingIntervention } from 'screens/ArmyBespoke/TrainingIntervention';
import { MinorAdministrativeAction } from 'screens/ArmyBespoke/MinorAdministrativeAction';
import WebViewRoot from 'screens/WebViewRoot';
import Api from 'services/Api';
import { QuizResults } from 'screens/OnlineLearning/Quiz/QuizResults';
import { Dashboard } from 'screens/Dashboard';
import { AssessmentTypeHeatmap } from 'screens/Dashboard/AssessmentTypeHeatmap';
import { AssessmentTypePerformanceGraph } from 'screens/Dashboard/AssessmentTypePerformanceGraph';
import { EPALite } from 'screens/EPA/EPALite';
import TableauViewer from 'screens/TableauViewer';
import { FADemo } from 'screens/FADemo';
import { FAModule } from 'screens/FADemo/module';
import { FATopic } from 'screens/FADemo/topic';
import { FAItem } from 'screens/FADemo/item';
import { FADemoDAP } from 'screens/FADemo/dap';
import { Timeline } from 'screens/Timeline';
import { AssessmentVersionList } from 'screens/Config/AssessmentVersionList';

const Stack = createStackNavigator();
const stackOptions = {
  gestureEnabled: false,
  headerShown: false,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
};

/*************************
 * Signed Out routes
 *************************/

export const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={stackOptions} // screenOptions are default options for whole navigator, can be set as options on EACH screen also
      // initialRouteName='Login'
    >
      <Stack.Screen name='Login' component={Login} />
      <Stack.Screen name='About' component={About} />
      <Stack.Screen name='ResetPassword' component={ResetPassword} />
    </Stack.Navigator>
  );
};

/*************************
 * Assessments Stack
 *************************/

export const AssessmentsStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='AssessmentsContainer' component={AssessmentsContainer} />
      <Stack.Screen name='BulkAssessments' component={BulkAssessments} />
      <Stack.Screen name='Assessment' component={AssessmentNavigable} />
      <Stack.Screen name='OtherAssessment' component={AssessmentNavigable} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
      <Stack.Screen name='ViewChart' component={ViewChart} />
      <Stack.Screen name='Web' component={WebViewNavigable} />
      <Stack.Screen name='ContentView' component={ContentView} />
    </Stack.Navigator>
  );
};

/*************************
 * CPD Stack
 *************************/

export const CPDStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='CPDAssessmentsContainer' component={CPDAssessmentsContainer} />
      <Stack.Screen name='CPDAssessmentContainer' component={CPDAssessmentNavigable} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
    </Stack.Navigator>
  );
};

/*************************
 * My CPD Stack
 *************************/

export const MyCPDStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='SelfContainer' component={MyCPDContainer} />
      <Stack.Screen name='CPDAssessmentContainer' component={CPDAssessmentNavigable} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
    </Stack.Navigator>
  );
};

/*************************
 * Library Stack
 *************************/

export const LibraryStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='LibraryContainer' component={LibraryContainer} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
    </Stack.Navigator>
  );
};

/*************************
 * Notifications Stack
 *************************/

export const NotificationsStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='Notifications' component={Notifications} />
      <Stack.Screen name='Assessment' component={AssessmentNavigable} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
      <Stack.Screen name='ViewChart' component={ViewChart} />
      <Stack.Screen name='Web' component={WebViewNavigable} />
      <Stack.Screen name='EmsTaskSingle' component={EmsTask} />
      <Stack.Screen name='RecruitDisciplineReports' component={RecruitDisciplineReports} />
      <Stack.Screen name='TrainingIntervention' component={TrainingIntervention} />
      <Stack.Screen name='MinorAdministrativeAction' component={MinorAdministrativeAction} />
    </Stack.Navigator>
  );
};

/*************************
 * Online Learning Stack
 *************************/

export const OnlineLearningStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='Courses' component={Courses} />
      <Stack.Screen name='Course' component={Course} />
      <Stack.Screen name='CourseAssign' component={CourseAssign} />
      <Stack.Screen name='ContentView' component={ContentView} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
      <Stack.Screen name='ViewChart' component={ViewChart} />
      <Stack.Screen name='Assessment' component={AssessmentNavigable} />
      <Stack.Screen name='OtherAssessment' component={AssessmentNavigable} />
      <Stack.Screen name='Web' component={WebViewNavigable} />
      <Stack.Screen name='EmsTaskSingle' component={EmsTask} />
    </Stack.Navigator>
  );
};

export const FADemoStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='FADemo' component={FADemo} />
      <Stack.Screen name='FAModule' component={FAModule} />
      <Stack.Screen name='FATopic' component={FATopic} />
      <Stack.Screen name='FAItem' component={FAItem} />
      <Stack.Screen name='ContentView' component={ContentView} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
      <Stack.Screen name='ViewChart' component={ViewChart} />
      <Stack.Screen name='Assessment' component={AssessmentNavigable} />
      <Stack.Screen name='OtherAssessment' component={AssessmentNavigable} />
      <Stack.Screen name='Web' component={WebViewNavigable} />
      <Stack.Screen name='EmsTaskSingle' component={EmsTask} />
    </Stack.Navigator>
  );
};

/*************************
 * Settings Stack
 *************************/

export const SettingsStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='Settings' component={Settings} />
      <Stack.Screen name='About' component={About} />
      <Stack.Screen name='ChangePassword' component={ChangePassword} />
      <Stack.Screen name='ResponsibilitiesConfig' component={ResponsibilitiesConfig} />
      {/* Online Learning Content Editing */}
      <Stack.Screen name='Establishments' component={Establishments} />
      <Stack.Screen name='CourseList' component={Establishment} />
      <Stack.Screen name='CourseEdit' component={CourseEdit} />
      <Stack.Screen name='ModuleEdit' component={ModuleEdit} />
      <Stack.Screen name='TopicEdit' component={TopicEdit} />
      <Stack.Screen name='ItemEdit' component={ItemEdit} />
      <Stack.Screen name='ContentEdit' component={ContentEdit} />
      <Stack.Screen name='ContentView' component={ContentView} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
      {/* Configuration */}
      <Stack.Screen name='ConfigLandingPage' component={ConfigLandingPage} />
      <Stack.Screen name='AssessmentConfigurations' component={AssessmentConfigurations} />
      <Stack.Screen name='AssessmentConfiguration' component={AssessmentConfiguration} />
      <Stack.Screen name='AssessmentType' component={AssessmentType} />
      <Stack.Screen name='FieldLocations' component={FieldLocations} />
      <Stack.Screen name='ScoringSet' component={ScoringSet} />
      <Stack.Screen name='GradeList' component={GradeList} />
      <Stack.Screen name='RangeList' component={RangeList} />
      <Stack.Screen name='CommentGroup' component={CommentGroup} />
      <Stack.Screen name='QuestionGroup' component={QuestionGroup} />
      <Stack.Screen name='AssessmentVersionList' component={AssessmentVersionList} />
      <Stack.Screen name='Web' component={WebViewNavigable} />
      {/* DAP Configuration */}
      <Stack.Screen name='CPDActivities' component={CPDActivities} />
      <Stack.Screen name='CPDActivity' component={CPDActivity} />
      <Stack.Screen name='CPDActivityGroups' component={CPDActivityGroups} />
      <Stack.Screen name='CPDActivityGroup' component={CPDActivityGroup} />
      <Stack.Screen name='Qualifications' component={Qualifications} />
      <Stack.Screen name='Qualification' component={Qualification} />
      {/* Persons */}
      <Stack.Screen name='Persons' component={Persons} />
      <Stack.Screen name='Person' component={Person} />
      {/* Other */}
      <Drawer.Screen name='OuraLogin'>
        {() => <WebViewRoot title={$labels.MENU.OuraLogin} url={Api.emsUrl('/oura/login', false, false)} />}
      </Drawer.Screen>
    </Stack.Navigator>
  );
};

/*************************
 * Assessment Report Stack
 *************************/

export const AssessmentReportStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='UserList' component={UserList} />
      <Stack.Screen name='AssessmentList' component={AssessmentList} />
      <Stack.Screen name='AssessmentReport' component={AssessmentReport} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
    </Stack.Navigator>
  );
};

/*************************
 * Activity Logs Stack
 *************************/

export const ActivityLogsStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='ActivityLogsContainer' component={LearnersContainer} />
      <Stack.Screen name='LearnerNavigable' component={LearnerNavigable} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
    </Stack.Navigator>
  );
};

/*************************
 * EMS Tasks Stack
 *************************/

export const EmsTasksStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='EmsTaskList' component={EmsTaskList} />
      <Stack.Screen name='EmsTask' component={EmsTask} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
    </Stack.Navigator>
  );
};

/*************************
* Formative Assessments Stack
*************************/

export const FormativeAssessmentsStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='FormativeRoot' component={FormativeRoot} />
      <Stack.Screen name='FormativeViewNavigable' component={FormativeViewNavigable} />
      <Stack.Screen name='Assessment' component={AssessmentNavigable} />
      <Stack.Screen name='OtherAssessment' component={AssessmentNavigable} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
      <Stack.Screen name='ViewChart' component={ViewChart} />
      <Stack.Screen name='ContentView' component={ContentView} />
      <Stack.Screen name='BulkAssessments' component={BulkAssessments} />
    </Stack.Navigator>
  );
};

/*************************
* EPA Lite Stack
*************************/

export const EPALiteStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='EPALite' component={EPALite} />
      <Stack.Screen name='Assessment' component={AssessmentNavigable} />
      <Stack.Screen name='OtherAssessment' component={AssessmentNavigable} />
      <Stack.Screen name='ViewEvidence' component={ViewEvidence} />
      <Stack.Screen name='ViewChart' component={ViewChart} />
      <Stack.Screen name='ContentView' component={ContentView} />
    </Stack.Navigator>
  );
};

/*************************
* DAP Stack
*************************/

export const DAPStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='CPDActivitiesAssign' component={CPDActivitiesAssign} />
      <Stack.Screen name='CPDActivityAssign' component={CPDActivityAssign} />
    </Stack.Navigator>
  );
};

/*************************
* Army Discipline Reports Stack
*************************/

export const DisciplineReportsStack = () => {
  // logger('render DisciplineReportsStack', Util.isLearner(), Util.isStaff(), Util.isAdmin());
  return (
    <Stack.Navigator screenOptions={stackOptions} initialRouteName={Util.isLearner() ? 'RecruitDisciplineReports' : 'DisciplineReports'}>
      <Stack.Screen name='DisciplineReports' component={DisciplineReports} />
      <Stack.Screen name='RecruitDisciplineReports' component={RecruitDisciplineReports} />
      <Stack.Screen name='TrainingIntervention' component={TrainingIntervention} />
      <Stack.Screen name='MinorAdministrativeAction' component={MinorAdministrativeAction} />
    </Stack.Navigator>
  );
};

/*************************
* Dashboard Stack
*************************/

export const DashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='Dashboard' component={Dashboard} />
      <Stack.Screen name='AssessmentTypeHeatmap' component={AssessmentTypeHeatmap} />
      <Stack.Screen name='AssessmentTypePerformanceGraph' component={AssessmentTypePerformanceGraph} />
      <Stack.Screen name='OtherAssessment' component={AssessmentNavigable} />
      <Stack.Screen name='TableauViewer' component={TableauViewer} />
    </Stack.Navigator>
  );
};

/*************************
 * Timeline Stack - timeline and anything we might want to navigate to from the timeline
 *************************/

 export const TimelineStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='Timeline' component={Timeline} />

      {/* Direct Links from Events */}
      <Stack.Screen name='Assessment' component={AssessmentNavigable} />

      {/* Action Links */}
      <Stack.Screen name='ProgressAssessments' component={AssessmentsStack} />
      <Stack.Screen name='EvidenceAssessments' component={AssessmentsStack} />
      <Stack.Screen name='MyProgressAssessments' component={AssessmentsStack} />
      <Stack.Screen name='MyEvidenceAssessments' component={AssessmentsStack} />
      <Stack.Screen name='Library' component={LibraryStack} />
      <Stack.Screen name='OnlineLearning' component={OnlineLearningStack} />
      <Stack.Screen name='Settings' component={SettingsStack} />
      <Stack.Screen name='FormativeAssessments' component={FormativeAssessmentsStack} />
      <Stack.Screen name='EPALite' component={EPALiteStack} />
      <Stack.Screen name='Metrics' component={Metrics} />
      <Stack.Screen name='Dashboard' component={DashboardStack} />
      <Stack.Screen name='DAP' component={DAPStack} />
      <Stack.Screen name='Notifications' component={NotificationsStack} />
      <Stack.Screen name='CPDAssessments' component={CPDStack} />
      <Stack.Screen name='MyCPD' component={MyCPDStack} />

    </Stack.Navigator>
  );
};

// Now have a Stack for Welcome, so when going Back we can retain sub-menu state (AssessmentsStack, DAPStack) automatically, but wont reanimate or requery via ctr
export const WelcomeStack = () => {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name='Welcome' component={Welcome} />
      <Stack.Screen name='Timeline' component={TimelineStack} />
      <Stack.Screen name='ProgressAssessments' component={AssessmentsStack} />
      <Stack.Screen name='EvidenceAssessments' component={AssessmentsStack} />
      <Stack.Screen name='MyProgressAssessments' component={AssessmentsStack} />
      <Stack.Screen name='MyEvidenceAssessments' component={AssessmentsStack} />
      <Stack.Screen name='DAP' component={DAPStack} />
      <Stack.Screen name='Assessment' component={AssessmentNavigable} />
    </Stack.Navigator>
  );
};

/*************************
 * Main Menu - Drawer
 *************************/

// Temporary placeholders for other stacks that will be developed later, using minimum syntax
// const Learners = () => <Text>Learners</Text>;

const Drawer = createDrawerNavigator();

export const RootStack = () => {
  // logger('render RootStack', Util.isLearner(), Util.isStaff(), Util.isAdmin());
  return (
    <Drawer.Navigator // initialRouteName='Welcome'
      screenOptions={{
        unmountOnBlur: true
      }}
      drawerContentOptions={{
        activeBackgroundColor: 'rgba(255,255,255,0.15)',
        activeTintColor: WallpaperPrimaryColor,
        inactiveTintColor: WallpaperPrimaryColor
      }}
      drawerContent={(props) => <BurgerMenu {...props} />} // ?
      drawerPosition={'left'}
      edgeWidth={0} // 0 stops swipe to show from left
      // minSwipeDistance={900}
      // drawerType={'front'}
      overlayColor={'rgba(0,0,0,0.85)'}
    >
      <Drawer.Screen name='Welcome' component={WelcomeStack} />
      <Drawer.Screen name='Timeline' component={TimelineStack} />

      {/* These dummy menu options for FADEMO: */}
      <Drawer.Screen name='MRP' component={Welcome} />
      <Drawer.Screen name='CPL' component={Welcome} />
      <Drawer.Screen name='MYD' component={FADemoDAP} />
      <Drawer.Screen name='CDI' component={Welcome} />
      <Drawer.Screen name='NAE' component={Welcome} />
      <Drawer.Screen name='FADemo' component={FADemoStack} />

      <Drawer.Screen name='OnlineLearning' component={OnlineLearningStack} />
      <Drawer.Screen name='FormativeAssessments' component={FormativeAssessmentsStack} />
      <Drawer.Screen name='EPALite' component={EPALiteStack} />
      <Drawer.Screen name='ProgressAssessments' component={AssessmentsStack} />
      <Drawer.Screen name='EvidenceAssessments' component={AssessmentsStack} />
      <Drawer.Screen name='DAP' component={DAPStack} />
      <Drawer.Screen name='Metrics' component={Metrics} />
      <Drawer.Screen name='Dashboard' component={DashboardStack} />
      <Drawer.Screen name='Notifications' component={NotificationsStack} />
      <Drawer.Screen name='Library' component={LibraryStack} />
      <Drawer.Screen name='ActivityLogs' component={ActivityLogsStack} />
      <Drawer.Screen name='Settings' component={SettingsStack} />
      <Drawer.Screen name='MyProgressAssessments' component={AssessmentsStack} />
      <Drawer.Screen name='MyEvidenceAssessments' component={AssessmentsStack} />
      <Drawer.Screen name='AssessmentReport' component={AssessmentReportStack} />

      {/* These dummy menu options for AUDITDEMO: */}
      {/* <Drawer.Screen name='CPRC' component={Welcome} />P
      <Drawer.Screen name='SPRC' component={Welcome} />
      <Drawer.Screen name='AAF' component={Welcome} />
      <Drawer.Screen name='AGCS' component={Welcome} />
      <Drawer.Screen name='CGCS' component={Welcome} /> */}

      <Drawer.Screen name='MyCPD' component={MyCPDStack} />
      <Drawer.Screen name='CPDAssessments' component={CPDStack} />
      <Drawer.Screen name='EmsTaskList' component={EmsTasksStack} />
      {Util.PDFFolders() && <Drawer.Screen name='PdfPager' component={PdfPager} />}
      <Drawer.Screen name='DisciplineReports' component={DisciplineReportsStack} />
      <Drawer.Screen name='QuizResults' component={QuizResults} />
      <Drawer.Screen name='Logout' component={Welcome} />
      <Drawer.Screen name='ViewEvidence' component={ViewEvidence} />
    </Drawer.Navigator>
  );
};

  // These were all dummy PAR options on the menu
  // Learners: { screen: Welcome },
  // Staff: { screen: Welcome },
  // Attendance: { screen: Welcome },
  // OffTheJobHours: { screen: Welcome },
  // KnowledgeMarking: { screen: Welcome },
  // SkillsExerciseAssessments: { screen: Welcome },
  // WorkplaceReviewVisits: { screen: Welcome },
  // Evidence: { screen: Welcome },
  // EmsWorkForAssessment: {
  //   screen: () => <WebViewRoot title={$labels.MENU.EmsWorkForAssessment} url={Api.emsUrl('/ems/assessment/outstanding-work', true, false)} />
  // },
