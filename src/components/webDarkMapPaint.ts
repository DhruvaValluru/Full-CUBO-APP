/**
 * CUBO's night map: paint-only overrides for OpenFreeMap Dark.
 * Keep provider geometry, label placement, zoom rules, sprites and attribution.
 * Shared with the native WebView via JSON; no additional map fetch or library.
 */
export const webDarkMapPaint: Record<string, Record<string, string | number>> = {
  background: { 'background-color': '#242F34' },
  water: { 'fill-color': '#254B59' },
  waterway: { 'line-color': '#365F6C' },
  landcover_ice_shelf: { 'fill-color': '#4A5D63' },
  landcover_glacier: { 'fill-color': '#4A5D63' },
  landuse_residential: { 'fill-color': '#303C40' },
  landcover_wood: { 'fill-color': '#365541' },
  landuse_park: { 'fill-color': '#304C3D' },
  building: { 'fill-color': '#3B484E', 'fill-outline-color': '#55666C' },
  'aeroway-taxiway': { 'line-color': '#65777D' },
  'aeroway-runway-casing': { 'line-color': '#303C40' },
  'aeroway-area': { 'fill-color': '#3B484E' },
  'aeroway-runway': { 'line-color': '#78878C' },
  road_area_pier: { 'fill-color': '#52636A' },
  road_pier: { 'line-color': '#718289' },
  highway_path: { 'line-color': '#718289' },
  highway_minor: { 'line-color': '#718289' },
  highway_major_casing: { 'line-color': '#303C40' },
  highway_major_inner: { 'line-color': '#819097' },
  highway_major_subtle: { 'line-color': '#65777D' },
  highway_motorway_casing: { 'line-color': '#303C40' },
  highway_motorway_inner: { 'line-color': '#94A0A0' },
  highway_motorway_subtle: { 'line-color': '#718289' },
  railway_transit: { 'line-color': '#65777D' },
  railway_transit_dashline: { 'line-color': '#303C40' },
  railway_minor: { 'line-color': '#65777D' },
  railway_minor_dashline: { 'line-color': '#303C40' },
  railway: { 'line-color': '#65777D' },
  railway_dashline: { 'line-color': '#303C40' },
  boundary_state: { 'line-color': '#697D80' },
  'boundary_country_z0-4': { 'line-color': '#829496' },
  'boundary_country_z5-': { 'line-color': '#829496' },
};

// Explicit IDs prevent repainting app routes, event symbols or user markers.
for (const id of ['water_name', 'highway_name_other', 'highway_name_motorway',
  'place_other', 'place_suburb', 'place_village', 'place_town', 'place_city',
  'place_city_large', 'place_state', 'place_country_other', 'place_country_minor',
  'place_country_major']) {
  webDarkMapPaint[id] = {
    'text-color': id === 'water_name' ? '#C1DDE4' : '#E6EEEB',
    'text-halo-color': '#242F34',
    'text-halo-width': 1.5,
  };
}

type PaintMap = {
  getLayer: (id: string) => unknown;
  setPaintProperty: (id: string, name: string, value: string | number) => unknown;
};

export function applyWebDarkMapPaint(map: PaintMap, mode: 'light' | 'dark') {
  if (mode !== 'dark') return;
  for (const [id, paint] of Object.entries(webDarkMapPaint)) {
    // Provider updates can remove a layer; skip it without blocking the map.
    if (!map.getLayer(id)) continue;
    for (const [name, value] of Object.entries(paint)) map.setPaintProperty(id, name, value);
  }
}
