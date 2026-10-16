import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { insurerLogoAssets } from './insurerLogoAssets';

const logos = {
  'state-farm': { name: 'State Farm', xml: insurerLogoAssets.stateFarm.svg.replace(/<defs>[\s\S]*?<\/defs>/, '').replace(/class="cls-1"/g, 'fill="#ec0c21"') },
  progressive: { name: 'Progressive', xml: insurerLogoAssets.progressive.svg },
  allstate: { name: 'Allstate', xml: insurerLogoAssets.allstate.svg.replace(/<filter[\s\S]*?<\/filter>/, '').replace('filter="url(#a)"', '') },
  geico: { name: 'GEICO', xml: insurerLogoAssets.geico.svg.replace(/style="[^"]*"/, '').replace('viewBox="0 0 24 24"', 'viewBox="0 8 24 7"').replace('fill="currentColor"', 'fill="#00539b"') },
};

/** Official website artwork bundled offline; preserve original brand colors and proportions. */
export function InsurerLogo({ id }: { id: string | null }) {
  const logo = id && id in logos ? logos[id as keyof typeof logos] : null;
  return <View accessible accessibilityLabel={logo?.name ?? 'Insurance'} style={{ width: 88, height: 48, paddingHorizontal: 8, backgroundColor: '#FFFFFF', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
    {logo ? <SvgXml xml={logo.xml} width={72} height={32} preserveAspectRatio="xMidYMid meet" /> : <Ionicons name="shield-checkmark-outline" size={24} color="#1955A5" />}
  </View>;
}
