import { combineReducers } from 'redux';
import { IAuthState } from './auth/models';
import VaultReducer from './vault/reducers';
import AuthReducer from './auth/reducers';
import AssessmentsReducer from './assessments/reducers';
import EvidenceReducer from './evidence/reducers';
import CPDReducer from './CPD/reducers';
import OLLReducer from './onlineLearning/reducers';
import ConfigReducer from './config/reducers';
import ActivityLogsReducer from './activityLogs/reducers';
import EMSAssessmentsReducer from './emsAssessments/reducers';
import DAPReducer from './DAP/reducers';
import MetricsReducer from './metrics/reducers';
import DashboardReducer from './dashboard/reducers';
import TimelineReducer from './timeline/reducers';
import { IAssessmentsState } from './assessments/models';
import { persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-community/async-storage';
// eslint-disable-next-line import/no-internal-modules
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import createSensitiveStorage from 'redux-persist-sensitive-storage';
import { createBlacklistFilter } from 'redux-persist-transform-filter';
import { ICPDState } from './CPD/models';
import { IEvidenceState } from './evidence/models';
import { IOnlineLearningState } from './onlineLearning/models';
import { IConfigState } from './config/models';
import { IActivityLogState } from './activityLogs/models';
import { IEMSAssessmentsState } from './emsAssessments/models';
import { IDAPState } from './DAP/models';
import { IMetricsState } from './metrics/models';
import { IDashboardState } from './dashboard/models';
import { IVaultState } from './vault/models';
import { ITimelineState } from './timeline/models';

export interface IState {
  vault: IVaultState;
  auth: IAuthState;
  assessments: IAssessmentsState;
  evidence: IEvidenceState;
  cpd: ICPDState;
  onlineLearning: IOnlineLearningState;
  config: IConfigState;
  activityLogs: IActivityLogState;
  emsAssessments: IEMSAssessmentsState;
  dap: IDAPState;
  metrics: IMetricsState;
  dashboard: IDashboardState;
  timeline: ITimelineState;
}

// paging info returned from actions that require paging
export interface IPageInfo {
  page: number;     // page number this data represents
  count: number;    // number of items returned in this page
  lastPage: number; // last page number with data
  total: number;    // total number of items
  extraData: any;   // pass some additional data back, eg. privileges
}

const secureStorage = true; // secure anything sensitive (security related or personal data) in production/beta
const secureStorageAreas: string[] = ['vault']; // these are the sensitive areas to be encrypted.
// Note it handles moving from unencrypted to encrypted (does it??) but not vice-versa.

// Nested persist to apply blacklist at lower than root level, see https://github.com/rt2zz/redux-persist
// const assessmentsPersistConfig = {
//   key: 'assessments',
//   storage: storage,
//   blacklist: ['pendingEvidenceLinks', 'pendingEvidence'], // why doesnt this appear to be working??
//   stateReconciler: autoMergeLevel2
// };
// Nested persists don't seem to work, so we blacklist using redux-persist-transform-filter:
// Don't rely on debug of redux state to verify this, use dumpStorage() in code or showAsyncStorageContentInDev() in rnDebugger console
const blacklistFilterEvidence = createBlacklistFilter(
  'evidence', ['pendingEvidenceLinks', 'pendingEvidence']
);
const blacklistFilterAuth = createBlacklistFilter(
  'auth', ['refreshTokenPromise']
);

const rootPersistConfig: any = {
  key: 'root',
  storage: AsyncStorage,
  transforms: [blacklistFilterAuth, blacklistFilterEvidence],
  blacklist: secureStorage && secureStorageAreas.length > 0 ? secureStorageAreas : null, // blacklist those from root that are persisted in secure storage
  stateReconciler: autoMergeLevel2 // see "Merge Process" section for details.
};

const sensitiveStorage = createSensitiveStorage({
  keychainService: 'ccfChain', // see https://mcodex.dev/react-native-sensitive-info/docs/ios_options : You can choose the keychain's service which you want to use. Otherwise, the default is app.
  sharedPreferencesName: 'ccfPrefs' // see https://mcodex.dev/react-native-sensitive-info/docs/android_options : You can choose the shared preferences' name which you want to use. Otherwise, the default is shared_preferences.
});
const securePersistConfig = {
  key: 'secure',
  storage: sensitiveStorage,
  transforms: [blacklistFilterAuth, blacklistFilterEvidence], // just in case we add more areas to secure storage
  stateReconciler: autoMergeLevel2 // see "Merge Process" section for details.
};

const getReducer = (name: string, reducer: any) => {
  return secureStorage && secureStorageAreas.indexOf(name) > -1 ? persistReducer(securePersistConfig, reducer) : reducer;
};

// Each reducer relates to a logical chunk of data (try to keep each relatively simple). Combine into a single state tree here:
// We only conditionally add reducers to avoid the "No reducer provided for key "..."" console warnings on JEST. At run time all are added.
const reducers = {};
if (VaultReducer) {
  reducers['vault'] = getReducer('vault', VaultReducer); // secure persistence for tokens, encrypted and held in keychain
}
if (AuthReducer) {
  reducers['auth'] = getReducer('auth', AuthReducer);
}
if (AssessmentsReducer) {
  reducers['assessments'] = getReducer('assessments', AssessmentsReducer);
}
if (EvidenceReducer) {
  reducers['evidence'] = getReducer('evidence', EvidenceReducer);
}
if (CPDReducer) {
  reducers['cpd'] = getReducer('cpd', CPDReducer);
}
if (OLLReducer) {
  reducers['onlineLearning'] = getReducer('onlineLearning', OLLReducer);
}
if (ConfigReducer) {
  reducers['config'] = getReducer('config', ConfigReducer);
}
if (ActivityLogsReducer) {
  reducers['activityLogs'] = getReducer('activityLogs', ActivityLogsReducer);
}
if (EMSAssessmentsReducer) {
  reducers['emsAssessments'] = getReducer('emsAssessments', EMSAssessmentsReducer);
}
if (DAPReducer) {
  reducers['dap'] = getReducer('dap', DAPReducer);
}
if (MetricsReducer) {
  reducers['metrics'] = getReducer('metrics', MetricsReducer);
}
if (DashboardReducer) {
  reducers['dashboard'] = getReducer('dashboard', DashboardReducer);
}
if (TimelineReducer) {
  reducers['timeline'] = getReducer('timeline', TimelineReducer);
}

const rootReducer = combineReducers(reducers);
const persistedReducer = persistReducer(rootPersistConfig, rootReducer);
export default persistedReducer;