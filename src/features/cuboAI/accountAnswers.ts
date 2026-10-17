import { demoFamily } from '../family/demoFamily';

/** App-data lookups do not rely on model inference. */
export function accountAnswer(question: string, context: string): string | null {
  const q = question.toLowerCase().replace(/[’']/g, '').replace(/[?!.:,]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(?:hey |hi )?cubo\s*/, '').replace(/^please\s+/, '');
  if (/\b(kids?|children|child|family|parent|guardian|partner|son|daughter)\b/.test(q)) {
    const member = /\bchild (?:1|one)\b/.test(q) ? demoFamily[1] : /\bchild (?:2|two)\b/.test(q) ? demoFamily[2] : /\b(parent|partner|guardian)\b/.test(q) ? demoFamily[0] : null;
    if (/\b(score|scores|rating|ratings)\b/.test(q)) {
      const members = member ? [member] : demoFamily.filter(person => !person.adult);
      return `Demo family scores: ${members.map(person => `${person.name}: ${person.score}/100`).join('; ')}. These are fictional sample profiles and scores, not live data about real family members.`;
    }
    if (/\b(who|names?|list|members|how many)\b/.test(q) && !/\b(car|vehicle|location|where|drive|driving)\b/.test(q)) return `Your CUBO demo family includes ${demoFamily.map(person => person.name).join(', ')}. The two child profiles are Child 1 and Child 2. These are demo people, not verified real family members.`;
    return 'I can show demo family names or sample scores. Ask “Who are my kids?” or “What is Child 1’s score?” For real members or location sharing, open Account > Family safety. No live family data is available to this chat.';
  }
  const appTopic = /\b(calibration|insurance|cubo|focus score|safety score|trip history|report (?:a |an |this )?hazard)\b/.test(q)
    || /\b(my|selected|saved|current|app)\b/.test(q) && /\b(vehicles?|cars?|garage|scores?|trips?|account|profile|settings|hazards?)\b/.test(q);
  const vehicle = /^(?:what|which) (?:is|are) my (?:selected |saved |current )?(?:vehicle|car)s?$/.test(q)
    || /^(?:what|which) (?:vehicle|car)s? (?:do i have|do i own|have i saved|is selected|am i using)$/.test(q)
    || /^(?:tell me|show me|list) (?:about )?my (?:saved )?(?:vehicle|car)s$/.test(q)
    || /^(?:tell me|show me) (?:about )?my (?:vehicle|car)$/.test(q)
    || /\b(?:car|vehicle)\b.*\bselected\b|\bselected\b.*\b(?:car|vehicle)\b/.test(q);
  if (!vehicle && !appTopic) return null;
  let data: Record<string, unknown>;
  try { data = JSON.parse(context); } catch { return 'Your saved vehicle information is unavailable right now. Check Home > Manage vehicles, then reopen CuboAI.'; }
  if (!vehicle) {
    if (/\b(score|scores)\b/.test(q) && /\bmy\b/.test(q)) {
      const score = data?.averageFocusOutOf100;
      return typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100
        ? `Your saved measured-trip focus average is ${score}/100. This is an experimental attention estimate, not a validated safety rating or a live drive score.`
        : 'You have no measured focus-score average available here yet. Check Activity for your completed trips; an unavailable score is not zero.';
    }
    return 'I can look up your selected vehicle, saved focus-score average, or demo family names and scores. Try asking for one of those. This app question was not sent to the model; other app details are not connected yet.';
  }
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
