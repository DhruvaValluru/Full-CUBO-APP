import { parseDrivingRoute, type Coordinate, type NavigationRoute } from './routeResponse';
export type VoiceRouteResult = { text: string; options?: string[] };
type State = { tripId?: string; point?: Coordinate & { timestamp: number }; destination: Coordinate | null; gpsValid: boolean };
const distance = (a: Coordinate, b: Coordinate) => Math.hypot((a.latitude - b.latitude) * 111320, (a.longitude - b.longitude) * 111320 * Math.cos(a.latitude * Math.PI / 180));
/** Only explicit voice requests fetch alternatives. Current navigation is untouched until confirmation. */
export class VoiceRoutes {
  private offered: { state: State; at: number; routes: NavigationRoute[] } | null = null;
  private lastFetch = 0;
  constructor(private state: () => State, private apply: (route: NavigationRoute) => void, private request: typeof fetch = fetch, private now: () => number = Date.now) {}
  async run(choice: number | undefined, signal: AbortSignal): Promise<VoiceRouteResult> {
    const state = this.state();
    const fresh = (s: State) => !!s.tripId && s.gpsValid && !!s.point && this.now() - s.point.timestamp < 15000 && this.now() >= s.point.timestamp - 1000;
    if (!fresh(state) || !state.destination) return { text: 'Rerouting needs a selected destination and fresh GPS. Keeping your current route.' };
    if (choice != null) {
      const offer = this.offered; this.offered = null;
      if (signal.aborted || !offer || offer.state.tripId !== state.tripId || JSON.stringify(offer.state.destination) !== JSON.stringify(state.destination) || this.now() - offer.at > 120000 || distance(state.point!, offer.state.point!) > 150 || !offer.routes[choice]) return { text: 'Those choices are stale. Ask to reroute again from your current location.' };
      this.apply(offer.routes[choice]);
      return { text: `Route updated to option ${choice + 1}. Follow the new map guidance and road signs.` };
    }
    this.offered = null;
    if (this.lastFetch && this.now() - this.lastFetch < 15000) return { text: 'Please wait a few seconds before checking routes again.' };
    this.lastFetch = this.now();
    const controller = new AbortController();
    const abort = () => controller.abort(); signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 10000);
    try {
      if (signal.aborted) return { text: 'Route request cancelled.' };
      const a = state.point!, b = state.destination;
      const response = await this.request(`https://router.project-osrm.org/route/v1/driving/${a.longitude},${a.latitude};${b.longitude},${b.latitude}?overview=full&geometries=geojson&steps=true&alternatives=true`, { signal: controller.signal });
      if (!response.ok) throw Error('unavailable');
      const payload = await response.json();
      const current = this.state();
      if (controller.signal.aborted || !fresh(current) || state.tripId !== current.tripId || JSON.stringify(state.destination) !== JSON.stringify(current.destination) || distance(state.point!, current.point!) > 150) return { text: 'Location changed while checking routes. Ask to reroute again.' };
      const routes: NavigationRoute[] = [];
      for (const candidate of (Array.isArray(payload.routes) ? payload.routes.slice(0, 3) : [])) {
        try {
          const route = parseDrivingRoute({ code: payload.code, routes: [candidate] });
          if (!routes.some(existing => JSON.stringify(existing.coordinates) === JSON.stringify(route.coordinates))) routes.push(route);
        } catch { /* Skip unusable alternatives, never replace navigation with them. */ }
        if (routes.length === 2) break;
      }
      if (!routes.length) throw Error('No usable route');
      this.offered = { state, at: this.now(), routes };
      const options = routes.map(route => {
        const names = [...new Set(route.steps.filter(step => step.name).sort((a, b) => b.distanceMeters - a.distanceMeters).map(step => step.name))].slice(0, 2);
        return `${names.length ? `via ${names.join(' and ').slice(0, 70)}, ` : ''}about ${Math.max(1, Math.round(route.durationSeconds / 60))} minutes`;
      });
      return { text: '', options };
    } catch { return { text: 'Routing is unavailable right now. Keeping your current route.' }; }
    finally { clearTimeout(timer); signal.removeEventListener('abort', abort); }
  }
}
