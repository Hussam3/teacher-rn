/**
 * شريط حالة التجربة المجانية وسقف استهلاك الذكاء الاصطناعي في الصفحة الرئيسية.
 * تصميم مدمج وخفيف يستغل المساحات بذكاء ولا يزاحم جدول الحصص.
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

function shortFeatureLabel(label: string): string {
  if (label.includes('اليومية')) return 'اليومية';
  if (label.includes('التدقيق')) return 'التدقيق';
  if (label.includes('التنسيق')) return 'التنسيق';
  return label;
}

export function TrialStatusBanner({
  showContact = false,
  showPremiumHint = false,
}: {
  showContact?: boolean;
  showPremiumHint?: boolean;
}) {
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
  const timeMsg = trialRemainingMessage(access.expiresAt).replace(
    ' من الفترة التجريبية',
    '',
  );
  const displayMsg = isLimitReached
    ? `${timeMsg} — اكتمل رصيد الذكاء اليوم`
    : `الفترة التجريبية (${timeMsg})`;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: `${bannerColor}10`,
          borderColor: `${bannerColor}30`,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Icon
          name={isNearLimit ? 'alert-circle-outline' : 'timer-outline'}
          family="community"
          size={16}
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
                      ? `${colors.error}14`
                      : `${colors.primary}12`,
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
                numberOfLines={1}
              >
                {shortFeatureLabel(item.label)}: {item.used}/{item.limit}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {showContact ? <ContactLinks variant="compact" /> : null}

      {showPremiumHint ? (
        <View
          style={[styles.premiumHint, { borderColor: `${colors.primary}28` }]}
        >
          <Icon name="auto-awesome" size={14} color={colors.primary} />
          <Text style={[styles.premiumText, { color: colors.textSecondary }]}>
            الخطة المدفوعة تفتح الخطة السنوية وميزات إضافية بنموذج ذكاء أعلى جودة.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: radius.md,
    gap: 6,
    marginBottom: 6,
    marginHorizontal: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  text: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  quotaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quotaItem: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  quotaText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
  },
  premiumHint: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
    paddingTop: 6,
  },
  premiumText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
  },
});
