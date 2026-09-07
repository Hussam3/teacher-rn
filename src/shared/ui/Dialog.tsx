/**
 * نافذة حوار مركزية (Dialog).
 */
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../theme/tokens';
import { useResponsive } from '../hooks/useResponsive';

export interface DialogProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  /** السماح بالتمرير للمحتوى الطويل */
  scrollable?: boolean;
}

export function Dialog({
  visible,
  title,
  onClose,
  children,
  actions,
  scrollable = true,
}: DialogProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
        <View style={[styles.dialogContainer, { padding: isMobile ? 16 : 32 }]}>
          {/* خلفية معتمة منفصلة بدون اعتراض تمرير المحتوى الداخلي */}
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
            onPress={onClose}
          />
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                width: isMobile ? '100%' : 480,
                maxHeight: isMobile ? '90%' : '85%',
              },
            ]}
          >
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            {scrollable ? (
              <ScrollView
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={16}
                style={styles.scrollView}
                contentContainerStyle={styles.body}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={styles.body}>{children}</View>
            )}
            {actions ? (
              <View style={[styles.actions, { borderTopColor: colors.divider }]}>{actions}</View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  dialogContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    flexShrink: 1,
    display: 'flex',
    flexDirection: 'column',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  scrollView: {
    flexShrink: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 14,
    borderTopWidth: 1,
  },
});

