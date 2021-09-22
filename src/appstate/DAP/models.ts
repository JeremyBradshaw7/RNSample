import _ from 'lodash';
import { logger } from 'services/logger';
import ErrorService from 'services/Error';
import { IEAVValueMap, deserialiseEAVAttributeValues } from 'appstate/auth/models';
import { ICodeMap } from 'appstate/config/models';
import Api from 'services/Api';
import Util from 'services/Util';

// Define our DAP State:
export interface IDAPState {
  cpdActivities: ICPDActivityMap; // master map of CPD activities, all known to this app
  adminUserCPDActivityKeys: IUserCPDActivityArrayMap;   // ADMIN user's cpd activity keys array in order retrieved by paged API (for Config screen)
  userVisibleCPDActivityKeys: IUserCPDActivityArrayMap; // user's VISIBLE cpd activity keys array in order retrieved by paged API
  allActivities: ICodeMap; // all CPD activities { id: name } for LOVs

  qualifications: IDAPQualificationMap; // master map of qualifications detail
  userQualificationKeys: IUserQualificationArrayMap; // user's qualification keys array in order retrieved by paged API - THE QUALIFICATIONS QUERIED BY A USER IN THE CONFIG SCREEN, NOT THE QUALIFICATIONS A USER HAS
  allQualifications: ICodeMap; // all qualifications { id: name } for LOVs

  cpdActivityGroups: ICPDActivityGroupMap; // master map of CPD activity groups
  userCPDActivityGroupKeys: IUserCPDActivityGroupArrayMap; // user's cpd activity group keys array in order retrieved by paged API
  // allACtivityGroups: ICodeMap;
  activityGroupCriteria: IActivityGroupCriteria; // available user/activity criteria for an activity Group
}

// CPD ACTIVITIES

export interface ICPDActivity {
  id: string; // number in backend but easier just to keep as string in UI (was a guid but eavAttributes need numeric id)
  title: string;
  description: string;
  // establishmentId: number | null;
  versionNumber: number;
  public: boolean;
  formal: boolean;
  status: number;
  minHours: number | null;
  maxCredits: number | null;
  approvalRequired: boolean;
  isFixedCredit: boolean;
  isRepeatable: boolean;
  imageId: string; // guid
  scormPath: string;
  tags: string[];
  eavAttributes: IEAVValueMap;
  qualificationIDs: string[];
  configLink: string; // what assessment config will form submission create assessment for? (default '' means don't)
}
export function NEW_CPD_ACTIVITY(/*establishmentId: number | null, */formal: boolean = false): ICPDActivity {
  return {
    id: 'NEW', /*establishmentId,*/ title: '', description: '',
    versionNumber: 0, public: false, formal, status: 0,
    minHours: null, maxCredits: null, approvalRequired: false,
    isFixedCredit: false, isRepeatable: false, imageId: '',
    scormPath: '', eavAttributes: {}, tags: [], qualificationIDs: [],
    configLink: ''
  };
}
export interface ICPDActivityMap { [id: string]: ICPDActivity; }
export interface IUserCPDActivityArrayMap { [key: number]: string[]; }  // array of cpd activity IDs in retrieved order for each user

// CPD ACTIVITY GROUPS

export interface ICPDActivityGroup {
  id: string;
  title: string;
  description: string;
  category: 'S' | 'G' | 'U'; // security, group or user
  activityCriteria: ICPDActivityGroupActivityCriteria[];
  userCriteria: ICPDActivityGroupUserCriteria[];
}
export function NEW_CPD_ACTIVITY_GROUP(category: 'S' | 'G' | 'U'): ICPDActivityGroup {
  return {
    id: 'NEW', title: '', description: '', category, activityCriteria: [], userCriteria: []
  };
}
export interface ICPDActivityGroupMap { [id: string]: ICPDActivityGroup; }
export interface IUserCPDActivityGroupArrayMap { [key: number]: string[]; }  // array of cpd activity group IDs in retrieved order for each user

// criteria in a group
export interface ICPDActivityGroupActivityCriteria {
  id: string;
  attribute: string;
  eav: boolean;
  keys: string[]; // numeric keys will be stored as strings, single value for non-enum
}
export interface ICPDActivityGroupUserCriteria {
  id: string;
  entity: string;
  attribute: string;
  eav: boolean;
  keys: string[]; // numeric keys will be stored as strings, single value for non-enum
}

