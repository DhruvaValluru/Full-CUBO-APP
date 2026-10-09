import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '../components/GlassCard';
import { BLOCK_APPS } from '../data/blockApps';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/theme';

// ─── Confirmation modal ──────────────────────────────────────────────────────

function BlockingSplashModal({
  visible,
  names,
  onClose,
}: {
  visible: boolean;
  names: string[];
  onClose: () => void;
}) {
  const backdrop = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const ringPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      backdrop.setValue(0);
      badgeScale.setValue(0);
      textOpacity.setValue(0);
      ringPulse.setValue(0);
      return;
    }
    badgeScale.setValue(0);
    textOpacity.setValue(0);
    ringPulse.setValue(0);

    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(badgeScale, { toValue: 1, friction: 7, tension: 65, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(ringPulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, backdrop, badgeScale, textOpacity, ringPulse]);

  const ring1 = {
    opacity: ringPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: ringPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
  };
  const ring2 = {
    opacity: ringPulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),
    transform: [{ scale: ringPulse.interpolate({ inputRange: [0, 1], outputRange: [1.1, 2.9] }) }],
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={ms.root} onPress={onClose}>
        <Animated.View style={[ms.backdrop, { opacity: backdrop }]} pointerEvents="none" />
        <Pressable style={ms.center} onPress={(e) => e.stopPropagation()}>
          <View style={ms.burstWrap}>
            <Animated.View style={[ms.ring, ring1]} />
            <Animated.View style={[ms.ring, ms.ring2, ring2]} />
            <Animated.View style={[ms.badge, { transform: [{ scale: badgeScale }] }]}>
              <Ionicons name="flash" size={40} color={colors.background} />
            </Animated.View>
          </View>
          <Animated.View style={[ms.copy, { opacity: textOpacity }]}>
            <Text style={ms.bigLabel}>Blocked</Text>
            <Text style={ms.sub}>These apps are now in your focus block list:</Text>
            <Text style={ms.names}>{names.join('  ·  ')}</Text>
            <Pressable style={ms.doneBtn} onPress={onClose}>
              <Text style={ms.doneTxt}>Done</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const ms = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.9)' },
  center: { alignItems: 'center', paddingHorizontal: spacing.xl, maxWidth: 340 },
  burstWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.gaugeProgress,
  },
  ring2: { borderColor: colors.accentLimeMuted },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gaugeProgress,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { alignItems: 'center' },
  bigLabel: {
    color: colors.gaugeProgress,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
  names: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  doneBtn: {
    marginTop: spacing.xl,
    paddingVertical: 11,
    paddingHorizontal: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.cardElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  doneTxt: { color: colors.text, fontWeight: '600', fontSize: 15 },
});

// ─── App row ─────────────────────────────────────────────────────────────────

