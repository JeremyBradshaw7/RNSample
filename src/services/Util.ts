import { Platform } from 'react-native';
import moment from 'moment';
import _ from 'lodash';
import { ICodeMap } from 'appstate/config/models';
import { IAnyMap } from 'components/CodePicker';

export default class Util {

  /********************************************
  ** Date/time methods
  *********************************************/

  public static formatDate(date: number | null, shortFormat: boolean = false) {
    if (date === null) {
      return '';
    }
    const fmt = shortFormat ? 'D MMM YY' : 'D MMM YYYY';
    const dateobj = new Date(date);
    return dateobj instanceof Date && !isNaN(dateobj.valueOf()) ? moment(dateobj).format(fmt) : '';
  }

  public static formatMinutes(minutes: number | null) {
    if (minutes === null) {
      return '';
    }
    const mins = minutes % 60;
    return `${Math.floor(minutes / 60)}:${mins < 10 ? '0' + mins : mins}`;
  }

  public static formatDateRange(date1: number | null, date2: number | null, separator: string = ' - ') {
    if (date1 === null || isNaN(date1)) {
      return this.formatDate(date2);
    } else if (date2 === null || isNaN(date2)) {
      return this.formatDate(date1);
    }
    const f1 = this.formatDate(date1), f2 = this.formatDate(date2);
    if (f1 === f2) {
      return f1; // same day
    } else if (f1.slice(-9) === f2.slice(-9)) {
      return f1.replace(f1.slice(-9), '') + separator + f2; // same month
    } else if (f1.slice(-5) === f2.slice(-5)) {
      return f1.replace(f1.slice(-5), '') + separator + f2; // same year
    }
    return f1 + separator + f2;
  }

  public static formatDateTime(date: number | null = null, includeComma: boolean = true) {
    if (date === null) {
      return '';
    }
    const dateobj = new Date(date);
    const comma = includeComma ? ',' : '';
    const f = dateobj instanceof Date && !isNaN(dateobj.valueOf()) ? moment.utc(dateobj).local().format(`D MMM YYYY${comma} HH:mm`).replace(`${comma} 00:00`, '') : '';
    return f;
  }

  public static timePortionOfDate(date: number | null = null): number | null {
    if (date === null) {
      return null;
    }
    const ms = date - Util.truncateDate(date);
    const mins = Math.trunc(ms / (1000 * 60));
    return mins;
  }

  public static formatDateWith(date: number | null, format: string) {
    if (!date) {
      return '';
    }
    const dateobj = new Date(date);
    return dateobj instanceof Date && !isNaN(dateobj.valueOf()) ? moment.utc(dateobj).local().format(format) : '';
  }

  /**
   * Add units to date in moment style, but work with numeric dates
   */
  public static shiftDate(date: number, num: any, type: 'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'Q' | 'y'): number {
    if (!date) {
      return date;
    }
    const momentObj = moment(date);
    momentObj.add(num, type);
    return momentObj.toDate().getTime();
  }

  /**
   * Difference between two dates (moment style)
   */
  public static dateDiff(date1: number, date2: number, type: 'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'Q' | 'y'): number {
    if (!date1 || !date2) {
      return 0;
    }
    return moment(date2).diff(moment(date1), type);
  }

  /**
   * Truncate a date (remove time element)
   */
  public static truncateDate(date: number): number {
    return moment(date).startOf('day').toDate().getTime();
  }

  /**
   * Today's date in number format (removing time element)
   */
  public static today(): number {
    return this.truncateDate(Util.now());
  }
  public static now(): number {
    return new Date().getTime();
  }

  public static fromNow(date: number): string {
    return moment(date).fromNow();
  }

  /*********************************************
  ** Durations
  **********************************************/

  // basic version can handle up to 24 hours, and will format to mm:ss if under an hour, hh:mm:ss otherwise
  public static formatDuration(seconds: number) {
    // limitation: the duration cannot be more than 24 hours
    if (seconds < 0 || isNaN(seconds)) {
      return '-';
    }
    if (seconds < 60 * 60) {
      return new Date(seconds * 1000).toISOString().substr(14, 5);
    }
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  }

