/**
 * شريط حالة التجربة المجانية وسقف استهلاك الذكاء الاصطناعي في الصفحة الرئيسية.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { Icon } from '../../shared/ui/Icon';
import { ContactLinks } from '../../shared/ui/ContactLinks';
import { trialRemainingMessage } from '../../services/licenseService';
import { aiUsageManager } from '../../services/aiUsageManager';
import type { FriendlyQuotaStatus } from '../../shared/types/aiUsage';
import { useLicenseStore } from './licenseStore';

export function TrialStatusBanner({ showContact = true }: { showContact?: boolean }) {
  const { colors } = useTheme();
  const access = useLicenseStore(s => s.access);
  const [quotaStatus, setQuotaStatus] = useState<FriendlyQuotaStatus | null>(
    null,
  );

  useEffect(() => {
    if (access.kind !== 'trial') return;
    const unsub = aiUsageManager.subscribe(status => {
      setQuotaStatus(status);
    });
    return unsub;
  }, [access.kind]);

  if (access.kind !== 'trial' || !access.expiresAt) return null;

  const isNearLimit = quotaStatus?.isNearLimit;
  const isLimitReached = quotaStatus?.isLimitReached;
  const bannerColor = isLimitReached
    ? colors.error
    : isNearLimit
    ? '#e67e22'
    : colors.primary;
  const timeMsg = trialRemainingMessage(access.expiresAt);
  const displayMsg = isLimitReached
    ? `${timeMsg} — اكتمل رصيد الذكاء الاصطناعي المتاح اليوم.`
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
      <View style={styles.headerRow}>
        <Icon
          name={isNearLimit ? 'alert-circle-outline' : 'timer-outline'}
          family="community"
          size={18}
          color={bannerColor}
        />
        <Text style={[styles.text, { color: bannerColor }]}>{displayMsg}</Text>
      </View>
      {quotaStatus?.trialFeatureUsage ? (
        <View style={styles.quotaRow}>
          {quotaStatus.trialFeatureUsage.map(item => (
            <View
              key={item.featureType}
              style={[
                styles.quotaItem,
                {
                  backgroundColor:
                    item.remaining === 0
                      ? `${colors.error}12`
                      : `${colors.primary}10`,
                  borderColor:
                    item.remaining === 0
                      ? `${colors.error}35`
                      : `${colors.primary}30`,
                },
              ]}
            >
              <Text
                style={[
                  styles.quotaText,
                  {
                    color:
                      item.remaining === 0 ? colors.error : colors.textPrimary,
                  },
                ]}
              >
                {item.label}: {item.used}/{item.limit}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {showContact ? <ContactLinks variant="compact" /> : null}
      <View
        style={[styles.premiumHint, { borderColor: `${colors.primary}28` }]}
      >
        <Icon name="auto-awesome" size={15} color={colors.primary} />
        <Text style={[styles.premiumText, { color: colors.textSecondary }]}>
          الخطة المدفوعة تفتح الخطة السنوية وميزات إضافية بنموذج ذكاء أعلى جودة.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: radius.md,
    gap: 8,
    marginBottom: 4,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  text: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  quotaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  quotaItem: {
    flexGrow: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  quotaText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700' },
  premiumHint: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
    paddingTop: 8,
  },
  premiumText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'right',
  },
});
