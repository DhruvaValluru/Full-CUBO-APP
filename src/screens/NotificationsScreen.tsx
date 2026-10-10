import { Text, View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenShell } from '../components/ScreenShell';
import { AppHeader } from '../components/AppHeader';
import { MotionPressable } from '../components/MotionPressable';
import { useFamily } from '../features/family/FamilyContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function NotificationsScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Notifications'>) {
  const { colors: c } = useAppearance();
  const s = makeThemeStyles(c);

  const family = useFamily();
  return <ScreenShell><AppHeader title="Notifications" onBack={() => navigation.goBack()} />
    {family.notifications.length ? <MotionPressable onPress={() => void family.markRead().catch(() => {})}><Text style={s.link}>Mark all read</Text></MotionPressable> : <View style={s.card}><Text style={s.title}>You’re all caught up</Text><Text style={s.body}>Family invitations, membership changes, and safety updates will appear here. Insurance updates will be added later.</Text></View>}
    {family.notifications.map(notice => <MotionPressable key={notice.id} style={s.card} onPress={() => navigation.navigate('Family')}><Text style={s.title}>{notice.read ? '' : '• '}{notice.title}</Text><Text style={s.body}>{notice.body}</Text><Text style={s.date}>{new Date(notice.createdAt).toLocaleString()}</Text></MotionPressable>)}
    {!family.configured ? <Text style={s.body}>Family syncing is not connected yet. No cross-phone notifications or invitation emails are being sent.</Text> : null}
    {family.error ? <Text style={s.error}>{family.error}</Text> : null}
  </ScreenShell>;
}
const makeThemeStyles = (c: AppColors) => StyleSheet.create({ card: { backgroundColor: c.card, borderRadius: 20, padding: 20, gap: 8 }, title: { color: c.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }, body: { color: c.textSecondary, fontSize: 13, lineHeight: 20 }, date: { color: c.textSecondary, fontSize: 11 }, link: { color: c.accent, fontSize: 14, paddingVertical: 12 }, error: { color: c.danger, fontSize: 13 } });