  /**
   * Format a duration given in seconds (advanced version with more options)
   * @param   {number}  seconds        The number seconds
   * @param   {number}  decimalPlaces  decimalPlaces to format with (defaults to 0), -1 shows any precision in the seconds
   * @return  {[type]}                 [return description]
   */
  public static formatDurationAdvanced(seconds: number | null, decimalPlaces: number = 0) {
    if (seconds === null) {
      return '';
    }
    const hh = Math.floor(seconds / 3600);
    const mm = Math.floor((seconds - (hh * 3600)) / 60);
    const ss = Math.floor(seconds - (hh * 3600) - (mm * 60));
    const ms = seconds - Math.floor(seconds); // fractional seconds (0 or 0.nnnn)
    return hh +
      ':' + ('0' + mm).slice(-2) +
      ':' + ('0' + ss).slice(-2) +
      (
        decimalPlaces < 0 ? (!ms ? '' : (ms).toString().replace('0.', '.')) :
          !decimalPlaces ? '' :
            ('.' + seconds.toFixed(decimalPlaces).slice(-decimalPlaces))
      );
  }

  /********************************************
  ** Number methods
  *********************************************/

  // the precision parameter works same way as PHP and Excel whereby a positive 1 would round to 1 decimal place and -1 would round to the tens.
  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
  public static round(num: number, precision: number = 0) {
    const factor = Math.pow(10, precision);
    const tempNumber = num * factor;
    const roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
  }

  /********************************************
  ** Other methods
  *********************************************/

  /**
   * Sort an array of objects by some string property which contains numerics which must preserve logical ordering, eg. Folder, Unit 1, Unit 2, Unit 10, Zzz.
   */
  public static sortPreserve(array: any[], nameProperty: string = 'name', onlyIf: boolean = true): any[] {
    if (!onlyIf) { // allow to pass in a condition to bypass sorting
      return array;
    }
    return _.sortBy(array, (e: any) => {
      const sequence = Number.parseFloat((e[nameProperty].match(/\d+\.?\d*/) || ['0'])[0]);
      // pad each number with leading zeros to fixed length, convert to lower case for case-insensitive sort
      return e[nameProperty].replace(sequence.toString(), `00000000${sequence}`.slice(-8)).toLowerCase();
    });
  }

  /**
   * Monospace font appropriate for platform
   */
  public static monoFontFamily(): string {
    return Platform.OS === 'android' ? 'monospace' : 'Courier';
  }

  /**
   * Can do in async function: await Util.delay(1000);
   */
  public static delay = (time: number) => new Promise((res: any) => setTimeout(() => res(), time));

  /**
   * If val1 is falsy or EMPTY OBJECT, return val2, else return val1. 0 in val1 will return 0
   * @param val1 Value to check and return if it has a value
   * @param val2 Value to return if val1 is falsy or empty object
   */
  public static nvl(val1: any, val2: any): any {
    return val1 === null ? val2 : !isNaN(val1) ? val1 : _.isEmpty(val1) ? val2 : (val1 || val2);
  }

  public static isNumber(val: any) {
    return val !== undefined && val !== null && !isNaN(val);
  }

  /**
   * Array nvl - if first array is empty take second
   */
  public static anvl(val1: any[], val2: any[]): any[] {
    return val1.length > 0 ? val1 : val2;
  }

  /**
   * An asynchronous forEach
   *
   * @param   {[type]}  array          Array of objects to iterate
   * @param   {[type]}  asyncCallback  Asynchronous callback for each object
   */
  public static async awaitForEach(array, asyncCallback) {
    for (let index = 0; index < array.length; index++) {
      await asyncCallback(array[index], index, array);
    }
  }

