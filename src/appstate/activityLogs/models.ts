import ErrorService from 'services/Error';
import Api from 'services/Api';
import Util from 'services/Util';

/**
 * Define our Activity Log State:
 */
export interface IActivityLogState {
  userLearners: IEMSUserLearnerArrayMap;     // user to array of learner ids map
  learners: IEMSLearnerMap;                  // learner id to learner map
  learnerActivities: IEMSLearnerActivityMap; // learner id to activity array map
}

/**
 * array of learner IDs in retrieved order for each user
 */
export interface IEMSUserLearnerArrayMap { [key: number]: number[]; }

/**
 * learner id to learner map
 */
export interface IEMSLearnerMap { [key: number]: IEmsLearner; }

/**
 * learner id to activity array map
 */
export interface IEMSLearnerActivityMap { [key: number]: IActivityLog[]; }

/**
 * Learner details
 */
export interface IEmsLearner {
  id: number;
  name: string;
  establishment: string;
  percentageComplete: number;
  actualHours: number;
  maxHours: number;
}

/**
 * Activity Log details
 */
export interface IActivityLog {
  guid: string;
  learnerId: number;
  description: string;
  date: number;
  minutes: number;
  comments: IActivityComment[];
  evidenceCount: number;
}

/**
 * Method to instantiate a new Activity log
 * @param   {number}        learnerId  Learner ID
 * @return  {IActivityLog}             New learner details
 */
export function NEW_ACTIVITY(learnerId: number): IActivityLog {
  return {
    guid: 'NEW',
    description: '',
    date: Util.today(),
    learnerId,
    minutes: 0,
    comments: [],
    evidenceCount: 0
  };
}

/**
 * Activity Log Comment
 */
export interface IActivityComment {
  guid: string;
  comment: string;
  createdAt: number;
  authorId: number;
  authorName: string;
}

/**
 * Deserialise API data to Learner model
 * @param   {any}          learnerData  data from API response
 * @return  {IEmsLearner}               Learner model
 */
export function deserialiseLearner(learnerData: any): IEmsLearner {
  try {
    const learner: IEmsLearner = {
      id: learnerData.id || -1,
      name: learnerData.name || learnerData.display_name || '',
      establishment: learnerData.establishment_name || '',
      percentageComplete: learnerData.percentage_complete || 0,
      actualHours: learnerData.current_value || 0,
      maxHours: parseFloat(learnerData.max_value) || 0
    };
    return learner;
  } catch (err) {
    ErrorService.logError('Exception in deserialising learner', err);
    throw err;
  }
}

/**
 * Deserialise API data array to array of Learner objects
 *
 * @param   {any[]}          learnerArrayData  API data array
 * @return  {IEmsLearner[]}                    Array of learner objects
 */
export function deserialiseLearnerArray(learnerArrayData: any[]): IEmsLearner[] {
  try {
    const learners: IEmsLearner[] = [];
    learnerArrayData.forEach((learnerData) => {
      const learner: IEmsLearner = deserialiseLearner(learnerData);
      learners.push(learner);
    });
    return learners;
  } catch (err) {
    ErrorService.logError('Exception in deserialising learners array', err);
    throw err;
  }
}

/**
 * Deserialise A{I data to Activity Comment}
 * @param   {any}               commentData  API data
 * @return  {IActivityComment}               Activity Comment model
 */
function deserialiseActivityComment(commentData: any): IActivityComment {
  try {
    const activity: IActivityComment = {
      guid: commentData.id,
      comment: commentData.comment || '',
      createdAt: Api.decodeDateTime(commentData.created_at),
      authorId: commentData.comment_author ? commentData.comment_author.id : null,
      authorName: commentData.comment_author ? (commentData.comment_author.display_name || '') : ''
    };
    return activity;
  } catch (err) {
    ErrorService.logError('Exception in deserialising activity', err);
    throw err;
  }
}
