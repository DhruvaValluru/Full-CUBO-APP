import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenShell } from '../components/ScreenShell';
import { useDrives } from '../features/drives/DriveContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';

export function VoiceTranscriptScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'VoiceTranscript'>) {
  const { colors: c } = useAppearance(); const { sessions, clearVoiceTranscript, persistenceError } = useDrives();
  const session = sessions.find(trip => trip.id === route.params.sessionId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return <ScreenShell scrollable={false}>
    <AppHeader title="Voice transcript" eyebrow="This drive · on this device" onBack={() => navigation.goBack()} />
    <Text style={{ color: c.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>Accepted questions and generated replies—not audio or proof a reply played aloud. Speech recognition can make mistakes. Stored under your account on this device; not synced to Firebase or shared with family.</Text>
    {session?.voiceTranscriptLimited ? <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 12, marginBottom: 12 }}>Transcript storage limit reached during this drive. Later turns were not saved; voice commands remained available.</Text> : null}
    {persistenceError ? <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 12 }}>{persistenceError}</Text> : null}
    <FlatList data={session?.voiceTranscript ?? []} keyExtractor={(_, i) => String(i)} contentContainerStyle={{ gap: 12, paddingBottom: 32 }} initialNumToRender={12}
      ListEmptyComponent={<Text style={{ color: c.textSecondary, paddingVertical: 24 }}>{session ? 'No voice conversation saved for this trip.' : 'This trip is no longer available.'}</Text>}
      renderItem={({ item }) => <View style={{ borderRadius: 16, padding: 16, backgroundColor: item.role === 'user' ? c.accentSoft : c.card, gap: 8 }}>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>{item.role === 'user' ? 'You · recognized speech' : 'CUBO · reply'} · {Math.floor(item.elapsedSeconds / 60)}:{String(Math.floor(item.elapsedSeconds % 60)).padStart(2, '0')}</Text>
        <Text selectable style={{ color: c.text, fontSize: 15, lineHeight: 23 }}>{item.text}</Text>
      </View>} />
    {!!session?.voiceTranscript?.length && <View style={{ paddingVertical: 12, gap: 8 }}>
      <Pressable accessibilityRole="button" onPress={() => { if (confirmDelete) { clearVoiceTranscript(session.id); setConfirmDelete(false); } else setConfirmDelete(true); }} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: c.surfaceMuted, borderRadius: 12 }}><Text style={{ color: c.danger }}>{confirmDelete ? 'Confirm delete transcript' : 'Delete transcript'}</Text></Pressable>
      {confirmDelete ? <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(false)} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.textSecondary }}>Keep transcript</Text></Pressable> : null}
    </View>}
  </ScreenShell>;
}
