import React from 'react';
import { connect } from 'react-redux';
import { View, Text, FlatList, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import { LearnerSubheader } from './LearnerSubheader';
import { IState } from 'appstate';
import { logger } from 'services/logger';
import { $labels, $translate } from 'services/i18n';
import Toast from 'services/Toast';
import ScreenInfo from 'services/ScreenInfo';
import ScreenSpinner from 'components/ScreenSpinner';
import _ from 'lodash';
import { IEmsLearner, IActivityLog, NEW_ACTIVITY, IActivityComment } from 'appstate/activityLogs/models';
import { getActivityLogByUser, updateActivityLog, addActivityLog, deleteActivityLog, updateActivityLogComment, addActivityLogComment, deleteActivityLogComment } from 'appstate/activityLogs/actions';
import { savePreferences } from 'appstate/auth/actions';
import { commonStyles } from 'styles/common';
import Theme from 'services/Theme';
import Util from 'services/Util';
import { RowView } from 'components/RowView';
import { Icon, Fab } from 'native-base';
import Anim from 'services/Anim';
import { DateInput } from 'components/DateInput';
import { TimeInput } from 'components/TimeInput';
import EvidenceListContainer from 'components/EvidenceList';
import { Chat } from 'components/Chat';
import { InModal } from 'components/InModal';
import { EventRegister } from 'react-native-event-listeners';
import RoundButton from 'components/RoundButton';
import { InToast } from 'components/InToast';
import { VoiceInput } from 'components/VoiceInput';
import { EvidenceLevel } from 'appstate/evidence/models';

// these are the user prefs we'll use in this screen
interface ActivityPreferences {
  activitySortColumn: 'date' | 'description' | 'minutes';
  activitySortOrder: 'asc' | 'desc';
}

interface Props {
  navigation: any;
  currentLearnerIndex: number;
  sortedLearners: IEmsLearner[];
  currentLearner: IEmsLearner; // from mstp
  activities: IActivityLog[];
  updatePrivilege: boolean;
  createPrivilege: boolean;
  onChangeLearnerIndex?: (index: number) => void;
  screenProps: any;
  getActivityLogByUser: typeof getActivityLogByUser;
  updateActivityLog: typeof updateActivityLog;
  addActivityLog: typeof addActivityLog;
  deleteActivityLog: typeof deleteActivityLog;
  updateActivityLogComment: typeof updateActivityLogComment;
  addActivityLogComment: typeof addActivityLogComment;
  deleteActivityLogComment: typeof deleteActivityLogComment;
  savePreferences: typeof savePreferences;
  preferences: ActivityPreferences;
}

interface State {
  sortedLearners: IEmsLearner[]; // copy of props, updated as currentAssessment fed thru from redux
  scrolling: boolean;
  busy: boolean;
  refreshing: boolean;
  dualPane: boolean;
  editActivity: IActivityLog | null; // activity being edited (or added)
  addActivity: boolean;
  viewingEvidence: boolean; // on viewing evidence from modal want to suppress the modal while viewing
}

class Learner extends React.Component<Props, State> {
  private eventListener: any;

  constructor(props: Props) {
    super(props);
    // logger('_____________________ Learner ctr props ', props.preferences);
    this.state = {
      sortedLearners: props.sortedLearners,
      scrolling: false,
      busy: false,
      refreshing: false,
      dualPane: ScreenInfo.supportsDualPane(),
      editActivity: null,
      addActivity: false,
      viewingEvidence: false
    };
  }

  UNSAFE_componentWillMount() {
    if (this.props.currentLearnerIndex === -1 || !this.props.sortedLearners || !this.props.sortedLearners[this.props.currentLearnerIndex]) {
      return;
    }
    this.fetchLearnerActivity(this.props.currentLearner);
    this.eventListener = EventRegister.addEventListener('ViewEvidence', (data) => {
      this.setState({ viewingEvidence: !!data.shown });
    });
  }
  componentWillUnmount() {
    EventRegister.removeEventListener(this.eventListener);
  }

  UNSAFE_componentWillReceiveProps(newProps: Props) {
    // logger('_____________________ Learner cwrp props ', newProps.preferences);
    if (!!newProps.currentLearner) {
      const index = newProps.sortedLearners.findIndex((a: IEmsLearner) => a.id === newProps.currentLearner.id);
      if (index > -1) {
        const mergedLearners: IEmsLearner[] = newProps.sortedLearners;
        mergedLearners[index] = newProps.currentLearner; // clone?
        this.setState({ sortedLearners: mergedLearners });
      } else {
        this.setState({ sortedLearners: newProps.sortedLearners });
      }
    } else {
      this.setState({ sortedLearners: newProps.sortedLearners });
    }
    if (newProps.currentLearnerIndex === -1 || !newProps.sortedLearners || !newProps.sortedLearners[newProps.currentLearnerIndex]) {
      return;
    }

    // logger('change of learner? ' + this.props.currentLearnerIndex + ' -> ' + newProps.currentLearnerIndex);
    if (newProps.currentLearnerIndex !== this.props.currentLearnerIndex) { // detect change of assessment (on swiping header)
      this.fetchLearnerActivity(newProps.currentLearner);
    }

    // want to update state.editActivity.comments when new comments come through in newProps.activities
    if (!!this.state.editActivity && !!newProps.activities.length) {
      const activity = newProps.activities.find((act: IActivityLog) => this.state.editActivity && act.guid === this.state.editActivity.guid);
      if (activity) {
        // logger('Found activity that matches that being edited', activity);
        this.setState({ editActivity: { ...this.state.editActivity, comments: activity.comments } });
      }
    }
    Anim.EaseNext();
  }

  async fetchLearnerActivity(learner: IEmsLearner) {
    try {
      this.setState({ busy: true });
      await this.props.getActivityLogByUser(learner.id);
      this.setState({ busy: false });
    } catch (err) {
      this.setState({ busy: false });
      Toast.showError($labels.ACTIVITY_LOGS.FETCH_FAILURE);
    }
  }

  onLearnerChange(index: number) {
    if (index >= 0 && index < this.state.sortedLearners.length) {
      this.setState({ busy: true });
      if (this.props.onChangeLearnerIndex) {
        this.props.onChangeLearnerIndex(index);
      }
      this.setState({ busy: false });
    }
  }

  async refresh() {
    this.setState({ refreshing: true });
    await this.fetchLearnerActivity(this.props.currentLearner);
    this.setState({ refreshing: false });
  }

  toggleEdit(activity: IActivityLog) {
    Anim.EaseNext();
    this.setState((prevState) => ({ editActivity: activity }));
  }

  onSort(column: 'date' | 'description' | 'minutes', direction: 'asc' | 'desc') {
    this.props.savePreferences({ activitySortColumn: column, activitySortOrder: direction });
  }
  async addComment(activityGuid: string, comment: string) {
    await this.props.addActivityLogComment(this.props.currentLearner.id, activityGuid, comment);
  }
  async updateComment(activityGuid: string, commentId: string, comment: string) {
    await this.props.updateActivityLogComment(this.props.currentLearner.id, activityGuid, commentId, comment);
  }
  async deleteComment(activityGuid: string, commentGuid: string) {
    await this.props.deleteActivityLogComment(this.props.currentLearner.id, activityGuid, commentGuid);
  }

  onAddActivity() {
    this.setState({
      addActivity: true,
      editActivity: NEW_ACTIVITY(this.props.currentLearner.id)
    }, async () => {
      try {
        if (!!this.state.editActivity) {
          // add blank new activity up-front because we need parent guid for comments/attachments, if exiting without pressing Save button delete it again
          const newGuid: any = await this.props.addActivityLog(this.props.currentLearner.id, this.state.editActivity);
          this.setState({ editActivity: { ...this.state.editActivity, guid: newGuid } });
        }
      } catch (err) {
        logger('ERR', err);
        this.setState({addActivity: false, editActivity: null});
        Toast.showError($labels.ACTIVITY_LOGS.ADD_ACTIVITY_FAILURE);
      }
    });
  }

  async saveActivity() {
    const originalActivity = this.state.addActivity ? NEW_ACTIVITY(this.props.currentLearner.id) : this.props.activities.find((act: IActivityLog) => this.state.editActivity && act.guid === this.state.editActivity.guid);
    if (this.state.addActivity || !originalActivity || !_.isEqual(originalActivity, this.state.editActivity)) { // something's changed
      const errors = {
        description: this.state.editActivity !== null && !this.state.editActivity.description,
        time: this.state.editActivity !== null && this.state.editActivity.minutes <= 0
      };
      if (errors.description) {
        Toast.showError($labels.ACTIVITY_LOGS.MANDATORY_DESCRIPTION, 3000, 'activity');
      }
      if (errors.time) {
        Toast.showError($labels.ACTIVITY_LOGS.MIN_HOURS, 3000, 'activity');
      }
      if (!errors.description && !errors.time) {
        if (this.state.editActivity) {
          try {
            this.setState({ busy: true });
            // new activities creates up front so always an update here now.
            await this.props.updateActivityLog(this.props.currentLearner.id, this.state.editActivity);
            this.setState({ editActivity: null, addActivity: false, busy: false });
            await this.fetchLearnerActivity(this.props.currentLearner); // to see new evidence count
          } catch (err) {
            Toast.showError($labels.ACTIVITY_LOGS.SAVE_ACTIVITY_FAILURE);
            this.setState({ busy: false });
          }
        }
      }
    } else {
      // just close
      this.setState({ editActivity: null, addActivity: false });
    }
  }

  askDeleteActivity() {
    Util.OKCancel(
      $translate('GENERIC.DELETE_X', { entity: $labels.ACTIVITY_LOGS.ACTIVITY }),
      $translate('GENERIC.DELETE_X_CONFIRM', { entity: $labels.ACTIVITY_LOGS.ACTIVITY }),
      $labels.COMMON.YES, $labels.COMMON.NO,
      () => this.deleteActivity()
    );
  }
  async deleteActivity() {
    if (this.state.editActivity) {
      try {
        this.setState({ busy: true });
        // pre-delete comments
        const deleteCommentPromises: any = this.state.editActivity.comments.map((comment: IActivityComment) => this.props.deleteActivityLogComment(this.props.currentLearner.id, (this.state.editActivity || { guid: '' }).guid || '', comment.guid));
        await Promise.all(deleteCommentPromises);
        // same for attachments
        await this.props.deleteActivityLog(this.props.currentLearner.id, this.state.editActivity.guid);
        this.setState({ busy: false });
        this.setState({ editActivity: null });
      } catch (err) {
        Toast.showError($labels.ACTIVITY_LOGS.DELETE_ACTIVITY_FAILURE);
        this.setState({ busy: false });
      }
    }
  }

  renderActivity(activity: IActivityLog) {
    return (
      <TouchableOpacity disabled={!this.props.updatePrivilege} onPress={() => this.toggleEdit(activity)}>
        <View style={styles.activity}>
          <RowView left>
            <Text style={[{ flex: 1, marginRight: 8, fontWeight: 'bold' }]}>{activity.description}</Text>
            <Text style={{ color: 'black' }}>{Util.formatMinutes(activity.minutes)}</Text>
          </RowView>
          <RowView left>
            <Text style={{ flex: 1, color: 'dimgray' }}>{Util.formatDate(activity.date)}</Text>
            {!!activity.comments.length && <Text style={styles.count}><Icon name='comment' type='FontAwesome' style={styles.icon} />{Util.renderSpaces()}{activity.comments.length}</Text>}
            {!!activity.evidenceCount && <Text style={styles.count}>{Util.renderSpaces(2)}<Icon name='paperclip' type='FontAwesome' style={styles.icon} />{Util.renderSpaces()}{activity.evidenceCount}</Text>}
          </RowView>
        </View>
      </TouchableOpacity>
    );
  }

  async cancelEdit() {
    if (!this.state.addActivity) {
      const originalActivity = this.state.addActivity ? NEW_ACTIVITY(this.props.currentLearner.id) : this.props.activities.find((act: IActivityLog) => this.state.editActivity && act.guid === this.state.editActivity.guid);
      if (!!originalActivity && _.isEqual(originalActivity, this.state.editActivity)) { // nothing's changed
        this.setState({ editActivity: null, addActivity: false });
        return;
      }
    }
    Util.OKCancel($labels.COMMON.CANCEL, $labels.ACTIVITY_LOGS.CONFIRM_EDIT_EXIT, $labels.COMMON.YES, $labels.COMMON.NO, async () => {
      logger('cancelEdit');
      if (this.state.addActivity && !!this.state.editActivity) {
        // delete the pending activity and comments/attachments
        logger('deleteActivity');
        await this.deleteActivity();
        logger('deleted');
      }
      logger('clear');
      this.setState({ editActivity: null, addActivity: false });
    });
  }

  render() {
    if (this.props.currentLearnerIndex === -1) {
      return null;
    }
    const learner = this.props.currentLearner;
    if (!learner) {
      return null; // not ready
    }
    return (
      <View
        style={styles.container}
      >
        <View style={[styles.hline, commonStyles.shadow]}>
          <LearnerSubheader
            learnerList={this.state.sortedLearners}
            learnerIndex={this.props.currentLearnerIndex}
            onAddActivity={this.onAddActivity.bind(this)}
            onSort={this.onSort.bind(this)}
            onIndexChange={this.onLearnerChange.bind(this)}
            createPrivilege={this.props.createPrivilege}
            sortColumn={this.props.preferences.activitySortColumn}
            sortOrder={this.props.preferences.activitySortOrder}
          />
        </View>
        <FlatList
          style={{ flex: 1 }}
          scrollEnabled={true}
          refreshControl={
            <RefreshControl
              onRefresh={this.refresh.bind(this)}
              refreshing={this.state.refreshing}
            />
          }
          data={_.orderBy(this.props.activities.filter((act: IActivityLog) => act.description !== ''), [this.props.preferences.activitySortColumn], [this.props.preferences.activitySortOrder])}
          keyExtractor={(item: IActivityLog, index) => item.guid}
          keyboardShouldPersistTaps='always'
          renderItem={({ item }) => this.renderActivity(item)}
          ListEmptyComponent={
            <Text style={{ margin: 30, textAlign: 'center', color: 'gray' }}>
              {this.state.busy ? $labels.COMMON.LOADING : $labels.ACTIVITY_LOGS.NO_ACTIVITIES}
            </Text>
          }
        />

        <ScreenSpinner overlay={false} visible={this.state.busy && !this.state.refreshing} />

        {!!this.state.editActivity && !this.state.viewingEvidence &&
          <InModal
            backgroundColor={Theme.background}
            isVisible={!!this.state.editActivity}
            onClose={() => this.cancelEdit()} // used to be: update or full-screen-add just save on close
            avoidKeyboard
            noAnimation
            title={this.state.addActivity ? $labels.ACTIVITY_LOGS.ADD_ACTIVITY : $labels.ACTIVITY_LOGS.EDIT_ACTIVITY}
            subtitle={this.props.currentLearner.name}
          >
            <ScrollView style={{ paddingHorizontal: 16 }} keyboardShouldPersistTaps='always' keyboardDismissMode={'on-drag'}>
              <Text style={styles.label}>{$labels.ACTIVITY_LOGS.ACTIVITY_DESCRIPTION}</Text>
              <VoiceInput single myref='descr'
                boxStyle={{borderBottomColor: 'dimgray', borderTopColor: 'dimgray', borderLeftColor: 'dimgray', borderRightColor: 'dimgray'}}
                value={this.state.editActivity.description}
                placeholder={$labels.ACTIVITY_LOGS.ACTIVITY_DESCRIPTION}
                onSetValue={(ref, text) => {
                  if (this.state.editActivity) {
                    this.setState({ editActivity: { ...this.state.editActivity, description: text } });
                  }
                }}
              />

              <Text style={styles.label}>{$labels.ACTIVITY_LOGS.ACTIVITY_DATE}</Text>
              <DateInput mandatory
                date={this.state.editActivity.date}
                dateFormat='dddd, D MMMM YYYY'
                calendarPromptIOS={$labels.ACTIVITY_LOGS.ACTIVITY_DATE}
                onDateChanged={(date) => {
                  if (this.state.editActivity) {
                    this.setState({ editActivity: { ...this.state.editActivity, date } });
                  }
                }}
              />

              <Text style={styles.label}>{$labels.ACTIVITY_LOGS.ACTIVITY_HOURS}</Text>
              <TimeInput mandatory
                time={this.state.editActivity.minutes}
                minuteInterval={15}
                timePrompt={$labels.ACTIVITY_LOGS.ACTIVITY_HOURS}
                onTimeChanged={(time) => {
                  if (this.state.editActivity && time !== null) {
                    this.setState({ editActivity: { ...this.state.editActivity, minutes: time } });
                  }
                }}
              />

              <View style={{ marginTop: 16 }}>
                {__DEV__ && <Text style={commonStyles.debug}>{this.state.editActivity.guid}</Text>}
                <EvidenceListContainer
                  title={$labels.ACTIVITY_LOGS.ACTIVITY_EVIDENCE}
                  navigation={this.props.navigation}
                  ownerGuid={this.state.editActivity.guid}
                  evidenceLevel={EvidenceLevel.ACTIVITY}
                  expandable
                />

                <Chat expanded={this.state.editActivity.comments.length > 0}
                  title={$labels.ACTIVITY_LOGS.COMMENTS}
                  parentId={this.state.editActivity.guid}
                  comments={this.state.editActivity.comments}
                  onAddComment={this.addComment.bind(this)}
                  onUpdateComment={this.updateComment.bind(this)}
                  onDeleteComment={this.deleteComment.bind(this)}
                />
              </View>

              <RoundButton
                label={$labels.COMMON.SAVE} backColor={Theme.green} radius={8} style={{ alignSelf: 'center', margin: 16 }}
                onPress={() => this.saveActivity()}
              />

              <View style={{ height: 4 }} />
            </ScrollView>
            {this.props.createPrivilege && !this.state.addActivity &&
              <Fab
                direction='left'
                style={{ backgroundColor: Theme.red }}
                position='bottomRight'
                onPress={() => this.askDeleteActivity()}
              >
                <Icon active name='trash' />
              </Fab>
            }
            <InToast id='activity' />
          </InModal>
        }

      </View>
    );
  }
}

const styles: any = EStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background
  },
  hline: {
    borderBottomColor: 'lightsteelblue',
    borderBottomWidth: 2
  },
  activity: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomColor: 'gray',
    borderBottomWidth: EStyleSheet.hairlineWidth,
    backgroundColor: 'white'
  },
  icon: {
    fontSize: 16,
    color: Theme.midBlue
  },
  count: {
    fontSize: 13,
    color: Theme.hiBlue
  },
  edit: {
    borderWidth: EStyleSheet.hairlineWidth,
    borderColor: 'dimgray',
    borderRadius: 4,
    backgroundColor: Theme.textInputBackground,
    fontWeight: 'normal',
    padding: 4
  },
  label: {
    color: 'gray',
    fontWeight: 'normal',
    fontSize: 12,
    marginBottom: 6,
    marginTop: 12
  }
});

const mapStateToProps = () => {
  return (state: IState, ownProps: Props) => {
    const learnerId: number = ownProps.currentLearnerIndex < ownProps.sortedLearners.length && !!ownProps.sortedLearners[ownProps.currentLearnerIndex] ? ownProps.sortedLearners[ownProps.currentLearnerIndex].id : -1;
    return {
      currentLearner: state.activityLogs.learners[learnerId], // need to get this from redux to keep %complete etc in synch via ...Navigable
      activities: state.activityLogs.learnerActivities[learnerId] || [],
      // feed in preferences with defaults:
      preferences: { activitySortColumn: 'date', activitySortOrder: 'desc', ...(state.auth.userPreferences[state.auth.id] || {}) }
    };
  };
};

export default connect(mapStateToProps,
  { getActivityLogByUser, updateActivityLog, addActivityLog, deleteActivityLog, updateActivityLogComment, addActivityLogComment, deleteActivityLogComment, savePreferences }
)(Learner);
