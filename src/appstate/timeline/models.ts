import ErrorService from 'services/Error';
import Api from 'services/Api';
import { logger } from 'services/logger';
import Util from 'services/Util';

// Define our Timeline State:
export interface ITimelineState {
  events: ITimelineEvent[]; // paged ordered list of events for current user
  preferences: ITimelinePreferences
}

// type mapping for whether to show each event template type
export type EventTypeMapping = { [templateId: number]: boolean; };

// created_at: "2021-07-08 15:00:31"
// data: {type: "assessment", link: "5a4ab285-9b78-47b9-96a7-2995326ba290"}
// detailed: "You completed the scoring for Assessee"
// short: "You completed the scoring for Assessee"
// timeline_template_id: 3

export interface ITimelineEvent {
  id: number;
  templateId: number;
  message: string;
  timestamp: number;
  data: any;
}

export interface ITimelinePreferences {
  homeScreen: boolean; // preference to show timeline as home screen
  // showEventType: EventTypeMapping;
}

// Deserialisers

export function deserialiseEvent(eventData: any): ITimelineEvent {
  try {
    const event: ITimelineEvent = {
      id: eventData.id || 0,
      templateId: eventData.timeline_template_id || 0,
      message: eventData.message || '',
      timestamp: Api.decodeDateTime(eventData.created_at),
      data: eventData.data || {}
    };
    return event;
  } catch (err) {
    ErrorService.logError('Exception in deserialising event', err);
    throw err;
  }
}

export function deserialiseEventArray(eventArrayData: any[]): ITimelineEvent[] {
  return eventArrayData.map((eventData) => deserialiseEvent(eventData));
}