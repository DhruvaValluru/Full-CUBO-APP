import { normalizeQuestion, quickAnswer, type LocalAnswerDetails } from './quickAnswers';

/** App-data lookups do not rely on model inference. */
export function accountAnswer(question: string, context: string, details: LocalAnswerDetails = {}): string | null {
  const q = normalizeQuestion(question).replace(/^(?:hey |hi )?cubo\s*/, '').replace(/^please\s+/, '');
  if (/\b(emergency|collision|accident|injured|injury|car crash)\b/.test(q)) return quickAnswer(q, {});
  if (/\b(blocked apps?|block apps?|apps? (?:are )?blocked|app blocking|app limits?|child lock|facebook|telegram|social apps?)\b/.test(q)) return quickAnswer(q, {}, details);
  if (/\b(birthday|date of birth|dob)\b/.test(q)) return quickAnswer(q, {}, details);
  if (/\b(kids?|children|child|family|parent|guardian|partner|son|daughter)\b/.test(q)) {
    if (/\b(invite|add|request|sharing|permission|manage|code|connect)\b/.test(q)) return 'On Home, open Family / Friends and choose Enter Code or Create Code. Family codes are created by an adult organizer; minors enter a code and wait for approval. Friend codes can be created or entered by anyone, and safety-score or location sharing stays off until each person enables it. I have not sent or created a code or request for you.';
    if (/\b(where|location|driving|live|route)\b/.test(q)) return 'Open Family / Friends and select the person. You can see a real foreground location snapshot only when they enabled location sharing. CUBO does not perform hidden background tracking.';
    if (/\b(score|scores|rating|ratings|trips?|miles|time|minutes|who|names?|list|members|how many)\b/.test(q)) return 'Open Family / Friends to see your real linked accounts. Select a person for their opt-in safety score and current-location snapshot. New accounts start at 100, then completed measured drives update the score. Cubo Assistant does not invent or expose unshared family data.';
    return 'Family and Friend connections use separate codes and approval. Open Family / Friends to view real linked accounts and each person’s sharing controls.';
  }
  const vehicle = /^(?:what|which) (?:is|are) my (?:selected |saved |current )?(?:vehicle|car)s?$/.test(q)
    || /^(?:what|which) (?:vehicle|car)s? (?:do i have|do i own|have i saved|is selected|am i using|am i driving)(?: today| right now)?$/.test(q)
    || /^(?:tell me|show me|list) (?:about )?my (?:saved )?(?:vehicle|car)s$/.test(q)
    || /^(?:tell me|show me) (?:about )?my (?:vehicle|car)$/.test(q)
    || /\b(?:car|vehicle)\b.*\bselected\b|\bselected\b.*\b(?:car|vehicle)\b/.test(q)
    || /\b(my|our)\b.*\b(cars?|vehicles?|garage)\b/.test(q) && !/\b(worth|value|safe|change|edit|add|remove|delete|color|colour|fuel|maintenance|repair)\b/.test(q);
  let data: Record<string, unknown>;
  try { const parsed = JSON.parse(context); data = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; } catch { data = {}; }
  if (!vehicle || /\b(change|edit|remove|delete|add|color|colour|worth|safe|fuel|repair|maintenance)\b/.test(q)) {
    return quickAnswer(q, data, details) ?? (/\b(my|our|this app)\b/.test(q) ? 'That detail is not connected to Cubo Assistant. I can look up saved vehicles, focus averages, your name and saved places, or explain real Family / Friends connections and the insurance preview. Please name the detail you need; I will not invent private or live data.' : null);
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
