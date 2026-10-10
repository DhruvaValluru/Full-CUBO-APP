export function snapPipCorner(x: number, y: number, right: number, top: number, bottom: number) {
  return { x: x < (16 + right) / 2 ? 16 : right, y: y < (top + bottom) / 2 ? top : bottom };
}

export function isAhead(origin: { latitude: number; longitude: number; heading?: number | null }, target: { latitude: number; longitude: number }) {
  if (origin.heading == null) return true;
  const north = target.latitude - origin.latitude;
  const east = (target.longitude - origin.longitude) * Math.cos(origin.latitude * Math.PI / 180);
  const radians = origin.heading * Math.PI / 180;
  return north * Math.cos(radians) + east * Math.sin(radians) > 0;
}
