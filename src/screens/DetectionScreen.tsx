import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DetectionStatusBanner } from '../components/DetectionStatusBanner';
import { GlassCard } from '../components/GlassCard';
import { ViewfinderCorners } from '../components/ViewfinderCorners';
import { getDriverById, getVehicleById } from '../data/mockData';
import { useMockDetection } from '../hooks/useMockDetection';
import { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { radii, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DetectionLive'>;

export const DetectionScreen = ({ navigation, route }: Props) => {
  const { colors: colors } = useAppearance();
  const styles = makeThemeStyles(colors);

  const vehicle = getVehicleById(route.params.vehicleId);
  const driver = vehicle ? getDriverById(vehicle.driverId) : undefined;
  const { headDirection, distracted, eyeGaze, detectionStatus, focusScore, dwellMs } = useMockDetection();
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

  const frameOffset = useMemo(() => {
    if (headDirection === 'Left') {
      return -34;
    }
    if (headDirection === 'Right') {
      return 34;
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
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Demo</Text>
          </View>
        </View>

        <View style={styles.cameraStage}>
          <View style={styles.cameraFeed}>
            <View style={styles.placeholderBand}>
              <Text style={styles.placeholderTitle}>Simulated cabin feed</Text>
              <Text style={styles.placeholderSub}>
                On device builds, plug in expo-camera frames + MediaPipe here (see comments in useMockDetection).
              </Text>
            </View>

            <ViewfinderCorners alert={distracted} />

            <Animated.View
              style={[
                styles.faceFrame,
                {
                  borderColor: distracted ? colors.danger : colors.logoGreen,
                  transform: [{ translateX: frameOffset }, { scale: pulse }],
                },
              ]}
            />

            <View style={[styles.headMarker, { left: distracted ? '62%' : '50%' }]} />

            <View style={styles.readout}>
              <Text style={styles.readoutLine}>Head pose: {headDirection}</Text>
              <Text style={styles.readoutLine}>Gaze: {eyeGaze}</Text>
              <Text style={styles.readoutLine}>Driver: {driver?.name ?? 'Unknown'}</Text>
            </View>
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <DetectionStatusBanner
            distracted={distracted}
            title={detectionStatus}
            subtitle={
              distracted ? 'Eyes off road detected. Attention diverted.' : 'Driver facing forward. Monitoring stable.'
            }
          />
        </Animated.View>

        <View style={styles.metricsGrid}>
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
            <Text style={styles.metricLabel}>Detection dwell</Text>
            <Text style={styles.metricValue}>{dwellMs}ms</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.integrationCard}>
          <Text style={styles.integrationTitle}>Native integration</Text>
          <Text style={styles.integrationText}>
            Swap useMockDetection() for a frame processor: capture Camera frames → MediaPipe Face Landmarker → map yaw
            to the same Focused / Driver Distracted states.
          </Text>
        </GlassCard>
      </SafeAreaView>
    </View>
  );
};

const makeThemeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
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
    backgroundColor: colors.warningSoft,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.warning,
  },
  liveText: {
    color: colors.text,
    fontWeight: '700',
  },
  cameraStage: {
    flex: 1,
    minHeight: 320,
  },
  cameraFeed: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
  },
  placeholderBand: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  placeholderTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  placeholderSub: {
    color: colors.textMuted,
    lineHeight: 22,
    fontSize: 14,
  },
  faceFrame: {
    position: 'absolute',
    top: '27%',
    left: '50%',
    marginLeft: -72,
    width: 144,
    height: 186,
    borderRadius: 30,
    borderWidth: 2,
  },
  headMarker: {
    position: 'absolute',
    top: '42%',
    marginLeft: -34,
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.black06,
  },
  readout: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 24,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  readoutLine: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
    gap: 10,
  },
  integrationTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  integrationText: {
    color: colors.textMuted,
    lineHeight: 20,
  },
});
