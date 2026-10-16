import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export function FamilyAvatar({ id, size = 72 }: { id: string; size?: number }) {
  const variant = id.endsWith('2') ? 2 : id.endsWith('1') ? 1 : 0;
  const backgrounds = ['#DCE9E4', '#E5E7F1', '#F0E3D6'];
  const shirts = ['#286651', '#59688F', '#AC7655'];
  return <View accessibilityLabel="Illustrated demo avatar" style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: backgrounds[variant] }}>
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {variant === 2 && <Path d="M20 47V31C20 6 60 6 60 31V54H20Z" fill="#47352F" />}
      <Path d="M10 80V72C10 48 70 48 70 72V80Z" fill={shirts[variant]} />
      <Path d="M33 43H47V57Q40 64 33 57Z" fill="#BD8C6A" />
      <Circle cx="40" cy="33" r="17" fill={variant === 1 ? '#BB805B' : '#D9A680'} />
      <Path d={variant === 1 ? 'M22 32C16 7 60 7 58 32L47 21L22 32Z' : 'M22 29C21 6 60 8 58 30C48 29 40 23 36 19C32 26 26 29 22 29Z'} fill="#47352F" />
      <Circle cx="34" cy="34" r="1.5" fill="#47352F" /><Circle cx="46" cy="34" r="1.5" fill="#47352F" />
      <Path d="M35 42Q40 46 45 42" stroke="#804F3D" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </Svg>
  </View>;
}