// available criteria - follow the API format so dont need deserialisers
export interface IActivityGroupCriteria { [entityId: string]: { attributes: ICriteriaAttributes; eavAttributes: ICriteriaEAVAttributes }; }
export interface ICriteriaAttributes { [attributeId: string]: ICriteriaAttribute; }
export interface ICriteriaAttribute { datatype: string; name: string; options: ICriteriaOption[] | ICodeMap; } // options either an array of options or a codemap
export interface ICriteriaOption { id: number; name: string; sequence: number; status: number; archived: number; } // just the bits we'll use
export interface ICriteriaEAVAttributes { [attributeId: string]: ICriteriaEAVAttribute; }
export interface ICriteriaEAVAttribute { id: number; datatype: string; display_name: string; sequence: number; options: null | string[]; } // just the bits we'll use

// QUALIFICATIONS

export interface IDAPQualification {
  id: string; // number in backend but easier just to keep as string in UI (was a guid but eavAttributes need numeric id)
  title: string;
  description: string;
  sequence: number;
  establishmentId: number | null;
  awardingBody: string;
  imageId: string; // guid
  licenceType: string;
  maintenanceType: string;
  otherReference: string;
  periodOfStudy: number | null;
  preRequisiteComment: string;
  preRequisiteQualificationId: string;
  qualificationCode: string;
  qualificationLevel: string;
  retentionTargetCredits: number | null;
  retentionTargetHours: number | null;
  reviewPeriod: number | null;
  // tags: string[];
  eavAttributes: IEAVValueMap;
  activityIDs: string[];
  // roleId: string; // guid
  // sectionId: string; // guid
  // staffGroupId: number | null; // staff group id
}
export function NEW_QUALIFICATION(establishmentId: number | null, sequence: number = 0): IDAPQualification {
  return {
    id: 'NEW', establishmentId, title: '', description: '', sequence,
    awardingBody: '', imageId: '', licenceType: '', maintenanceType: '',
    otherReference: '', periodOfStudy: null, preRequisiteComment: '', preRequisiteQualificationId: '',
    qualificationCode: '', qualificationLevel: '', retentionTargetCredits: null, retentionTargetHours: null,
    reviewPeriod: null, eavAttributes: {}, activityIDs: []
    // roleId: '', sectionId: '', staffGroupId: null
  };
}
export interface IDAPQualificationMap { [id: string]: IDAPQualification; }
export interface IUserQualificationArrayMap { [key: number]: string[]; }  // array of qualification IDs in retrieved order for each user

// Person's Qualification
export type QualificationStatus = 'Scheduled' | 'In Progress' | 'Completed Achieved' | 'Lapsed' | 'Completed Failed' | 'Cancelled';
export interface IPersonDAPQualification {
  id: string; // of the user/qualification
  personId: string; // of the person (user of the system)
  qualificationId: string;
  qualification: IDAPQualification; // the qualification details
  status: QualificationStatus;
  attainedDate: number | null;
  expiryDate: number | null;
  grade: string; // values TBC
}

// DESERIALISERS

export class Deserialisers {

  /**
   * Deserialise CPD activity array
   */
  public static deserialiseCPDActivityArray(cpdArrayData: any[]): ICPDActivity[] {
    try {
      return cpdArrayData.map((qdata: any) => Deserialisers.deserialiseCPDActivity(qdata));
    } catch (err) {
      ErrorService.logError('Exception in deserialising CPD activity array', err);
      throw err;
    }
  }

