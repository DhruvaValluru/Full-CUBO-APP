type Fix = { latitude: number; longitude: number; accuracy: number | null; timestamp: number };
const normalize = (angle: number) => (angle % 360 + 360) % 360;
export function bearingBetween(a: Fix, b: Fix) {
  const rad = Math.PI / 180, p = a.latitude * rad, q = b.latitude * rad, d = (b.longitude - a.longitude) * rad;
  return normalize(Math.atan2(Math.sin(d) * Math.cos(q), Math.cos(p) * Math.sin(q) - Math.sin(p) * Math.cos(q) * Math.cos(d)) / rad);
}
/** Accumulate movement across fixes; adjacent fixes alone often fall inside GPS noise. */
export function createCourseTracker() {
  let anchor: Fix | null = null;
  let course: number | null = null;
  return (fix: Fix, reported: number | null, speed: number | null) => {
    if (anchor && fix.timestamp <= anchor.timestamp) return course;
    const validHeading = reported != null && Number.isFinite(reported) && reported >= 0 && reported < 360;
    if (validHeading && speed != null && speed >= .9 && (fix.accuracy ?? 100) <= 40) {
      course = normalize(reported); anchor = fix; return course;
    }
    if (!anchor || fix.timestamp - anchor.timestamp > 30000) { anchor = fix; return course; }
    const seconds = (fix.timestamp - anchor.timestamp) / 1000;
    const radians = Math.PI / 180;
    const x = (fix.longitude - anchor.longitude) * radians * Math.cos(fix.latitude * radians);
    const y = (fix.latitude - anchor.latitude) * radians;
    const distance = Math.hypot(x, y) * 6371000;
    const threshold = Math.max(6, fix.accuracy ?? 20, anchor.accuracy ?? 20);
    if ((fix.accuracy ?? 100) <= 40 && (anchor.accuracy ?? 100) <= 40 && distance >= threshold && seconds > 0 && distance / seconds < 75) {
      course = bearingBetween(anchor, fix); anchor = fix;
    }
    return course;
  };
}
/** Keep north-crossing rotations short (359 -> 1 is two degrees, not 358). */
export function nearestBearing(current: number, target: number) {
  return current + ((target - current + 540) % 360 + 360) % 360 - 180;
}
