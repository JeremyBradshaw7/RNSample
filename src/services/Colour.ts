import Theme from './Theme';
import tinycolor from 'tinycolor2';

export default class Colour {

  /**
   * Get contrast colour for given hex colour, eg. to find ideal text colour for background (#000000 or #ffffff)
   * @param {string} hexcolor Hex colour to evaluate, including the #
   * @returns {string} Hex colour of black or white
   */
  public static getContrastColour(hexcolor: string): string {
    if (!hexcolor) {
      return '#000000';
    }
    const r: number = parseInt(hexcolor.substr(1, 2), 16);
    const g: number = parseInt(hexcolor.substr(3, 2), 16);
    const b: number = parseInt(hexcolor.substr(5, 2), 16);
    const yiq: number = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  }

  /**
   * Get 5-band colour for given value and max value
   * @param {number} value  Value to evaluate
   * @param {number} maxval Maximum value (or number of grades)
   * @returns {string} Colour name
   */
  public static get5BandColour(value: number, maxval: number): string {
    const backgroundColour =
      !value ? Theme.band0 :
        value <= maxval / 5 ? Theme.band1 :
          value <= (maxval / 5) * 2 ? Theme.band2 :
            value <= (maxval / 5) * 3 ? Theme.band3 :
              value <= (maxval / 5) * 4 ? Theme.band4 :
                Theme.band5;
    return backgroundColour;
  }

  /**
   * Get Continuous colour (in red to green scale) for given value and max value
   * @param {number} value  Value to evaluate
   * @param {number} maxval Maximum value (or number of grades)
   * @returns {string} Colour name
   */
  public static getContinuousBandColour(value: number, maxval: number): string {
    if (!value) {
      return '#ffffff';
    }
    const base510 = Math.round((value * 510) / maxval);
    const retval = base510 <= 255
      ? '#ff' + ('0' + base510.toString(16)).slice(-2) + '00'
      : '#' + ('0' + (510 - base510).toString(16)).slice(-2) + 'ff00';
    return retval;
  }

  /**
   * Get transparent colour over white as solid colour
   */
  public static getTransparentColour(col: string, opacity: number = 0.2) {
    if (col.startsWith('rgb(')) {
      return col.replace('rgb(', 'rgba(').replace(')', `,${opacity})`);
    } else if (col.startsWith('#')) {
      // return col + (opacity * 255).toString(16); // hex
      // Android WebView requires rgba format, so translate
      const r = parseInt(col.substring(1, 3), 16),
        g = parseInt(col.substring(3, 5), 16),
        b = parseInt(col.substring(5, 7), 16);
      return `rgba(${r},${g},${b},${opacity})`;
    } else {
      return col; // can't work with named colors!!
    }
  }

  public static blendColors(col1: string, col2: string, percentage: number) {
    return tinycolor.mix(tinycolor(col1), tinycolor(col2), percentage).toHexString();
  }

  public static isDark(col1: string, brightnessThreshold: number = 150) {
    return tinycolor(col1).getBrightness() < brightnessThreshold;
  }
  public static isLight(col1: string, brightnessThreshold: number = 150) {
    return tinycolor(col1).getBrightness() >= brightnessThreshold;
  }

  public static darkerColour(col1: string, col2: string): string {
    if (!col2) {
      return col1;
    } else if (!col1) {
      return col2;
    }
    return tinycolor(col1).getBrightness() < tinycolor(col2).getBrightness() ? col1 : col2;
  }

  public static darkenColour(col: string, brightnessThreshold: number = 150): string {
    const colorInfo = tinycolor(col);
    if (colorInfo.getBrightness() > brightnessThreshold) {
      // darken it if it's light
      const existingBrightness = colorInfo.getBrightness();
      const bg = colorInfo.darken(existingBrightness - 150).toString();
      return bg;
    }
    return col;
  }

}