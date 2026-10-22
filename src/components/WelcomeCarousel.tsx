import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAppearance } from '../theme/AppearanceContext';

const photos = [
  { source: require('../../assets/welcome-road.jpg'), label: 'A winding road beside trees and a river' },
  { source: require('../../assets/welcome-coast.jpg'), label: 'A coastal road through evergreen forest' },
  { source: require('../../assets/welcome-desert.jpg'), label: 'An open road toward distant desert mountains' },
  { source: require('../../assets/welcome-shore.jpg'), label: 'A road following a turquoise shoreline' },
  { source: require('../../assets/welcome-highway.jpg'), label: 'A desert highway stretching toward the horizon' },
  { source: require('../../assets/welcome-bend.jpg'), label: 'A coastal bend between forest and sea' },
];

export function WelcomeCarousel({ height }: { height: number }) {
  const { colors } = useAppearance();
  const reduced = useReducedMotion();
  const scroll = useRef<ScrollView>(null);
  const current = useRef(0);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  // Keep the same photograph aligned after rotation or browser/frame resizing.
  useEffect(() => { scroll.current?.scrollTo({ x: current.current * width, animated: false }); }, [width]);
  const select = (index: number) => {
    current.current = index;
    setPage(index);
    scroll.current?.scrollTo({ x: index * width, animated: !reduced });
  };
  return <View style={styles.shell} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <View style={[styles.media, { height, backgroundColor: colors.card }]}>
      <ScrollView ref={scroll} horizontal pagingEnabled directionalLockEnabled bounces={false} showsHorizontalScrollIndicator={false}
        style={StyleSheet.absoluteFill} scrollEventThrottle={32}
        onScroll={event => {
          if (!width) return;
          const index = Math.max(0, Math.min(photos.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
          if (current.current !== index) { current.current = index; setPage(index); }
        }}>
        {width > 0 ? photos.map((photo, index) => <Image key={photo.label} source={photo.source} resizeMode="cover"
          accessible={page === index} accessibilityLabel={`Photo ${index + 1} of ${photos.length}: ${photo.label}`}
          style={{ width, height, backgroundColor: colors.card }} />) : null}
      </ScrollView>
      <LinearGradient pointerEvents="none" colors={['rgba(5,13,10,.46)', 'rgba(5,13,10,0)', 'rgba(5,13,10,.72)']} locations={[0, .45, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.pagination}>
        <View style={styles.dots}>
          {photos.map((photo, index) => <Pressable key={photo.label} accessibilityRole="button"
            accessibilityLabel={`Show photo ${index + 1} of ${photos.length}: ${photo.label}`} accessibilityState={{ selected: page === index }}
            onPress={() => select(index)} style={styles.dotTarget}>
            <View style={[styles.dot, page === index && styles.dotActive]} />
          </Pressable>)}
        </View>
        <Text style={styles.counterText}>{page + 1}/{photos.length}</Text>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  shell: { width: '100%' },
  media: { overflow: 'hidden' },
  pagination: { position: 'absolute', left: 20, right: 20, bottom: 16, minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', alignItems: 'center' },
  dotTarget: { width: 28, height: 32, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 3, borderRadius: 2, backgroundColor: '#FFFFFF', opacity: .42 },
  dotActive: { width: 24, opacity: 1 },
  counterText: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 10, letterSpacing: .5, fontVariant: ['tabular-nums'], textShadowColor: 'rgba(0,0,0,.35)', textShadowRadius: 5 },
});
