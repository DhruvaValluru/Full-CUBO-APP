import { demoFamily } from '../family/demoFamily';
import { normalizeQuestion, quickAnswer, type LocalAnswerDetails } from './quickAnswers';

/** App-data lookups do not rely on model inference. */
export function accountAnswer(question: string, context: string, details: LocalAnswerDetails = {}): string | null {
  const q = normalizeQuestion(question).replace(/^(?:hey |hi )?cubo\s*/, '').replace(/^please\s+/, '');
  if (/\b(emergency|collision|accident|injured|injury|car crash)\b/.test(q)) return quickAnswer(q, {});
  if (/\b(kids?|children|child|family|parent|guardian|partner|son|daughter)\b/.test(q)) {
    const member = /\bchild (?:1|one)\b/.test(q) ? demoFamily[1] : /\bchild (?:2|two)\b/.test(q) ? demoFamily[2] : /\b(parent|partner|guardian)\b/.test(q) ? demoFamily[0] : null;
    if (/\b(invite|add|request|sharing|permission|manage)\b/.test(q)) return 'Use the + under Your family to invite by email or phone, or Manage for family profiles and sharing requests. Only the organizer manages membership and roles. I have not sent an invitation or a sharing request. Displayed sample profiles and locations are demos.';
    if (/\b(where|location|driving|live|route)\b/.test(q)) return 'No live family data is available to this chat. The family map and moving trip are labeled demos, not real tracking. Open the member’s profile to review sharing controls.';
    if (/\b(trips?|miles|time|minutes)\b/.test(q)) return member ? `${member.name} demo history: ${member.trips} trips, ${member.miles} miles and ${member.minutes} minutes. These are fictional sample values, not real activity.` : 'Which demo profile: Parent, Child 1, or Child 2? Name the person to see their sample trip totals.';
    if (/\b(score|scores|rating|ratings)\b/.test(q)) {
      const members = member ? [member] : demoFamily.filter(person => !person.adult);
      return `Demo family scores: ${members.map(person => `${person.name}: ${person.score}/100`).join('; ')}. These are fictional sample profiles and scores, not live data about real family members.`;
    }
    if (/\b(who|names?|list|members|how many)\b/.test(q) && !/\b(car|vehicle|location|where|drive|driving)\b/.test(q)) return `Your CUBO demo family includes ${demoFamily.map(person => person.name).join(', ')}. The two child profiles are Child 1 and Child 2. These are demo people, not verified real family members.`;
    return 'I can show demo family names or sample scores. Ask “Who are my kids?” or “What is Child 1’s score?” For real members or location sharing, open Account > Family safety. No live family data is available to this chat.';
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
    return quickAnswer(q, data, details) ?? (/\b(my|our|this app)\b/.test(q) ? 'That detail is not connected to Cubo Assistant. I can look up saved vehicles, focus averages, your name and saved places, or explain the demo family and insurance features. Please name the detail you need; I will not invent private or live data.' : null);
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