  /**
   * Deserialise CPD Activity
   */
  public static deserialiseCPDActivity(cdata: any): ICPDActivity {
    try {
      const act: ICPDActivity = {
        id: cdata.id,
        title: cdata.title || '',
        description: cdata.description || '',
        // establishmentId: qdata.establishment?.id || null,
        versionNumber: cdata.version_number || 0,
        public: cdata.public === 1,
        formal: cdata.formal === 1,
        status: cdata.status || 0,
        minHours: cdata.min_hours || null,
        maxCredits: cdata.max_credits || null,
        approvalRequired: cdata.approval_required === 1,
        isFixedCredit: cdata.is_fixed_credit === 1,
        isRepeatable: cdata.is_repeatable === 1,
        imageId: cdata.image || '',
        scormPath: cdata.scorm_path,
        // tags: cdata.tags ? (Object.values(cdata.tags) as string[]).filter((tag: string) => tag.trim() !== '') : [],
        tags: cdata.tags ? (cdata.tags.map((tagobj) => tagobj.name) as string[]).filter((tag: string) => tag.trim() !== '') : [], // tags here is array of objects not array of strings
        eavAttributes: deserialiseEAVAttributeValues(cdata.eav_attributes),
        qualificationIDs:
          cdata.qualifications.length > 0 && cdata.qualifications[0].hasOwnProperty('id') ? cdata.qualifications.map((obj: any) => obj.id) : (cdata.qualifications || []), // should cope with array of objects or array of ids
        configLink: Array.isArray(cdata.competencies) && cdata.competencies.length > 0 ? cdata.competencies[0].cf_competence_assessment_config_guid : ''
      };
      return act;
    } catch (err) {
      ErrorService.logError('Exception in deserialising CPD activity', err);
      throw err;
    }
  }

  /**
   * Deserialise CPD activity group array
   */
  public static deserialiseCPDActivityGroupArray(cpdArrayData: any[]): ICPDActivityGroup[] {
    try {
      return cpdArrayData.map((qdata: any) => Deserialisers.deserialiseCPDActivityGroup(qdata));
    } catch (err) {
      ErrorService.logError('Exception in deserialising CPD activity group array', err);
      throw err;
    }
  }

  /**
   * Deserialise CPD Activity Group
   */
  public static deserialiseCPDActivityGroup(cdata: any): ICPDActivityGroup {
    try {
      const grp: ICPDActivityGroup = {
        id: cdata.id,
        title: cdata.title || '',
        description: cdata.description || '',
        // eslint-disable-next-line eqeqeq
        category: cdata.category == '1' ? 'S' : cdata.category == '2' ? 'G' : 'U',
        activityCriteria: this.deserialiseActivityCriteriaArray(cdata),
        userCriteria: this.deserialiseUserCriteriaArray(cdata)
      };
      logger('DESER', cdata, grp);
      return grp;
    } catch (err) {
      ErrorService.logError('Exception in deserialising CPD activity group', err);
      throw err;
    }
  }
  public static deserialiseUserCriteriaArray(gdata: any): ICPDActivityGroupUserCriteria[] {
    const deserialiseEntityCriteria = (edata: any, entityName: string) => {
      if (edata && Array.isArray(edata)) {
        edata.forEach((cdata) => {
          const c: ICPDActivityGroupUserCriteria = this.deserialiseUserCriteria(entityName, cdata);
          // if it already exists combine the values
          const i = criterias.findIndex((e) => c.entity === e.entity && c.attribute === e.attribute && c.eav === e.eav);
          if (i === -1) {
            criterias.push(c);
          } else if (c.keys && c.keys.length > 0) {
            criterias[i].keys.push(c.keys[0]);
          }
        });
      }
    };
    const criterias: ICPDActivityGroupUserCriteria[] = [];
    deserialiseEntityCriteria(gdata.user_criteria, 'user');
    deserialiseEntityCriteria(gdata.qualification_criteria, 'qualification');
    deserialiseEntityCriteria(gdata.establishment_criteria, 'establishment');
    deserialiseEntityCriteria(gdata.role_criteria, 'role');
    deserialiseEntityCriteria(gdata.section_criteria, 'section');
    deserialiseEntityCriteria(gdata.work_type_criteria, 'work_type');
    return criterias;
  }
  public static deserialiseUserCriteria(entity: string, cdata: any): ICPDActivityGroupUserCriteria {
    return {
      id: cdata.id.toString() || '',
      entity, // : cdata.entity_id || '',
      attribute: cdata.attribute || '',
      eav: cdata.eav === 1,
      keys: [cdata.value || '']
    };
  }
  public static deserialiseActivityCriteriaArray(gdata: any): ICPDActivityGroupActivityCriteria[] {
    // logger('deserialiseActivityCriteriaArray', gdata);
    const deserialiseEntityCriteria = (edata: any, entityName: string) => {
      if (edata && Array.isArray(edata)) {
        edata.forEach((cdata) => {
          const c: ICPDActivityGroupActivityCriteria = this.deserialiseActivityCriteria('activity', cdata);
          // if it already exists combine the values
          const i = criterias.findIndex((e) => c.attribute === e.attribute && c.eav === e.eav);
          if (i === -1) {
            criterias.push(c);
          } else if (c.keys && c.keys.length > 0) {
            criterias[i].keys.push(c.keys[0]);
          }
        });
      }
    };
    const criterias: ICPDActivityGroupActivityCriteria[] = [];
    deserialiseEntityCriteria(gdata.activity_criteria, 'activity');
    // logger('=', criterias);
    return criterias;
  }
  public static deserialiseActivityCriteria(entity: string, cdata: any): ICPDActivityGroupActivityCriteria {
    // logger('deserialiseActivityCriteria', cdata);
    return {
      id: cdata.id.toString() || '',
      attribute: cdata.attribute || '',
      eav: cdata.eav === 1,
      keys: [cdata.value || '']
    };
  }

