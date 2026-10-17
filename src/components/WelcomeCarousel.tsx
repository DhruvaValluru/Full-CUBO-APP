import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <ScrollView ref={scroll} horizontal pagingEnabled directionalLockEnabled bounces={false} showsHorizontalScrollIndicator={false}
      style={{ height }} scrollEventThrottle={32}
      onScroll={event => {
        if (!width) return;
        const index = Math.max(0, Math.min(photos.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
        if (current.current !== index) { current.current = index; setPage(index); }
      }}>
      {width > 0 ? photos.map((photo, index) => <Image key={photo.label} source={photo.source} resizeMode="cover"
        accessible={page === index} accessibilityLabel={`Photo ${index + 1} of ${photos.length}: ${photo.label}`}
        style={{ width, height, backgroundColor: colors.card }} />) : null}
    </ScrollView>
    <View style={styles.dots}>
      {photos.map((photo, index) => <Pressable key={photo.label} accessibilityRole="button"
        accessibilityLabel={`Show photo ${index + 1} of ${photos.length}: ${photo.label}`} accessibilityState={{ selected: page === index }}
        onPress={() => select(index)} style={styles.dotTarget}>
        <View style={[styles.dot, { width: page === index ? 22 : 6, backgroundColor: page === index ? colors.accent : colors.textSecondary, opacity: page === index ? 1 : .45 }]} />
      </Pressable>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dotTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 6, borderRadius: 3 },
});