  /**
   * Transform array of objects to ICodeMap (id to string mapping)
   */
  public static arrayToCodeMap(arr: any[], keyField: string = 'id', valueField: string = 'name'): ICodeMap {
    const map: ICodeMap = {};
    arr.forEach((data: any) => {
      if (data[keyField]) {
        map[data[keyField]] = data[valueField] || '';
      }
    });
    return map;
  }
  // same but with callback to get value
  public static arrayToCodeMapFn(arr: any[], keyField: string = 'id', valueCallback: (data: any) => string): ICodeMap {
    const map: ICodeMap = {};
    arr.forEach((data: any) => {
      if (data[keyField]) {
        map[data[keyField]] = valueCallback(data) || '';
      }
    });
    return map;
  }

  /**
   * Transform array of objects to IAnyMap (id to object mapping)
   */
  public static arrayToMap(arr: any[], keyField: string, addIndexSortKey: boolean = false): IAnyMap {
    let idx = 0;
    if (!arr || !Array.isArray(arr)) {
      return {};
    }
    const arrFiltered = arr.filter((data: any) => data.hasOwnProperty(keyField)); // only those entries in the array with the key field, otherwise one entry in the map will have undefined key
    if (addIndexSortKey) {
      arrFiltered.forEach((elem: any) => {
        elem['sortKey'] = idx++;
      });
    }
    const map: IAnyMap = _.keyBy(arrFiltered, (o) => o[keyField]);
    return map;
  }

  // IAnyMap to ICodeMap
  public static anyMapToCodeMap(map: IAnyMap, valueField: string = 'name'): ICodeMap {
    const newmap: ICodeMap = {};
    Object.keys(map).forEach((k: string) => {
      if (map[k] && map[k][valueField]) {
        newmap[k] = map[k][valueField] || '';
      }
    });
    return newmap;
  }

  /**
   * Transform array of strings to IAnyMap (key and values both the same)
   */
  public static stringArrayToMap(arr: string[], formatKey?: Function): IAnyMap {
    if (!arr || !Array.isArray(arr)) {
      return {};
    }
    let map: IAnyMap = {};
    if (!!formatKey) {
      arr.forEach((key: string) => {
        map[key] = formatKey(key);
      });
    } else {
      map = _.keyBy(arr, (k) => k);
    }
    return map;
  }

  /**
   * Filter a map
   */
  public static mapFilter(map: IAnyMap, callback: Function): IAnyMap {
    const res: IAnyMap = {};
    Object.keys(map).forEach((key: any) => {
      if (!!callback(map[key], key)) {
        res[key] = map[key];
      }
    });
    return res;
  }

  /**
   * Groups items from an array into an array of objects, grouped by a property 'prop' name, maintaining original order. Based on functionality of LoDash's 'groupBy' function, but, unlike LoDash, preserves original array's order and returns an array instead of an object.
   *
   * @param arr {array of objects} - Objects within array should contain a property marked by the 'prop' argument, or else they will be excluded from the output and a warning will be logged.
   * @param prop {string} Propery to use for grouping. The value of this will be converted to a string when creating group names.
   */
  public static groupByKeepOrder(arr: any[], prop: string, includeEmpty: boolean = true): any[] {
    const newArr: any[][] = [] // array to return, keeps track of order
      , wrapObj = {}; // temporary object used for grouping

    _.forEach(arr, (item: any) => {

      // gets property name to group by and converts it to a string for grouping purposes
      let propName = item[prop];
      if (propName || includeEmpty) {
        propName = !propName ? '' : propName.toString();

        // checks if group exists already and creates a new group if not, pushing it into the array to return ('newArr')
        if (!wrapObj[propName]) {
          wrapObj[propName] = { key: propName, data: [] };
          newArr.push(wrapObj[propName]);
        }

        // adds item to the group
        wrapObj[propName].data.push(item);
      }
    });
    return newArr;
  }

  public static stripReturns(txt: string | undefined | null): string {
    return (txt || '').replace(/(\r\n)+|\r+|\n+|\t+/ig, ' ').replace(/  /g, ' ');
  }

  public static diff(obj1: any, obj2: any): any {
    const propsDiff = Object.keys(obj1).reduce((diff, key) => {
      if (obj2[key] === obj1[key]) {
        return diff;
      }
      return {
        ...diff,
        [key]: obj1[key]
      };
    }, {});
    return propsDiff;
  }
}