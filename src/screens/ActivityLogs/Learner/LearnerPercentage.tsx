import React from 'react';
import { Text, View } from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import Theme from 'services/Theme';
import { $labels } from 'services/i18n';
import { IEmsLearner } from 'appstate/activityLogs/models';

interface Props {
  learner: IEmsLearner;
  style?: any;
}

function LearnerPercentage({ learner, style = {} }: Props) {
  const pc = learner.percentageComplete || 0;
  const ah = learner.actualHours || 0;
  const label = pc >= 100 ? $labels.ACTIVITY_LOGS.STATUS_COMPLETED : pc <= 0 && ah <= 0 ? $labels.ACTIVITY_LOGS.STATUS_NOT_STARTED : pc < 6 ? '' : `${pc}%`;
  const flex = pc >= 100 || pc <= 0 && ah <= 0 ? 100 : ah > 0 ? pc : 0;
  return (
    <View style={[styles.pcband, style]}>
      <View style={[styles.pc, { width: flex + '%' }, pc <= 0 && { backgroundColor: Theme.red }, pc >= 100 && { backgroundColor: Theme.green }]}>
        <Text style={styles.pclabel} numberOfLines={1} ellipsizeMode={'clip'} >{label}</Text>
      </View>
    </View>
  );
}

const styles: any = EStyleSheet.create({
  pcband: {
    borderRadius: 4,
    width: '100%',
    minHeight: 18,
    backgroundColor: '#ddd'
  },
  pc: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    backgroundColor: Theme.midBlue, // changed if 0 or 100
    alignItems: 'center'
  },
  pclabel: {
    color: 'white',
    fontSize: 12,
    margin: 2,
    fontWeight: 'bold'
  }
});

export default LearnerPercentage;
