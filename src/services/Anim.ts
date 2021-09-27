import { LayoutAnimation } from 'react-native';

/**
 * Anim - static methods for basic animations via LayoutAnimation
 */
export default class Anim {

  /**
   * Animate the next UI transition using Ease
   * @param {number} duration  Animation duration in milliseconds (default 150)
   */
  public static EaseNext(duration: number = 150) {
    const anim: any = {
      duration,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity
      }
    };
    LayoutAnimation.configureNext(anim);
  }

  /**
   * Animate the next UI transition using Ease
   * @param {number} duration  Animation duration in milliseconds (default 150)
   */
  public static EaseNextCreateOnly(duration: number = 350) {
    const anim: any = {
      duration,
      create: {
        type: LayoutAnimation.Types.easeOut,
        property: LayoutAnimation.Properties.opacity
      }
    };
    LayoutAnimation.configureNext(anim);
  }

  /**
   * Animate the next UI transition using Scale
   * @param {number} duration  Animation duration in milliseconds (default 150)
   */
  public static EaseNextScale(duration: number = 150) {
    const anim: any = {
      duration,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY
      }
    };
    LayoutAnimation.configureNext(anim);
  }

}