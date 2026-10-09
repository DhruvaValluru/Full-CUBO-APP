import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View, type View as RNView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DetectionStatusBanner } from '../components/DetectionStatusBanner';
import { GlassCard } from '../components/GlassCard';
import { ViewfinderCorners } from '../components/ViewfinderCorners';
import { getDriverById, getVehicleById } from '../data/mockData';
import { useWebFaceLandmarks } from '../hooks/useWebFaceLandmarks';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DetectionLive'>;

export const DetectionScreen = ({ navigation, route }: Props) => {
  const vehicle = getVehicleById(route.params.vehicleId);
  const driver = vehicle ? getDriverById(vehicle.driverId) : undefined;

  const {
    setHost,
    headDirection,
    distracted,
    eyeGaze,
    detectionStatus,
    focusScore,
    dwellMs,
    facePresent,
    error,
    ready,
  } = useWebFaceLandmarks();

  const pulse = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (distracted) {
      pulseAnimation.current?.stop();
      pulseAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.03, duration: 450, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 450, useNativeDriver: true }),
        ]),
      );
      pulseAnimation.current.start();
    } else {
      pulseAnimation.current?.stop();
      pulse.setValue(1);
    }
    return () => {
      pulseAnimation.current?.stop();
    };
  }, [distracted, pulse]);

  const attachCamera = useCallback(
    (node: RNView | null) => {
      if (Platform.OS !== 'web') {
        return;
      }
      if (!node) {
        setHost(null);
        return;
      }
      setHost(node as unknown as HTMLElement);
    },
    [setHost],
  );

  const frameOffset = useMemo(() => {
    if (headDirection === 'Left') {
      return -28;
    }
    if (headDirection === 'Right') {
      return 28;
    }
    return 0;
  }, [headDirection]);

  if (!vehicle) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={styles.topTitle}>Live monitoring</Text>
            <Text style={styles.topSubtitle}>{vehicle.model}</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={[styles.liveDot, { backgroundColor: ready ? colors.success : colors.warning }]} />
            <Text style={[styles.liveText, { color: ready ? colors.success : colors.warning }]}>
              {ready ? 'Live' : 'Setup'}
            </Text>
          </View>
        </View>

        <View style={styles.cameraStage}>
          <View style={styles.cameraFeed}>
            <View ref={attachCamera} collapsable={false} style={StyleSheet.absoluteFill} />
            <ViewfinderCorners alert={distracted} />

            <Animated.View
              pointerEvents="none"
              style={[
                styles.faceFrame,
                {
                  borderColor: distracted ? colors.danger : colors.logoGreen,
                  transform: [{ translateX: frameOffset }, { scale: pulse }],
                  opacity: facePresent ? 0.95 : 0.35,
                },
              ]}
            />

            <View style={styles.feedHeader}>
              <Text style={styles.feedTag}>Webcam</Text>
              <Text style={styles.feedTag}>MediaPipe</Text>
            </View>

            <View style={styles.readout}>
              <Text style={styles.readoutLine}>Head: {headDirection}</Text>
              <Text style={styles.readoutLine}>Gaze: {eyeGaze}</Text>
              <Text style={styles.readoutLine}>Driver: {driver?.name ?? '—'}</Text>
            </View>
          </View>
        </View>

        {error ? (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorTitle}>Camera / model</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>Use Chrome over HTTPS or localhost, and allow camera access.</Text>
          </GlassCard>
        ) : null}

        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <DetectionStatusBanner
            distracted={distracted}
            title={detectionStatus}
            subtitle={
              distracted
                ? 'Eyes off road detected. Attention diverted.'
                : 'Driver facing forward. Monitoring stable.'
            }
          />
        </Animated.View>

        <ScrollView
          style={styles.metricsScroll}
          contentContainerStyle={styles.metricsGrid}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Head direction</Text>
            <Text style={styles.metricValue}>{headDirection}</Text>
          </GlassCard>
          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Eye gaze</Text>
            <Text style={styles.metricValue}>{eyeGaze}</Text>
          </GlassCard>
          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Focus score</Text>
            <Text style={styles.metricValue}>{focusScore}</Text>
          </GlassCard>
          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLabel}>Dwell</Text>
            <Text style={styles.metricValue}>{dwellMs}ms</Text>
          </GlassCard>
        </ScrollView>

        <GlassCard style={styles.integrationCard}>
          <Text style={styles.integrationTitle}>Production hook</Text>
          <Text style={styles.integrationText}>
            This build uses your browser camera + MediaPipe Face Landmarker (WASM). Tune YAW_THRESH in
            useWebFaceLandmarks.web.ts or swap in a custom head-pose model.
          </Text>
        </GlassCard>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black06,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topCopy: {
    flex: 1,
  },
  topTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  topSubtitle: {
    color: colors.textMuted,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.successSoft,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  liveText: {
    fontWeight: '700',
  },
  cameraStage: {
    minHeight: 280,
    flex: 1,
    maxHeight: 420 as any,
  },
  cameraFeed: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: '#0E100F',
  },
  feedHeader: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  feedTag: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  faceFrame: {
    position: 'absolute',
    top: '22%',
    alignSelf: 'center',
    width: 132,
    height: 168,
    borderRadius: 28,
    borderWidth: 2,
    zIndex: 1,
  },
  readout: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: 2,
    zIndex: 2,
  },
  readoutLine: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  metricsScroll: {
    maxHeight: 200,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  metricCard: {
    width: '48%',
    padding: spacing.md,
    gap: 8,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  metricValue: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
  },
  integrationCard: {
    padding: spacing.md,
    gap: 8,
  },
  integrationTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  integrationText: {
    color: colors.textMuted,
    lineHeight: 18,
    fontSize: 12,
  },
  errorCard: {
    padding: spacing.md,
    gap: 6,
    borderColor: colors.dangerSoft,
  },
  errorTitle: {
    color: colors.danger,
    fontWeight: '800',
  },
  errorText: {
    color: colors.text,
    fontSize: 13,
  },
  errorHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
