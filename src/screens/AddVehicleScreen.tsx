import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ScreenShell } from '../components/ScreenShell';
import { SurfaceCard } from '../components/SurfaceCard';
import { useVehicles } from '../features/vehicles/VehicleContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddVehicle'>;
export function AddVehicleScreen({ navigation, route }: Props) {
  const { vehicles, addVehicle, updateVehicle } = useVehicles();
  const existing = vehicles.find((vehicle) => vehicle.id === route.params?.vehicleId);
  const { colors } = useAppearance(); const styles = useMemo(() => makeStyles(colors), [colors]);
  const [make, setMake] = useState(existing?.make ?? ''); const [model, setModel] = useState(existing?.model ?? ''); const [year, setYear] = useState(existing?.year ?? ''); const [plate, setPlate] = useState(existing?.plate ?? ''); const [nickname, setNickname] = useState(existing?.nickname ?? '');
  const valid = Boolean(make.trim() && model.trim());
  const save = () => { if (!valid) return; const input = { make: make.trim(), model: model.trim(), year: year.trim(), plate: plate.trim(), nickname: nickname.trim() || `${make.trim()} ${model.trim()}` }; if (existing) updateVehicle(existing.id, input); else addVehicle(input); navigation.goBack(); };
  return <ScreenShell><AppHeader title={existing ? 'Edit vehicle' : 'Add vehicle'} eyebrow="Garage" onBack={() => navigation.goBack()} /><Text style={styles.subtitle}>{existing ? 'Keep the vehicle details used across drives and reports accurate.' : 'Add the vehicle CUBO should use for upcoming drive sessions.'}</Text><SurfaceCard style={styles.form}>
    <Field label="Make" value={make} setValue={setMake} placeholder="Toyota" styles={styles} colors={colors} icon="business-outline" /><Field label="Model" value={model} setValue={setModel} placeholder="Prius" styles={styles} colors={colors} icon="car-sport-outline" /><View style={styles.split}><View style={styles.half}><Field label="Year" value={year} setValue={setYear} placeholder="2024" styles={styles} colors={colors} icon="calendar-outline" /></View><View style={styles.half}><Field label="Plate" value={plate} setValue={setPlate} placeholder="CUB-002" styles={styles} colors={colors} icon="albums-outline" /></View></View><Field label="Nickname" value={nickname} setValue={setNickname} placeholder="Daily driver" styles={styles} colors={colors} icon="pricetag-outline" />
  </SurfaceCard><Pressable style={[styles.save, !valid && styles.disabled]} onPress={save}><Text style={styles.saveText}>{existing ? 'Save changes' : 'Add to garage'}</Text><Ionicons name="arrow-forward" size={18} color={colors.onAccent} /></Pressable></ScreenShell>;
}
function Field({ label, value, setValue, placeholder, styles, colors, icon }: { label: string; value: string; setValue: (v: string) => void; placeholder: string; styles: ReturnType<typeof makeStyles>; colors: AppColors; icon: keyof typeof Ionicons.glyphMap }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={styles.inputShell}><Ionicons name={icon} size={17} color={colors.textTertiary} /><TextInput style={styles.input} value={value} onChangeText={setValue} placeholder={placeholder} placeholderTextColor={colors.textTertiary} /></View></View>; }
const makeStyles = (c: AppColors) => StyleSheet.create({ subtitle: { color: c.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: spacing.sm }, form: { gap: 13 }, field: { gap: 6 }, label: { color: c.textSecondary, fontSize: 10, fontFamily: 'Manrope_700Bold', textTransform: 'uppercase', letterSpacing: .8 }, inputShell: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48, paddingHorizontal: 12, backgroundColor: c.background, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }, input: { color: c.text, flex: 1, fontFamily: 'Manrope_500Medium', fontSize: 14 }, split: { flexDirection: 'row', gap: 10 }, half: { flex: 1 }, save: { minHeight: 54, borderRadius: 17, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: spacing.sm }, disabled: { opacity: .35 }, saveText: { color: c.onAccent, fontFamily: 'Manrope_800ExtraBold', fontSize: 14 } });
