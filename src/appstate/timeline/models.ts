import ErrorService from 'services/Error';
import Api from 'services/Api';

/**
 * Define our Timeline State:
 */
export interface ITimelineState {
  events: ITimelineEvent[]; // paged ordered list of events for current user
  preferences: ITimelinePreferences
}

/**
 * type mapping for whether to show each event template type
 */
export type EventTypeMapping = { [templateId: number]: boolean; };

/**
 * Timeline Event model
 */
export interface ITimelineEvent {
  id: number;
  templateId: number;
  message: string;
  timestamp: number;
  data: any;
}

/**
 * Timeline preferences model
 */
export interface ITimelinePreferences {
  /**
   * preference to show timeline as home screen
   */
  homeScreen: boolean;
}

// Deserialisers

/**
 * Deserialise a timeline event
 * @param   {any}             eventData  Raw API response data
 * @return  {ITimelineEvent}             Timeline Event model
 */
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

/**
 * Deserialise Timeline Event array from API response
 * @param   {any[]}            eventArrayData  API response array
 * @return  {ITimelineEvent[]}                 Timeline Event object array
 */
export function deserialiseEventArray(eventArrayData: any[]): ITimelineEvent[] {
  return eventArrayData.map((eventData) => deserialiseEvent(eventData));
}