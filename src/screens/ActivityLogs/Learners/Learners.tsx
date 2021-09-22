import React from 'react';
import { Text, View, FlatList, TouchableOpacity } from 'react-native';
import { withNavigation } from 'services/Nav';
import { logger } from 'services/logger';
import InlineSpinner from 'components/InlineSpinner';
import { $labels } from 'services/i18n';
import { IEmsLearner } from 'appstate/activityLogs/models';
import { commonStyles } from 'styles/common';
import Theme from 'services/Theme';
import EStyleSheet from 'react-native-extended-stylesheet';
import ScreenInfo from 'services/ScreenInfo';
import LearnerPercentage from '../Learner/LearnerPercentage';
import RoundButton from 'components/RoundButton';
import Anim from 'services/Anim';
import { RowView } from 'components/RowView';
import Util from 'services/Util';

interface Props {
  navigation: any;
  filtered: boolean;
  createPrivilege: boolean;
  updatePrivilege: boolean;
  currentLearnerIndex: number;
  sortedLearners: IEmsLearner[];
  myid: number;
  loading: boolean;
  onSelectLearner: Function;
  onRefresh: Function;
  onNextPage: Function;
  // onScroll: Function;
  onAddLearner: () => void;
  onToggleFilter: () => void;
}
interface State {
  refreshing: boolean;
  paging: boolean;
  hideHeaders: boolean;
}

class Learners extends React.Component<Props, State> {
  private wait = new Promise((resolve) => setTimeout(resolve, 50));  // need a wait initially on android it seems - see https://github.com/facebook/react-native/issues/13202
  private listRef: any;
  constructor(props: Props) {
    super(props);
    this.state = { refreshing: false, paging: false, hideHeaders: false };
  }

  UNSAFE_componentWillReceiveProps(newProps: Props) {
    if (newProps.currentLearnerIndex !== this.props.currentLearnerIndex) {
      if (newProps.currentLearnerIndex > -1 && newProps.currentLearnerIndex >= this.props.sortedLearners.length - 2) {
        this.wait.then(() => {
          const myList: any = this.listRef;
          if (myList) {
            myList.scrollToIndex({ animated: true, index: newProps.currentLearnerIndex, viewPosition: 1 });
          }
        });
      }
    }
  }

  selectLearner(learner: IEmsLearner) {
    this.props.onSelectLearner(this.props.sortedLearners.findIndex((a: IEmsLearner) => a.id === learner.id), learner.id);
  }

  renderLearnerTile(learner: IEmsLearner, index: number) {
    return (
      <TouchableOpacity onPress={() => this.selectLearner(learner)}>
        <View style={[styles.tile, commonStyles.lightShadow, { flexDirection: 'row' }]}>
          <View style={[styles.leftBar, ScreenInfo.supportsDualPane() && index === this.props.currentLearnerIndex && styles.leftBarSelected]} />
          <View style={{ padding: 10, flex: 1, paddingRight: 18 }}>
            <Text style={styles.name}>{learner.name}</Text>
            <Text style={styles.club}>{learner.establishment}</Text>
            <LearnerPercentage learner={learner} style={{ marginTop: 6 }} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  async refresh() {
    if (this.props.onRefresh) {
      this.setState({ refreshing: true });
      await this.props.onRefresh();
      this.setState({ refreshing: false });
    }
  }

  async nextPage(data) {
    if (this.props.onNextPage && !this.state.paging) {
      this.setState({ paging: true }); // , baseIndex: this.props.sortedHeaders.length });
      await this.props.onNextPage();
      this.setState({ paging: false });
    }
  }

  handleScroll(event: any) {
    const y = event.nativeEvent.contentOffset.y;
    // this.props.onScroll(y);
    if (y > 40 && !this.state.hideHeaders) {
      Anim.EaseNext();
      this.setState({ hideHeaders: true });
    } else if (y < 30 && this.state.hideHeaders) {
      Anim.EaseNext();
      this.setState({ hideHeaders: false });
    }
  }
  // resetScroll() {
  //   const myList: any = this.refs['list'];
  //   if (myList) {
  //     myList.scrollToIndex({ index: 0 });
  //   }
  // }

  render() {
    return (
      <View style={{ flex: 1, paddingVertical: 8 }}>
        {/* <Text>{this.props.createPrivilege ? 'CREATE' : 'create'} / {this.props.updatePrivilege ? 'UPDATE' : 'update'}</Text> */}
        {!this.state.hideHeaders && !Util.isLearner() &&
          <RowView nowrap style={{marginBottom: 4, marginHorizontal: 16}}>
            {this.props.createPrivilege && <RoundButton
              label={$labels.ACTIVITY_LOGS.ADD_LEARNER} iconName={'plus'} backColor={Theme.green} radius={8} // style={{flex: 1}}
              onPress={this.props.onAddLearner}
            />}
            <RoundButton
              label={this.props.filtered ? $labels.ACTIVITY_LOGS.FILTERED : $labels.ACTIVITY_LOGS.FILTER} iconName={'search'} backColor={'white'} style={{borderColor: Theme.midBlue, borderWidth: 3}} textStyle={{color: Theme.midBlue}} radius={8}
              onPress={this.props.onToggleFilter}
            />
          </RowView>
        }
        <FlatList
          ref={(ref) => this.listRef = ref}
          data={this.props.sortedLearners}
          renderItem={({ item, index }) => this.renderLearnerTile(item, index)}
          keyExtractor={(item: IEmsLearner, index) => item.id.toString()}
          ListEmptyComponent={
            <Text style={{ margin: 40, textAlign: 'center' }}>
              {this.props.loading ? $labels.ACTIVITY_LOGS.FETCHING : $labels.ACTIVITY_LOGS.NONE}
            </Text>
          }
          keyboardShouldPersistTaps='always' // see https://github.com/Microsoft/react-native-windows/issues/779
          onRefresh={this.refresh.bind(this)}
          refreshing={this.state.refreshing}
          onEndReached={this.nextPage.bind(this)}
          onEndReachedThreshold={0.01}
          bounces={true} // false prohibits pull-to-refresh
          onScroll={this.handleScroll.bind(this)}
        />
        <InlineSpinner style={{ marginTop: 2, marginBottom: 2, alignSelf: 'center' }} visible={this.state.paging} />
      </View>
    );
  }
}

const styles: any = EStyleSheet.create({
  tile: {
    backgroundColor: 'white',
    marginVertical: 8,
    marginHorizontal: 16,
    borderColor: 'gray',
    borderRadius: 6,
    borderWidth: EStyleSheet.hairlineWidth
  },
  leftBar: {
    width: 8,
    height: '100%',
    // backgroundColor: 'lightgray',
    borderBottomLeftRadius: 6,
    borderTopLeftRadius: 6
  },
  leftBarSelected: {
    backgroundColor: 'steelblue'
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.greenBlue
  },
  club: {
    fontSize: 14,
    color: '#555'
  }
});

export default withNavigation(Learners);