  /**
   * Deserialise DAP qualification array
   */
  public static deserialiseDAPQualificationArray(qArrayData: any[]): IDAPQualification[] {
    try {
      return qArrayData.map((qdata: any) => Deserialisers.deserialiseDAPQualification(qdata));
    } catch (err) {
      ErrorService.logError('Exception in deserialising DAP qualifications array', err);
      throw err;
    }
  }

  /**
   * Deserialise DAP qualification
   */
  public static deserialiseDAPQualification(qdata: any): IDAPQualification {
    try {
      // logger('- - deserialiseDAPQualification', qdata);
      const qual: IDAPQualification = {
        id: qdata.id,
        title: qdata.title || '',
        description: qdata.description || '',
        sequence: qdata.sequence || 0,
        establishmentId: qdata.establishment?.id || null,
        awardingBody: qdata.awarding_body || '',
        imageId: qdata.image || '',
        licenceType: qdata.licence_type || '',
        maintenanceType: qdata.maintenance_type || '',
        otherReference: qdata.other_reference || '',
        periodOfStudy: qdata.period_of_study || null,
        preRequisiteComment: qdata.pre_requisite_comment || '',
        preRequisiteQualificationId: qdata.pre_requisite_qualification?.id || '',
        qualificationCode: qdata.qualification_code || '',
        qualificationLevel: qdata.qualification_level || '',
        retentionTargetCredits: qdata.retention_target_credits || null,
        retentionTargetHours: qdata.retention_target_hours || null,
        reviewPeriod: qdata.review_period || null,
        // tags: qdata.tags ? (Object.values(qdata.tags) as string[]).filter((tag: string) => tag.trim() !== '') : [],
        eavAttributes: deserialiseEAVAttributeValues(qdata.eav_attributes),
        activityIDs: !qdata.activities ? [] :
          qdata.activities.length > 0 && qdata.activities[0].hasOwnProperty('id') ? qdata.activities.map((obj: any) => obj.id) : (qdata.activities || []) // should cope with array of objects or array of ids
        // roleId: qdata.cf_role_guid || '',
        // sectionId: qdata.establishment_section_guid || '',
        // staffGroupId: qdata.staff_group_id || null
      };
      return qual;
    } catch (err) {
      ErrorService.logError('Exception in deserialising DAP qualification', err);
      throw err;
    }
  }

  public static deserialisePersonDAPQualification(qdata: any): IPersonDAPQualification {
    try {
      const qualification: IDAPQualification = this.deserialiseDAPQualification(qdata.qualification);
      const pq: IPersonDAPQualification = {
        id: qdata.id || '',
        personId: qdata.person_id || '',
        qualificationId: qualification.id,
        qualification,
        status: qdata.status || '',
        attainedDate: Api.decodeDateOrNull(qdata.attained),
        expiryDate: Api.decodeDateOrNull(qdata.licence_expiry),
        grade: qdata.grade || ''
      };
      return pq;
    } catch (err) {
      ErrorService.logError('Exception in deserialising User DAP qualification', err);
      throw err;
    }
  }
}