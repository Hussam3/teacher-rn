/**
 * خطاف التصميم المتجاوب — يوفّر نوع الجهاز وقيماً تكيفية.
 */
import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { breakpoints } from '../theme/tokens';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const isMobile = width < breakpoints.mobile;
    const isTablet = width >= breakpoints.mobile && width < breakpoints.tablet;
    const isDesktop = width >= breakpoints.tablet;

    const device: DeviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    const contentPadding = isMobile ? 16 : isTablet ? 24 : 32;

    const gridColumns = Math.max(
      2,
      Math.min(6, Math.floor(width / 180)),
    );

    /** اختيار قيمة حسب نوع الجهاز */
    const pick = <T,>(mobile: T, tablet?: T, desktop?: T): T => {
      if (isDesktop) return desktop ?? tablet ?? mobile;
      if (isTablet) return tablet ?? mobile;
      return mobile;
    };

    return { width, isMobile, isTablet, isDesktop, device, contentPadding, gridColumns, pick };
  }, [width]);
}
