import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { MotionPressable } from './MotionPressable';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

// Destinations stay unconfigured until the team supplies the official links.
export const cuboSocialLinks: { name: string; icon: keyof typeof Ionicons.glyphMap; url: string | null }[] = [
  { name: 'Instagram', icon: 'logo-instagram', url: null },
  { name: 'TikTok', icon: 'logo-tiktok', url: null },
  { name: 'LinkedIn', icon: 'logo-linkedin', url: null },
];
export function AboutCubo() {
  const { colors: c } = useAppearance();
  const s = makeThemeStyles(c);

  const [message, setMessage] = useState('');
  return <View style={s.root}><View style={s.bio}><Text style={s.heading}>The people behind CUBO</Text><Text style={s.body}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text><Text style={s.placeholder}>Founder bio placeholder · Replace before launch</Text></View><MotionPressable style={s.website} onPress={() => void Linking.openURL('https://cubocruise.com').catch(() => setMessage('Could not open the website. Please try again.'))}><Ionicons name="globe-outline" size={22} color={c.accent} /><View style={{ flex: 1 }}><Text style={s.heading}>cubocruise.com</Text><Text style={s.body}>Learn more about CUBO</Text></View><Ionicons name="arrow-up-right-box-outline" size={20} color={c.accent} /></MotionPressable><Text style={s.heading}>Follow our journey</Text>{cuboSocialLinks.map(item => <MotionPressable key={item.name} style={s.social} onPress={() => item.url ? void Linking.openURL(item.url) : setMessage(item.name + ' link is coming soon.')}><Ionicons name={item.icon} size={23} color={c.text} /><Text style={[s.heading, { flex: 1, fontSize: 14 }]}>{item.name}</Text><Text style={s.placeholder}>{item.url ? 'Follow' : 'Coming soon'}</Text></MotionPressable>)}{message ? <Text accessibilityRole="alert" style={s.body}>{message}</Text> : null}</View>;
}
const makeThemeStyles = (c: AppColors) => StyleSheet.create({ root: { gap: 16, marginTop: 16 }, bio: { gap: 12, paddingVertical: 16 }, heading: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 18 }, body: { color: c.textSecondary, fontSize: 14, lineHeight: 22 }, placeholder: { color: c.textSecondary, fontSize: 11 }, website: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: c.accentSoft, borderRadius: 20, padding: 20, marginBottom: 16 }, social: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.card, padding: 16, minHeight: 60, borderRadius: 16 } });
