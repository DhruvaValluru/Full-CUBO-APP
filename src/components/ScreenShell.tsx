import { ReactNode, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppearance } from '../theme/AppearanceContext';
import { useNavChrome } from '../features/navigation/NavChromeContext';
import { spacing } from '../theme/theme';

type ScreenShellProps = {
  children: ReactNode;
  scrollable?: boolean;
  tone?: 'app' | 'dark';
};

export const ScreenShell = ({ children, scrollable = true, tone = 'app' }: ScreenShellProps) => {
  const lastY = useRef(0); const { setHidden } = useNavChrome();
  const { colors } = useAppearance();
  const backgroundColor = colors.background;
  const content = scrollable ? (
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" scrollEventThrottle={16} onScroll={event => { const y = event.nativeEvent.contentOffset.y; const delta = y - lastY.current; if (y < 30 || delta < -5) setHidden(false); else if (delta > 5) setHidden(true); lastY.current = y; }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
