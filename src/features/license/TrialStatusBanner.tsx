/**
 * شريط حالة التجربة المجانية وسقف استهلاك الذكاء الاصطناعي في الصفحة الرئيسية.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { Icon } from '../../shared/ui/Icon';
import { trialRemainingMessage } from '../../services/licenseService';
import { aiUsageManager } from '../../services/aiUsageManager';
import type { FriendlyQuotaStatus } from '../../shared/types/aiUsage';
import { useLicenseStore } from './licenseStore';

export function TrialStatusBanner() {
  const { colors } = useTheme();
  const access = useLicenseStore(s => s.access);
  const [quotaStatus, setQuotaStatus] = useState<FriendlyQuotaStatus | null>(null);

  useEffect(() => {
    if (access.kind !== 'trial') return;
    const unsub = aiUsageManager.subscribe(status => {
      setQuotaStatus(status);
    });
    return unsub;
  }, [access.kind]);

  if (access.kind !== 'trial' || !access.expiresAt) return null;

  const isNearLimit = quotaStatus?.isNearLimit;
  const bannerColor = isNearLimit ? '#e67e22' : colors.primary;
  const timeMsg = trialRemainingMessage(access.expiresAt);
  const displayMsg = isNearLimit
    ? `${timeMsg} — اقتربت من حد الاستخدام التجريبي لأدوات الذكاء الاصطناعي.`
    : `الفترة التجريبية سارية (${timeMsg})`;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: `${bannerColor}14`,
          borderColor: `${bannerColor}35`,
        },
      ]}
    >
      <Icon
        name={isNearLimit ? 'alert-circle-outline' : 'timer-outline'}
        size={18}
        color={bannerColor}
      />
      <Text style={[styles.text, { color: bannerColor }]}>
        {displayMsg}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
});
