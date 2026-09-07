/**
 * معاينة الطباعة — تعرض نفس HTML الذي سيُطبع فعليًا داخل حاوية تحاكي
 * مقاس الورقة A4 والهوامش المحددة، مع قياس عدد الصفحات الفعلي.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { PressableScale } from '../../shared/ui/PressableScale';
import { buildExamHtmlWithMeta } from './examHtml';
import type { EditorDocument, PrintSettings } from '../../shared/types/editor';
import { AVAILABLE_EXAM_FONTS } from '../../shared/types/editor';
import { PrintSettingsPanel } from './PrintSettingsPanel';

interface PrintPreviewDialogProps {
  visible: boolean;
  doc: EditorDocument;
  onClose: () => void;
  onConfirmPrint: () => void;
  settingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  onChangeSettings: (patch: Partial<PrintSettings>) => void;
  onResetSettings: () => void;
}

// يقيس ارتفاع المحتوى الفعلي داخل الصفحة ويقارنه بارتفاع A4
const MEASURE_SCRIPT = `
  (function () {
    var mmToPx = 96 / 25.4;
    var pageHeightPx = 297 * mmToPx;
    var sheet = document.querySelector('.a4-sheet');
    var contentHeightPx = sheet ? sheet.scrollHeight : document.body.scrollHeight;
    var pages = Math.max(1, Math.ceil(contentHeightPx / pageHeightPx));
    var split = 0;
    document.querySelectorAll('.q').forEach(function (q) {
      var top = q.getBoundingClientRect().top + window.scrollY;
      var bottom = top + q.offsetHeight;
      var pageStart = Math.floor(top / pageHeightPx);
      var pageEnd = Math.floor(bottom / pageHeightPx);
      if (pageEnd > pageStart) split++;
    });
    window.ReactNativeWebView.postMessage(JSON.stringify({ pages: pages, split: split }));
  })();
  true;
`;

interface PageMeasure {
  pages: number;
  split: number;
}

export function PrintPreviewDialog({
  visible,
  doc,
  onClose,
  onConfirmPrint,
  settingsOpen,
  onSettingsOpenChange,
  onChangeSettings,
  onResetSettings,
}: PrintPreviewDialogProps) {
  const { colors } = useTheme();
  const [measure, setMeasure] = useState<PageMeasure | null>(null);
  const [isFitMode, setIsFitMode] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const { html, autoFitApplied, effectiveSettings } = useMemo(
    () => buildExamHtmlWithMeta(doc),
    [doc],
  );

  useEffect(() => {
    setMeasure(null);
  }, [html]);

  const currentFontOption = useMemo(() => {
    return (
      AVAILABLE_EXAM_FONTS.find(f => f.id === effectiveSettings.fontFamily) ??
      AVAILABLE_EXAM_FONTS[0]
    );
  }, [effectiveSettings.fontFamily]);

  const handleMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data) as PageMeasure;
      if (typeof data.pages === 'number') setMeasure(data);
    } catch {
      const n = parseInt(e.nativeEvent.data, 10);
      if (!Number.isNaN(n)) setMeasure({ pages: n, split: 0 });
    }
  }, []);

  const pageCount = measure?.pages ?? 1;

  // سكربت ضبط نسبة التكبير والملاءمة التلقائية لورقة A4 داخل المعاينة
  const zoomScript = useMemo(() => {
    return `
      (function() {
        function applyScale() {
          var sheet = document.querySelector('.a4-sheet');
          if (!sheet) return;
          var isFit = ${isFitMode};
          var manualZoom = ${zoomLevel};
          
          if (isFit) {
            var screenWidth = window.innerWidth || document.documentElement.clientWidth || 360;
            var sheetWidth = sheet.offsetWidth || 794;
            var scale = Math.min(1.0, (screenWidth - 12) / sheetWidth);
            if (scale > 0) {
              sheet.style.transform = 'scale(' + scale + ')';
              sheet.style.transformOrigin = 'top center';
              sheet.style.margin = '0 auto';
              document.body.style.minHeight = (sheet.offsetHeight * scale + 30) + 'px';
            }
          } else {
            var scale = manualZoom / 100;
            sheet.style.transform = 'scale(' + scale + ')';
            sheet.style.transformOrigin = 'top center';
            sheet.style.margin = '0 auto';
            document.body.style.minHeight = (sheet.offsetHeight * scale + 30) + 'px';
          }
        }
        applyScale();
        window.addEventListener('resize', applyScale);
      })();
      true;
    `;
  }, [isFitMode, zoomLevel]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* شريط العنوان العلوي */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.headerRight}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                معاينة الورقة القياسية (A4)
              </Text>
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor:
                      pageCount === 1 ? `${colors.success}22` : `${colors.warning}22`,
                  },
                ]}
              >
                <Icon
                  name={pageCount === 1 ? 'check-circle' : 'info'}
                  size={14}
                  color={pageCount === 1 ? colors.success : colors.warning}
                />
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color:
                        pageCount === 1 ? colors.success : colors.warning,
                    },
                  ]}
                >
                  {pageCount === 1 ? 'صفحة واحدة (A4)' : `${pageCount} صفحات`}
                </Text>
              </View>
            </View>

            <View style={styles.badges}>
              {autoFitApplied ? (
                <View
                  style={[
                    styles.badgePill,
                    { backgroundColor: `${colors.primary}22` },
                  ]}
                >
                  <Icon name="auto-awesome" size={13} color={colors.primary} />
                  <Text
                    style={[styles.badgeText, { color: colors.primary }]}
                  >
                    احتواء تلقائي
                  </Text>
                </View>
              ) : null}

              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: `${colors.textSecondary}18` },
                ]}
              >
                <Icon name="font-download" size={12} color={colors.textSecondary} />
                <Text
                  style={[styles.badgeText, { color: colors.textSecondary }]}
                >
                  الخط: {currentFontOption?.name.split(' ')[1] ?? 'كايرو'}
                </Text>
              </View>

              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: `${colors.textSecondary}18` },
                ]}
              >
                <Text
                  style={[styles.badgeText, { color: colors.textSecondary }]}
                >
                  الهامش: {effectiveSettings.marginMm} مم | الحجم: {effectiveSettings.fontSize}pt
                </Text>
              </View>
            </View>
          </View>

          {/* أزرار التحكم بالزووم والإعدادات */}
          <View style={styles.headerLeftControls}>
            <View
              style={[
                styles.zoomControls,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
            >
              <PressableScale
                onPress={() => {
                  setIsFitMode(false);
                  setZoomLevel(z => Math.max(50, z - 15));
                }}
                animated={false}
                style={styles.zoomBtn}
              >
                <Text style={[styles.zoomBtnText, { color: colors.textPrimary }]}>−</Text>
              </PressableScale>
              <PressableScale
                onPress={() => {
                  setIsFitMode(f => !f);
                  if (isFitMode) setZoomLevel(100);
                }}
                animated={false}
                style={styles.zoomResetBtn}
              >
                <Text style={[styles.zoomLevelText, { color: colors.primary }]}>
                  {isFitMode ? 'ملاءمة' : `${zoomLevel}%`}
                </Text>
              </PressableScale>
              <PressableScale
                onPress={() => {
                  setIsFitMode(false);
                  setZoomLevel(z => Math.min(180, z + 15));
                }}
                animated={false}
                style={styles.zoomBtn}
              >
                <Text style={[styles.zoomBtnText, { color: colors.textPrimary }]}>+</Text>
              </PressableScale>
            </View>

            <PressableScale
              onPress={() => onSettingsOpenChange(!settingsOpen)}
              animated={false}
              style={[
                styles.settingsBtn,
                {
                  backgroundColor: settingsOpen
                    ? `${colors.primary}18`
                    : colors.surfaceElevated,
                  borderColor: settingsOpen ? colors.primary : colors.border,
                },
              ]}
            >
              <Icon name="tune" size={16} color={colors.primary} />
              <Text style={[styles.settingsBtnText, { color: colors.primary }]}>
                إعدادات
              </Text>
            </PressableScale>
          </View>
        </View>

        {settingsOpen ? (
          <View
            style={[
              styles.settingsPanel,
              { backgroundColor: colors.surface, borderBottomColor: colors.border },
            ]}
          >
            <View style={styles.settingsPanelHeader}>
              <Text style={[styles.settingsPanelTitle, { color: colors.textPrimary }]}>
                تعديل مباشر للمعاينة
              </Text>
              <PressableScale
                onPress={() => onSettingsOpenChange(false)}
                animated={false}
                style={styles.closeSettingsButton}
              >
                <Icon name="close" size={20} color={colors.textSecondary} />
              </PressableScale>
            </View>
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.settingsPanelContent}
            >
              <PrintSettingsPanel
                settings={doc.printSettings}
                onChange={onChangeSettings}
                onReset={onResetSettings}
              />
            </ScrollView>
          </View>
        ) : null}

        {/* مساحة المعاينة الحقيقية */}
        <View style={styles.sheetWrapper}>
          <WebView
            key={`${doc.id}_${JSON.stringify(effectiveSettings)}_${isFitMode}_${zoomLevel}`}
            source={{ html, baseUrl: 'https://fonts.googleapis.com' }}
            style={styles.webview}
            onMessage={handleMessage}
            injectedJavaScript={`${MEASURE_SCRIPT}\n${zoomScript}`}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={false}
            scalesPageToFit={true}
            originWhitelist={['*']}
            mixedContentMode="always"
          />
        </View>

        {/* شريط الإجراءات السفلي */}
        <View
          style={[
            styles.actions,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <Button label="إغلاق" variant="ghost" onPress={onClose} />
          <Button
            label="طباعة الآن"
            icon={{ name: 'print' }}
            onPress={onConfirmPrint}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 36 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerRight: { flex: 1, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700' },
  headerLeftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  zoomBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  zoomBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  zoomResetBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  zoomLevelText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  settingsBtnText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700' },
  settingsPanel: {
    maxHeight: 300,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  settingsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  settingsPanelTitle: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },
  closeSettingsButton: { padding: 4 },
  settingsPanelContent: { paddingBottom: 14 },
  sheetWrapper: {
    flex: 1,
    padding: 12,
    backgroundColor: '#94a3b8',
  },
  webview: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: '#cbd5e1',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
});
