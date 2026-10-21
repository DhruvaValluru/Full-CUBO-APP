import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenShell } from '../components/ScreenShell';
import { AppHeader } from '../components/AppHeader';
import { MotionPressable } from '../components/MotionPressable';
import { useFamily } from '../features/family/FamilyContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { useAppBlocking } from '../features/appBlocking/AppBlockingContext';

export function NotificationsScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Notifications'>) {
  const { colors: c } = useAppearance(); const s = styles(c);
  const family = useFamily(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const appBlocking = useAppBlocking();
  const unread = family.notifications.filter(item => !item.read).length + appBlocking.notices.filter(item => !item.read).length;
  const markAll = async () => {
    appBlocking.markNoticesRead(); setError('');
    if (!family.notifications.some(item => !item.read)) return;
    setBusy(true);
    try { await family.markRead(); } catch { setError('Could not mark synced notifications as read. Please try again.'); } finally { setBusy(false); }
  };
  return <ScreenShell>
    <AppHeader title="Notifications" onBack={() => navigation.goBack()} />
    <View style={s.toolbar}><Text style={s.body}>{unread ? unread + ' unread' : 'You’re all caught up'}</Text><MotionPressable disabled={!unread || busy} onPress={() => void markAll()} style={{ minHeight: 44, justifyContent: 'center', opacity: unread ? 1 : .5 }}><Text style={s.link}>{busy ? 'Updating…' : 'Mark all read'}</Text></MotionPressable></View>
    {(family.notifications.length > 0 || appBlocking.notices.length > 0) && <Text style={s.section}>Your updates</Text>}
    {family.notifications.map(notice => <MotionPressable key={notice.id} style={[s.card, !notice.read && s.unread]} onPress={() => navigation.navigate('Family')}><Text style={s.title}>{notice.title}</Text><Text style={s.body}>{notice.body}</Text><Text style={s.meta}>{new Date(notice.createdAt).toLocaleString()}</Text></MotionPressable>)}
    {appBlocking.notices.map(notice => <MotionPressable key={notice.id} style={[s.card, !notice.read && s.unread]} onPress={() => { appBlocking.markNoticesRead(notice.id); navigation.navigate('AppBlocking', { targetUid: notice.targetUid, targetName: notice.targetName, parentManaged: true }); }}>
      <View style={s.row}><View style={s.icon}><Ionicons name="shield-checkmark" size={22} color={c.accent} /></View><View style={{ flex: 1, gap: 4 }}><Text style={s.meta}>MINOR NOTIFICATION PREVIEW</Text><Text style={s.title}>{notice.title}</Text></View>{!notice.read && <View accessibilityLabel="Unread" style={s.dot} />}</View>
      <Text style={s.body}>{notice.body}</Text><View style={s.row}><Text style={[s.link, { flex: 1 }]}>Review Blocked Apps</Text><Ionicons name="chevron-forward" size={17} color={c.accent} /></View>
    </MotionPressable>)}
    {!family.notifications.length && !appBlocking.notices.length ? <View style={s.empty}><Ionicons name="notifications-outline" size={30} color={c.accent} /><Text style={s.title}>No notifications yet</Text><Text style={s.body}>Real family requests and account updates will appear here.</Text></View> : null}
    {!!error && <Text accessibilityRole="alert" style={{ color: c.danger }}>{error}</Text>}
  </ScreenShell>;
}
const styles = (c: AppColors) => StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { color: c.text, fontSize: 18, fontFamily: 'Manrope_800ExtraBold', marginTop: 8 },
  card: { backgroundColor: c.card, borderRadius: 20, padding: 18, gap: 14, borderWidth: 1, borderColor: c.border },
  unread: { borderColor: c.borderStrong },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: c.accentSoft, justifyContent: 'center', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C93636' },
  title: { color: c.text, fontSize: 15, lineHeight: 22, fontFamily: 'Manrope_700Bold' },
  body: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  meta: { color: c.textSecondary, fontSize: 11 },
  link: { color: c.accent, fontSize: 12, fontFamily: 'Manrope_700Bold' },
  empty: { minHeight: 180, borderRadius: 22, borderWidth: 1, borderStyle: 'dashed', borderColor: c.borderStrong, alignItems: 'center', justifyContent: 'center', gap: 7, padding: 24 },
});
