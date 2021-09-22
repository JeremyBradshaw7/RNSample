import { useEffect, useState } from 'react';
import { Dimensions, PixelRatio } from 'react-native';
import { Branding } from './Branding';
import ScreenInfo from './ScreenInfo';

/**
 * Window size and orientation custom hook
 *
 * Usage:
 * const { width, height } = useWindowSize();
 */
export function useScreen() {
  const _w = Dimensions.get('window').width;
  const _h = Dimensions.get('window').height;
  const isTablet = ScreenInfo.isTablet();
  const isPhablet = ScreenInfo.isPhablet();

  const [width, setWidth] = useState(_w);
  const [height, setHeight] = useState(_h);
  const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>(_h > _w ? 'Portrait' : 'Landscape');

  const handleResize = () => {
    const w = Dimensions.get('window').width;
    const h = Dimensions.get('window').height;
    setWidth(w);
    setHeight(h);
    setOrientation(h > w ? 'Portrait' : 'Landscape');
  };
  useEffect(() => {
    Dimensions.addEventListener('change', handleResize); // subscribe
    return () => {
      Dimensions.removeEventListener('change', handleResize); // unsubscribe
    };
  });
  return {
    width,
    height,
    orientation,
    isLandscape: orientation === 'Landscape',
    isPortrait: orientation === 'Portrait',
    isTablet,
    isPhablet,
    isPhone: !isTablet
  };
}

// Branding
export function useBranding() {
  const branding = Branding.getBranding();
  return {
    branding,
    primaryBackgroundColor: branding.primaryBackgroundColor || '#420086',
    primaryForegroundColor: branding.primaryForegroundColor || '#ffffff',
    secondaryBackgroundColor: branding.secondaryBackgroundColor || '#420086',
    secondaryForegroundColor: branding.secondaryForegroundColor || '#ffffff',
    logoUrl: branding.logoUrl,
    logoBackgroundColor: branding.logoBackgroundColor,
    backgroundImageUrl: branding.backgroundImageUrl,
    backgroundImageOpacity: branding.backgroundImageOpacity || 0.2,
    linkColor: branding.linkColor || '#420086'
  };
}
