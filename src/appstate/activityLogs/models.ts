import ErrorService from 'services/Error';
import { IAssessmentComment } from '../assessments/models';
import Api from 'services/Api';
import { logger } from 'services/logger';
import Util from 'services/Util';

// Define our Activity Log State:
export interface IActivityLogState {
  userLearners: IEMSUserLearnerArrayMap;     // user to array of learner ids map
  learners: IEMSLearnerMap;                  // learner id to learner map
  learnerActivities: IEMSLearnerActivityMap; // learner id to activity array map
}

export interface IEMSUserLearnerArrayMap { [key: number]: number[]; }      // array of learner IDs in retrieved order for each user
export interface IEMSLearnerMap { [key: number]: IEmsLearner; }               // learner id to learner map
export interface IEMSLearnerActivityMap { [key: number]: IActivityLog[]; } // learner id to activity array map

export interface IEmsLearner {
  id: number;
  name: string;
  establishment: string;
  percentageComplete: number;
  actualHours: number;
  maxHours: number;
}

export interface IActivityLog {
  guid: string;
  learnerId: number;
  description: string;
  date: number;
  minutes: number;
  comments: IActivityComment[];
  evidenceCount: number;
}

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

export interface IActivityComment {
  guid: string;
  comment: string;
  createdAt: number;
  authorId: number;
  authorName: string;
}

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

function deserialiseActivityCommentArray(commentArrayData: any[]): IActivityComment[] {
  try {
    const comments: IActivityComment[] = [];
    commentArrayData.forEach((commentData) => {
      const comment: IActivityComment = deserialiseActivityComment(commentData);
      comments.push(comment);
    });
    return comments;
  } catch (err) {
    ErrorService.logError('Exception in deserialising activity array', err);
    throw err;
  }
}

export function deserialiseActivity(activityData: any): IActivityLog {
  try {
    const activity: IActivityLog = {
      guid: activityData.guid,
      learnerId: activityData.entity_id || -1,
      description: activityData.description || '',
      date: Api.decodeDate(activityData.date),
      minutes: Api.decodeTime(activityData.time_spent) / 60 || 0,
      comments: deserialiseActivityCommentArray(activityData.activity_comments || []),
      evidenceCount: activityData.file_count || 0
    };
    return activity;
  } catch (err) {
    ErrorService.logError('Exception in deserialising activity', err);
    throw err;
  }
}

export function deserialiseActivityArray(activityArrayData: any[]): IActivityLog[] {
  try {
    const activities: IActivityLog[] = [];
    activityArrayData.forEach((activityData) => {
      const activity: IActivityLog = deserialiseActivity(activityData);
      activities.push(activity);
    });
    return activities;
  } catch (err) {
    ErrorService.logError('Exception in deserialising activity array', err);
    throw err;
  }
}