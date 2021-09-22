import React from 'react';
import { Text, View, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import Theme from 'services/Theme';
import ScreenInfo from 'services/ScreenInfo';
import { IEmsLearner } from 'appstate/activityLogs/models';
import LearnerPercentage from './LearnerPercentage';
import { RowView } from 'components/RowView';
import RoundButton from 'components/RoundButton';
import { $labels } from 'services/i18n';
import LinkButton from 'components/LinkButton';
import { Icon } from 'native-base';
import { OverlayModal } from 'components/OverlayModal';
import { GestureView } from 'components/GestureView';
import { Branding } from 'services/Branding';

interface Props {
  learnerIndex: number; // where in the learnerList is the current learner?
  learnerList: IEmsLearner[];
  createPrivilege: boolean;
  onIndexChange: Function;
  onAddActivity: Function;
  onSort: (column: 'date' | 'description' | 'minutes', direction: 'asc' | 'desc') => void;
  sortColumn: 'date' | 'description' | 'minutes';
  sortOrder: 'asc' | 'desc';
}
interface State {
  learnerIndex: number; // where in the learnerList is the current learner?
  sortVisible: boolean;
}

export class LearnerSubheader extends React.Component<Props, State> {
  private wait = new Promise((resolve) => setTimeout(resolve, 50));  // need a wait initially on android it seems - see https://github.com/facebook/react-native/issues/13202

  constructor(props: Props) {
    super(props);
    this.state = { learnerIndex: props.learnerIndex, sortVisible: false };
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    this.setState({ learnerIndex: nextProps.learnerIndex });
  }

  renderLearnerSummary(learner: IEmsLearner) {
    const dualPane = ScreenInfo.supportsDualPane();
    return (
      <View style={[
        { paddingHorizontal: 10, paddingVertical: 16 },
        dualPane && { marginHorizontal: 15 }
      ]}
      >
        <View style={{ position: 'absolute', right: ScreenInfo.supportsDualPane() ? -10 : 0 }}>
          <LinkButton large style={{ paddingHorizontal: 8, paddingVertical: 4 }} iconName='sort' onPress={() => this.setState({ sortVisible: true })} />
        </View>

        <Text style={this.styles.name}>{learner.name}</Text>
        <View style={{ paddingHorizontal: 20, marginBottom: 6 }}>
          <RowView>
            <View style={{ flex: 1 }}>
              <LearnerPercentage learner={learner} style={{ marginTop: 6 }} />
              {!!learner.maxHours && <RowView>
                <Text style={this.styles.hrs}>0</Text>
                <View style={{ flex: 1 }} />
                <Text style={this.styles.hrs}>{learner.maxHours}</Text>
              </RowView>}
            </View>
            {this.props.createPrivilege &&
              <RoundButton iconName={'plus'} small backColor={Theme.green}
                style={{ alignSelf: 'center', marginLeft: 10, marginRight: -10 }} label={$labels.ACTIVITY_LOGS.ACTIVITY}
                onPress={() => this.props.onAddActivity()}
              />
            }
          </RowView>
        </View>
      </View>
    );
  }

  prev() {
    if (this.state.learnerIndex > 0) {
      this.setState({ learnerIndex: this.state.learnerIndex - 1 }, () => {
        setTimeout(() => this.props.onIndexChange(this.state.learnerIndex));
      });
    }
  }
  next() {
    if (this.state.learnerIndex < this.props.learnerList.length - 1) {
      this.setState({ learnerIndex: this.state.learnerIndex + 1 }, () => {
        setTimeout(() => this.props.onIndexChange(this.state.learnerIndex));
      });
    }
  }

  changeSort(column: 'date' | 'description' | 'minutes') {
    if (this.props.sortColumn === column) {
      this.props.onSort(this.props.sortColumn, this.props.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      this.props.onSort(column, this.props.sortOrder);
    }
  }
  renderSortModal() {
    return (
      <OverlayModal
        isVisible={this.state.sortVisible}
        onClose={() => this.setState({ sortVisible: false })}
        slideFrom='bottom'
      >
        <View>
          <View style={this.styles.sortHeader}>
            <Text style={this.styles.sortHeaderText}>{$labels.ACTIVITY_LOGS.SORT}</Text>
          </View>
          <TouchableOpacity onPress={() => this.changeSort('date')}>
            <RowView left style={this.styles.sortRow}>
              <Text style={this.styles.sortOption}>{$labels.ACTIVITY_LOGS.ACTIVITY_DATE}</Text>
              {this.props.sortColumn === 'date' && <Icon type='FontAwesome' name={this.props.sortOrder === 'desc' ? 'caret-up' : 'caret-down'} style={this.styles.sortIcon} />}
            </RowView>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.changeSort('description')}>
            <RowView style={this.styles.sortRow}>
              <Text style={this.styles.sortOption}>{$labels.ACTIVITY_LOGS.ACTIVITY_DESCRIPTION}</Text>
              {this.props.sortColumn === 'description' && <Icon type='FontAwesome' name={this.props.sortOrder === 'desc' ? 'caret-up' : 'caret-down'} style={this.styles.sortIcon} />}
            </RowView>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.changeSort('minutes')}>
            <RowView style={this.styles.sortRow}>
              <Text style={this.styles.sortOption}>{$labels.ACTIVITY_LOGS.ACTIVITY_HOURS}</Text>
              {this.props.sortColumn === 'minutes' && <Icon type='FontAwesome' name={this.props.sortOrder === 'desc' ? 'caret-up' : 'caret-down'} style={this.styles.sortIcon} />}
            </RowView>
          </TouchableOpacity>
        </View>
      </OverlayModal>
    );
  }

  render() {
    const { learnerList } = this.props;
    const learner = learnerList[this.state.learnerIndex];
    return (
      <GestureView
        style={{ flexDirection: 'column', backgroundColor: Theme.lightbg }}
        onSwipeLeft={this.state.learnerIndex === 0 ? undefined : () => this.prev()}
        onSwipeRight={this.state.learnerIndex >= this.props.learnerList.length - 1 ? undefined : () => this.next()}
      >
        {this.renderLearnerSummary(learner)}
        {this.renderSortModal()}
      </GestureView>
    );
  }
  private styles: any = EStyleSheet.create({
    name: {
      color: Theme.greenBlue,
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 4,
      marginBottom: 6
    },
    hrs: {
      fontSize: 10
    },
    sortHeader: {
      paddingBottom: 8,
      borderBottomWidth: EStyleSheet.hairlineWidth,
      borderBottomColor: 'dimgray'
    },
    sortHeaderText: {
      fontSize: 16,
      paddingRight: 12,
      alignSelf: 'center',
      fontWeight: 'bold',
      color: 'lightgray'
    },
    sortRow: {
      // width: '100%',
      padding: 8,
      borderBottomWidth: EStyleSheet.hairlineWidth,
      borderBottomColor: 'dimgray'
    },
    sortOption: {
      flex: 1,
      color: Branding.getLinkColor()
    },
    sortIcon: {
      fontSize: 22,
      color: Branding.getLinkColor()
    }
  });
}
