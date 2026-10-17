import { useEffect, useRef, useState } from 'react';
import { searchPlaces, type Coordinate, type PlaceResult } from './searchPlaces';

/** GPS jitter must not clear suggestions or restart an in-flight typed search. */
export function usePlaceSuggestions(query: string, origin: Coordinate | null | undefined, enabled = true) {
  const latestOrigin = useRef(origin); latestOrigin.current = origin;
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const clean = query.trim();
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    if (!enabled || clean.length < 2) { setResults([]); setBusy(false); return; }
    setBusy(true);
    // Keep current rows tappable while the next query loads, rather than flashing blank.
    const timer = setTimeout(async () => {
      try {
        const next = await searchPlaces(clean, latestOrigin.current, controller.signal);
        if (!controller.signal.aborted) { setResults(next); if (!next.length) setError('No matching place. Add the city or ZIP code, or check the spelling.'); }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Search unavailable. Try again.');
      } finally { if (!controller.signal.aborted) setBusy(false); }
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [clean, enabled]);
  return { results, setResults, busy, error };
}
