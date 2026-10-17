/** Curated app help: no model, network requests, actions, or fabricated live data. */
export type LocalAnswerDetails = { ready?: boolean; home?: string; work?: string; insurer?: string; mode?: string; cadence?: string };
export const QUICK_HELP = 'Quick answers are available without loading AI. Ask about your score, insurance, family, vehicles, saved addresses, profile, trips, camera, or map. I could not confidently match that question. Try naming one topic; general AI is optional and may be unstable on this device.';
const clean = (value: unknown) => typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, ' ').slice(0, 240) : '';
export function normalizeQuestion(value: string) {
  return value.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim().replace(/\bwhos\b/g, 'who is')
    .replace(/\b(kiddos|kids|childrens)\b/g, 'children').replace(/\b(kid|kiddo)\b/g, 'child').replace(/\bchild([12])\b/g, 'child $1')
    .replace(/\bvehi(?:cel|cle)s?\b/g, 'vehicle').replace(/\binsur(?:ence|ance)\b/g, 'insurance');
}
export function quickAnswer(question: string, data: Record<string, unknown>, details: LocalAnswerDetails = {}): string | null {
  const q = normalizeQuestion(question);
  const has = (pattern: RegExp) => pattern.test(q);
  if (has(/\b(this drive|current drive|right now|live score)\b/)) return 'This chat does not receive live drive measurements or navigation instructions. Check the drive screen for current speed, monitoring status and the next turn. A saved focus average is not your current-drive score. Use chat only after ending the drive.';
  if (has(/\b(emergency|collision|accident|injured|injury|car crash)\b/)) return 'CUBO cannot detect or handle an emergency for you. If there is immediate danger, contact local emergency services when it is safe to do so. Chat cannot call, report an incident, or dispatch help.';
  if (!has(/\bemail\b/) && has(/\b(address|where do i live|where is my home|where do i work|home location|work location)\b/)) {
    if (has(/\b(change|edit|set|save|add|update|delete|remove)\b/)) return 'Manage your saved Home or Work address in Account > Saved places. You can also use the Home or Work shortcut on Home. I have not changed any address.';
    if (!details.ready) return 'Your saved addresses are loading or unavailable. Check Account > Saved places; I will not guess your address.';
    if (has(/\bhome\b/) && has(/\bwork\b/)) return `Saved Home: ${clean(details.home) || 'not set'}. Saved Work: ${clean(details.work) || 'not set'}. These are saved places, not live locations.`;
    if (has(/\bwork\b/)) return details.work ? `Your saved Work place is ${clean(details.work)}. This is a saved address, not your live location.` : 'No Work address is available in your saved places. Set it in Account > Saved places.';
    return details.home ? `Your saved Home place is ${clean(details.home)}. This is a saved address, not your live location.` : 'No Home address is available in your saved places. Set it in Account > Saved places.';
  }
  if (has(/\b(insurance|insurer|premium|premiums|policy|discount|discounts|savings)\b/)) {
    if (has(/\b(submit|send|report|reports|automatic|manual|monthly|weekly)\b/)) return `Open Insurance to review the demo report, choose manual or automatic and a reporting cadence, then confirm with your full name. ${details.ready ? `Your saved preferences: ${clean(details.mode) || 'manual'}, ${clean(details.cadence) || 'monthly'}. ` : ''}Monthly is the app’s recommended demo cadence. Reports and automatic reporting are simulations; nothing is sent to an insurer by this chat.`;
    if (has(/\b(who|which|provider|company|have|selected)\b/)) return details.ready ? `Your selected demo insurer is ${clean(details.insurer) || 'not set'}. Change it in Insurance; choose Other to enter a company name. This is not verification of a real policy.` : 'Your insurer setting is unavailable here. Open Insurance to check it; CUBO does not verify real policies.';
    return 'Insurance shows simulated safer-driving savings and demo reports. Any dollar amount is an illustration, not a quote, earned discount, or promise. Open Insurance for the current preview. Your real premium and eligibility must be confirmed with your insurer.';
  }
  if (has(/\b(name|who am i|profile|email|phone number|birthday|date of birth|password|account)\b/)) {
    if (has(/\b(change|edit|reset|update|delete|remove|log out|logout|sign out)\b/)) return 'Use Account to edit your profile, manage email/password, or log out. Email changes may require verification. I have not changed, deleted, or signed out of anything.';
    if (has(/\b(name|who am i)\b/)) return data.name && data.name !== 'unavailable' ? `Your current account name is ${clean(data.name)}. You can edit your profile from Account.` : 'Your account name is unavailable here. Check Account > Edit profile; I will not guess it.';
    return 'Open Account to see your profile and contact details. Chat does not expose passwords or authentication credentials, and does not have your date of birth or phone number.';
  }
  if (has(/\b(calibrat\w*|camera|mount|face scan)\b/)) {
    if (has(/\b(done|finished|completed|status|am i|have i|last|when)\b/)) return `Camera calibration status: ${clean(data.calibration) || 'unavailable'}. The Home calibration card shows the saved update time. Recalibrate after moving the phone or mount; a saved setup is not proof that monitoring is working now.`;
    if (has(/\b(black|broken|not working|permission|blocked)\b/)) return 'While parked, check camera permission for this site, close other camera apps, and reopen Camera calibration. Use good lighting and keep your face visible. If no preview appears, do not assume monitoring is active.';
    return 'While parked, secure the phone in its mount, open Camera calibration from Home or Account, allow the camera, and follow the on-screen framing and calibration steps. Keep your face visible and look ahead. Recalibrate after changing the mount; do not adjust it while driving.';
  }
  if (has(/\b(score|scores|rating|focus|attention|distraction|distracted|drowsy|sleepy|tired|habits)\b/)) {
    if (has(/\b(improve|better|habit|habits|tips|distracted|distraction|drowsy|sleepy|tired)\b/)) return 'Set your route and phone before moving, keep your attention on the road, and pull over safely before interacting with the app. If tired or distracted, stop driving when safe. CUBO’s camera alerts can miss events; they do not replace an attentive driver.';
    const score = data.averageFocusOutOf100;
    const summary = typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100 ? `Your saved measured-trip focus average is ${score}/100.` : 'You have no measured focus-score average available here yet; unavailable is not zero.';
    return `${summary} It summarizes eligible camera attention measurements from completed trips, not a live drive score or a validated safety rating. Open Activity for each trip. Missing camera/GPS measurements are not proof of safe driving.`;
  }
  if (has(/\b(trips?|history|miles|mileage|distance|drive time)\b/)) {
    if (has(/\b(delete|remove|clear)\b/)) return 'Open Activity and the trip details to manage a saved trip. I have not deleted any trip or history.';
    const count = typeof data.completedTrips === 'number' && Number.isFinite(data.completedTrips) ? data.completedTrips : null;
    return count === null ? 'Your trip summary is unavailable here. Open Activity for recorded trips.' : `Your saved summary has ${count} completed trip${count === 1 ? '' : 's'} and ${clean(data.savedMiles) || 'unavailable'} recorded miles. Open Activity for routes, times and reported events. This is saved history, not live travel data.`;
  }
  if (has(/\b(hazard|hazards|object|debris|pothole|report something)\b/)) return 'Use the hazard/megaphone button in the drive controls when safe. I have not submitted a report or marked a location. Chat is read-only. Separately, drive voice supports confirmed hazard reports saved to your trip only.';
  if (!has(/\b(voice|microphone|mic|mute|listen|speak)\b/) && has(/\b(map|maps|route|routing|turn|turning|road|street|navigate|navigation|destination|eta|arrival|traffic|locate|gps|speed|mph|where am i|take me|directions)\b/)) {
    if (has(/\b(speed|mph|gps|location)\b/)) return 'The drive map uses browser location permission and available GPS readings. Speed can be inaccurate or unavailable, especially indoors or with weak reception; use your vehicle’s speedometer. This chat has no live GPS, speed or current-road feed. Check the map and its status indicators.';
    if (has(/\b(source|apple|web|switch)\b/)) return 'Map source is in Account > Preferences. The Cloudflare app uses the Web map (MapLibre/OpenFreeMap); Apple Maps requires the supported native app. Changing the map source does not make Apple Maps available in Safari.';
    return 'Choose a destination in Map, select a suggestion, and review the route before starting. Follow the live map’s next-turn instruction; this chat has no live route, ETA, traffic or next-turn feed and will not guess directions. I have not started or changed a route.';
  }
  if (has(/\b(vehicle|vehicles|car|cars|garage)\b/)) {
    if (has(/\b(color|colour|paint)\b/)) return 'Open Home > Manage vehicles and tap the pencil on the car picture to change its color. The eye button opens vehicle details.';
    if (has(/\b(add|new|delete|remove|select|switch|change|edit)\b/)) return 'Use Home > Manage vehicles to add or manage cars. Tap a car on Home to select it; hold it to open details. In the garage, the eye opens details and the pencil on the picture changes color. I have not changed your garage.';
    if (has(/\b(worth|value|repair|safe|maintenance|fuel|battery)\b/)) return 'CUBO stores your garage selection, but this chat has no vehicle diagnostics, valuation, fuel level or maintenance data. Check your vehicle’s instruments and documentation; do not treat the app selection as live vehicle detection.';
  }
  if (has(/\b(privacy|data|recording|stored|storage|camera frames|cache|download|lag|crash|black screen|model|gpu)\b/)) return 'Quick answers run locally without loading the AI model. Chat history is saved in this browser under your account; clearing site data can erase it. Optional general AI uses device memory and can still crash Safari. Browser voice input may use its provider’s servers. CUBO does not save raw voice audio.';
  if (has(/\b(voice|listen|microphone|mic|mute|speak|talk)\b/)) return 'In Cubo Assistant, the mic dictates into your draft for review. The waveform starts Cubo Voice Assist: it sends spoken questions and reads replies using your Voice Preference. Tap it again to stop. CUBO is not always listening: voice must be enabled. Chat uses saved app data; use Voice Assist on the drive map for live-route questions. Browser speech support is required.';
  if (has(/\b(notification|notifications|theme|dark mode|light mode|appearance|devices|bluetooth)\b/)) return 'Manage appearance and notifications in Account. CUBO Devices describes the optional CUBO Cruise hardware; connecting hardware is disabled in this demo. No setting was changed by this chat.';
  if (has(/\b(help|what can you|how do i use|cubo|features)\b/)) return 'I can answer common CUBO questions about saved scores, vehicles, profile, addresses, demo family and insurance, plus camera and map setup. I cannot control the app or read live navigation. Quick answers need no model; general AI is optional. Use chat only when parked.';
  return null;
}