function AppRow({
  app,
  on,
  onToggle,
}: {
  app: (typeof BLOCK_APPS)[number];
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable style={[styles.row, on && styles.rowOn]} onPress={onToggle}>
      <Image source={app.icon} style={styles.rowIcon} resizeMode="contain" />
      <Text style={styles.rowName}>{app.name}</Text>
      <View style={[styles.check, on && styles.checkOn]}>
        {on ? <Ionicons name="checkmark" size={13} color={colors.background} /> : null}
      </View>
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export const AppBlockingScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const [splashOpen, setSplashOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedApps, setBlockedApps] = useState<(typeof BLOCK_APPS)[number][]>([]);
  const [lastBlockedNames, setLastBlockedNames] = useState<string[]>([]);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;

  const selectedApps = BLOCK_APPS.filter((a) => selected[a.id]);
  const count = selectedApps.length;

  const toggleOpen = () => {
    if (isBlocked) return; // lock list while blocked
    Animated.timing(rotateAnim, {
      toValue: open ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setOpen((v) => !v);
  };

  const toggle = (id: string) => {
    if (isBlocked) return;
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const activate = () => {
    if (!count) return;
    const names = selectedApps.map((a) => a.name);
    setLastBlockedNames(names);
    setBlockedApps(selectedApps);
    setIsBlocked(true);
    setOpen(false);
    Animated.timing(rotateAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    // slide banner in
    Animated.spring(bannerAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
    setSplashOpen(true);
  };

  const deactivate = () => {
    // slide banner out then clear state
    Animated.timing(bannerAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setIsBlocked(false);
      setBlockedApps([]);
      setSelected({});
    });
  };

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const bannerTranslate = bannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 0],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Blocked banner ── */}
      {isBlocked ? (
        <Animated.View
          style={[
            styles.banner,
            { transform: [{ translateY: bannerTranslate }], opacity: bannerAnim },
          ]}
        >
          <View style={styles.bannerLeft}>
            <View style={styles.bannerDot} />
            <View>
              <Text style={styles.bannerTitle}>Apps are blocked</Text>
              <Text style={styles.bannerSub}>
                {blockedApps.map((a) => a.name).join(', ')}
              </Text>
            </View>
          </View>
          <Ionicons name="lock-closed" size={16} color={colors.gaugeProgress} />
        </Animated.View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Focus Block</Text>
        <Text style={styles.lead}>
          {isBlocked
            ? 'Focus block is active. Tap the power button below to unblock apps.'
            : 'Select the apps you want blocked during a drive, then tap the power button.'}
        </Text>

        {/* Dropdown card */}
        <GlassCard style={[styles.dropCard, isBlocked && styles.dropCardLocked]}>
          <Pressable style={styles.dropHeader} onPress={toggleOpen}>
            <Ionicons
              name={isBlocked ? 'lock-closed-outline' : 'apps-outline'}
              size={18}
              color={isBlocked ? colors.gaugeProgress : colors.gaugeProgress}
            />
            <Text style={styles.dropLabel}>
              {isBlocked
                ? `${blockedApps.length} app${blockedApps.length > 1 ? 's' : ''} currently blocked`
                : count > 0
                ? `${count} app${count > 1 ? 's' : ''} selected`
                : 'Choose apps to block'}
            </Text>
            {!isBlocked ? (
              <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </Animated.View>
            ) : null}
          </Pressable>

          {/* Blocked app pills */}
          {isBlocked ? (
            <View style={styles.pills}>
              {blockedApps.map((a) => (
                <View key={a.id} style={styles.pillBlocked}>
                  <Image source={a.icon} style={styles.pillIcon} resizeMode="contain" />
                  <Text style={styles.pillText}>{a.name}</Text>
                  <Ionicons name="ban-outline" size={11} color={colors.danger} />
                </View>
              ))}
            </View>
          ) : null}

          {/* Selected pills (when collapsed, not blocked) */}
          {!isBlocked && !open && count > 0 ? (
            <View style={styles.pills}>
              {selectedApps.slice(0, 5).map((a) => (
                <View key={a.id} style={styles.pill}>
                  <Image source={a.icon} style={styles.pillIcon} resizeMode="contain" />
                  <Text style={styles.pillText}>{a.name}</Text>
                </View>
              ))}
              {count > 5 ? (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>+{count - 5}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Expanded list (only when not blocked) */}
          {!isBlocked && open ? (
            <View style={styles.list}>
              {BLOCK_APPS.map((app, i) => (
                <View key={app.id}>
                  {i > 0 ? <View style={styles.divider} /> : null}
                  <AppRow app={app} on={!!selected[app.id]} onToggle={() => toggle(app.id)} />
                </View>
              ))}
            </View>
          ) : null}
        </GlassCard>

        <Text style={styles.note}>Demo only — real app blocking requires OS-level permissions.</Text>
      </ScrollView>

      {/* Power dock */}
      <View style={styles.dock}>
        <Pressable
          style={[
            styles.powerBtn,
            isBlocked ? styles.powerActive : count === 0 ? styles.powerOff : null,
          ]}
          onPress={isBlocked ? deactivate : activate}
          disabled={!isBlocked && count === 0}
        >
          <Ionicons
            name="power"
            size={28}
            color={isBlocked ? colors.background : count > 0 ? colors.background : colors.textTertiary}
          />
        </Pressable>
        <Text style={styles.dockCaption}>
          {isBlocked
            ? 'Tap to unblock all apps'
            : count > 0
            ? `Block ${count} app${count > 1 ? 's' : ''}`
            : 'No apps selected'}
        </Text>
      </View>

      <BlockingSplashModal
        visible={splashOpen}
        names={lastBlockedNames}
        onClose={() => setSplashOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.md },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  backText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: spacing.sm },
  lead: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

  /* Dropdown card */
  dropCard: { padding: 0, overflow: 'hidden' },
  dropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  dropLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },

  /* Pills (collapsed selected state) */
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.cardElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pillIcon: { width: 16, height: 16, borderRadius: 4 },
  pillText: { color: colors.text, fontSize: 12, fontWeight: '500' },

  /* List */
  list: {},
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  rowOn: { backgroundColor: 'rgba(0,255,136,0.05)' },
  rowIcon: { width: 36, height: 36, borderRadius: 9 },
  rowName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '400' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.gaugeProgress,
    borderColor: colors.gaugeProgress,
  },

  /* Note */
  note: { color: colors.textTertiary, fontSize: 11, lineHeight: 16 },

  /* Blocked banner */
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gaugeProgress,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gaugeProgress,
  },
  bannerTitle: {
    color: colors.gaugeProgress,
    fontSize: 14,
    fontWeight: '600',
  },
  bannerSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    flexShrink: 1,
  },

  /* Locked card state */
  dropCardLocked: {
    borderColor: 'rgba(0,255,136,0.2)',
  },

  /* Blocked pills */
  pillBlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,69,58,0.3)',
  },

  /* Power dock */
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  powerBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gaugeProgress,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerOff: {
    backgroundColor: colors.cardElevated,
  },
  powerActive: {
    backgroundColor: colors.danger,
  },
  dockCaption: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
});
