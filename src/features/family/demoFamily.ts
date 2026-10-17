// Preview-only people. Never insert these records into the real family service.
export const demoFamily = [
  { uid: 'demo-partner', name: 'Parent', initials: 'P', role: 'Parent/Guardian', relationship: 'Parent/Guardian', adult: true, score: 94, minutes: 326, miles: 214, trips: 18 },
  { uid: 'demo-teen-1', name: 'Child 1', initials: 'C1', role: 'Minor', relationship: 'Teen driver · 17', adult: false, score: 89, minutes: 148, miles: 82, trips: 9 },
  { uid: 'demo-teen-2', name: 'Child 2', initials: 'C2', role: 'Minor', relationship: 'Learning driver · 16', adult: false, score: 92, minutes: 96, miles: 43, trips: 6 },
] as const;
export const findDemoMember = (uid?: string) => demoFamily.find(member => member.uid === uid);
