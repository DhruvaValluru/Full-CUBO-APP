import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppearance } from '../theme/AppearanceContext';
import { spacing } from '../theme/theme';

type ScreenShellProps = {
  children: ReactNode;
  scrollable?: boolean;
  tone?: 'app' | 'dark';
};

export const ScreenShell = ({ children, scrollable = true, tone = 'app' }: ScreenShellProps) => {
  const { colors } = useAppearance();
  const backgroundColor = colors.background;
  const content = scrollable ? (
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fixedContent}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {content}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 125,
    gap: spacing.sm,
  },
  fixedContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 90,
  },
});
