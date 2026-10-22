import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppearance } from '../theme/AppearanceContext';
import { spacing } from '../theme/theme';

type ScreenShellProps = {
  children: ReactNode;
  scrollable?: boolean;
  tone?: 'app' | 'dark';
  edgeToEdge?: boolean;
  safeAreaColor?: string;
  onViewportHeight?: (height: number) => void;
};

export const ScreenShell = ({ children, scrollable = true, tone = 'app', edgeToEdge = false, safeAreaColor, onViewportHeight }: ScreenShellProps) => {
  const { colors } = useAppearance();
  const backgroundColor = colors.background;
  const content = scrollable ? (
    <ScrollView onLayout={event => onViewportHeight?.(event.nativeEvent.layout.height)} style={{ backgroundColor }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[styles.scrollContent, edgeToEdge && { paddingHorizontal: 0, paddingTop: 0, gap: 0 }]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fixedContent}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <SafeAreaView edges={['top']} style={[styles.safeArea, safeAreaColor ? { backgroundColor: safeAreaColor } : undefined]}>
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
