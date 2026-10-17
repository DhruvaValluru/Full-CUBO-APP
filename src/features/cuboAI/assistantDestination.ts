import { appQuestion } from './appAnswers';
import { searchPlaces, type Coordinate, type PlaceResult } from '../places/searchPlaces';

export function destinationQuery(input: string): string | null {
  const q = appQuestion(input);
  const match = q.match(/^(?:set|change|update) (?:my |the )?(?:address|destination|route)(?: to)?\s+(.+)$/)
    ?? q.match(/^(?:navigate|take me|direct me|route me|drive|go|get directions) to\s+(.+)$/)
    ?? q.match(/^(?:directions|a route) to\s+(.+)$/)
    ?? q.match(/^(?:take me|navigate|go) (home|work)$/);
  return match?.[1]?.trim() ?? null;
}
type Reply = { text: string; choices: PlaceResult[]; confirmation?: PlaceResult; destination?: PlaceResult };
/** Search and confirmation only. Never starts a trip or changes saved Home/Work. */
export class AssistantDestination {
  private choices: PlaceResult[] = [];
  private selected: PlaceResult | null = null;
  private until = 0;
  constructor(private context: () => { home?: PlaceResult; work?: PlaceResult; origin?: Coordinate | null },
    private search = searchPlaces, private now = Date.now) {}
  clear() { this.choices = []; this.selected = null; this.until = 0; }
  acceptsFollowUp() { return (!!this.selected || this.choices.length > 0) && this.now() < this.until; }
  private confirmMap(place: PlaceResult): Reply {
    this.choices = []; this.selected = place; this.until = this.now() + 120000;
    return { text: `Switch to Map with ${place.title}, ${place.subtitle}? Say yes or confirm to preview the route, or no to stay here. You will still tap Start drive yourself.`, choices: [], confirmation: place };
  }
  spokenChoices() {
    if (!this.acceptsFollowUp()) return null;
    if (this.selected) return `Switch to Map with ${this.selected.title.slice(0, 65)}? Say yes or confirm, or no to stay here. You will still tap Start drive yourself.`;
    return this.choices.map((place, index) => `Option ${index + 1}: ${place.title.slice(0, 40)}.`).join(' ') + ' Check the full address on screen, then say the option number or cancel.';
  }
  async answer(input: string, signal?: AbortSignal): Promise<Reply | null> {
    const q = appQuestion(input);
    const query = destinationQuery(input);
    if (!this.acceptsFollowUp()) this.clear();
    if (query === null && this.selected) {
      if (/^(?:yes|confirm|yes please|switch to map|open map|go ahead|yes switch to map)$/.test(q)) {
        const destination = this.selected; this.clear();
        return { text: 'Opening Map with your destination. Review the route, then tap Start drive when ready.', choices: [], destination };
      }
      if (/^(?:no|no thanks|cancel|stay here|never mind|nevermind|stop)$/.test(q)) { this.clear(); return { text: 'Staying in Cubo Assistant. Your route has not changed.', choices: [] }; }
      if (/^(?:repeat|repeat that|what am i confirming)$/.test(q)) return this.confirmMap(this.selected);
      this.clear(); return null;
    }
    if (query === null && this.choices.length) {
      if (/^(?:cancel|never mind|nevermind|no|stop)$/.test(q)) { this.clear(); return { text: 'Destination selection cancelled.', choices: [] }; }
      const choice = q.replace(/^(?:(?:use|choose|select|the|option|number) )+/, '').replace(/ (?:one|option)$/, '');
      let index = /^(?:1|one|first)$/.test(choice) ? 0
        : /^(?:2|two|second)$/.test(choice) ? 1 : /^(?:3|three|third)$/.test(choice) ? 2 : -1;
      if (/^(?:yes|confirm|yes please|that one)$/.test(q) && this.choices.length === 1) index = 0;
      if (index < 0) index = this.choices.findIndex(p => appQuestion(p.title) === q);
      const destination = this.choices[index];
      if (destination) return this.confirmMap(destination);
      if (/^(?:yes|confirm|that one)$/.test(q)) return { text: 'Which match? Say option one, two, or three, or tap its full address.', choices: this.choices };
      this.clear();
      return null;
    }
    if (query === null) return null;
    this.clear();
    if (/^(?:this place|there|here|somewhere|a place)$/.test(query)) return { text: 'What address or place should I find? Include the city if you know it.', choices: [] };
    const saved = this.context();
    const kind = /^(?:my )?home$/.test(query) ? 'home' : /^(?:my )?(?:work|office)$/.test(query) ? 'work' : null;
    if (kind) return saved[kind] ? this.confirmMap(saved[kind]!) : { text: `Set your ${kind} address in Account first, or tell me the street address.`, choices: [] };
    try {
      const results = await this.search(query, saved.origin, signal);
      if (signal?.aborted) return null;
      this.choices = results.slice(0, 3); this.until = this.now() + 120000;
      if (!this.choices.length) return { text: 'No matching address found. Try the street plus city or ZIP code.', choices: [] };
      if (this.choices.length === 1) return this.confirmMap(this.choices[0]);
      const labels = this.choices.map((p, i) => `${i + 1}. ${p.title}, ${p.subtitle}`).join('\n');
      return { text: `Choose the correct destination:\n${labels}\n${this.choices.length === 1 ? 'Say confirm or tap the address.' : 'Say option one, two, or three, or tap the address.'} This only previews a route.`, choices: this.choices };
    } catch (error) {
      if (signal?.aborted) return null;
      return { text: 'Address search is unavailable right now. Try again with the city or ZIP code.', choices: [] };
    }
  }
}
