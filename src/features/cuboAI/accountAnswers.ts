/** Narrow factual lookups; broader advice still goes to the model. No model inference. */
export function accountAnswer(question: string, context: string): string | null {
  const q = question.toLowerCase().replace(/[?!.]/g, '').replace(/\s+/g, ' ').trim();
  const vehicle = /^(?:what|which) (?:is|are) my (?:selected |saved |current )?(?:vehicle|car)s?$/.test(q)
    || /^(?:what|which) (?:vehicle|car)s? (?:do i have|do i own|have i saved|is selected|am i using)$/.test(q)
    || /^(?:tell me|show me|list) (?:about )?my (?:saved )?(?:vehicle|car)s$/.test(q)
    || /^(?:tell me|show me) (?:about )?my (?:vehicle|car)$/.test(q);
  if (!vehicle) return null;
  let data: Record<string, unknown>;
  try { data = JSON.parse(context); } catch { return 'Your saved vehicle information is unavailable right now. Check Home > Manage vehicles, then reopen CuboAI.'; }
  if (!data || typeof data !== 'object' || typeof data.selectedVehicle !== 'string' || data.selectedVehicle === 'loading/unavailable') {
    return 'Your garage is still loading or unavailable. Try again shortly, or check Home > Manage vehicles.';
  }
  if (data.selectedVehicle === 'none saved') return 'You have no vehicles saved in this account. Add one from Home > Your vehicles > +.';
  const selected = data.selectedVehicle.slice(0, 100);
  const nickname = typeof data.vehicleNickname === 'string' && data.vehicleNickname ? ` (${data.vehicleNickname.slice(0, 25)})` : '';
  const others = Array.isArray(data.otherVehicles) ? data.otherVehicles.filter((v): v is string => typeof v === 'string').slice(0, 2).map(v => v.slice(0, 100)) : [];
  const count = typeof data.vehicleCount === 'number' && Number.isFinite(data.vehicleCount) ? data.vehicleCount : 1;
  return `From your saved CUBO garage: your selected vehicle is ${selected}${nickname}.`
    + (others.length ? ` Other saved vehicles: ${others.join(', ')}.` : '')
    + (count > others.length + 1 ? ` You have ${count} vehicles in total; see Home > Manage vehicles for the full list.` : '')
    + ' This is your app selection, not live vehicle detection.';
}
