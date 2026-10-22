# Community hazard release analysis

This release adds the Standard Firestore rules and composite index needed by `roadReports`. Firebase accepted and published the rules on October 22, 2026, and the `cell ASC, createdAt DESC` collection index reached Enabled status.

Paths inspected: users/{uid} owner-only profile read/create/update; roadReports/{autoId} authenticated immutable report create; roadReports/{id}/confirmations/{uid} authenticated unique vote creation paired atomically with parent counter.
Queries: nine neighboring 0.01-degree cells via cell in, createdAt newer than 30 minutes, orderBy createdAt desc, limit 100. Composite index is required.
Reports contain reporter UID, enum kind, numeric latitude/longitude, validated cell, server createdAt, confirmationCount 0..10, active boolean. No email, name, route, or camera footage.
Updates only increment the counter by one and flip active at ten. The submitter cannot vote. Confirmation is immutable, one per UID. Both atomic writes must validate through getAfter; standalone counter or vote writes must fail.
Expiry removes a report from map/surveys after 30 minutes, but does not physically delete its database document. No TTL service or paid scheduled function is enabled.

Manual adversarial review: anonymous reads/writes denied; private users remain owner-only; spoofed reporter denied; arbitrary fields/types/large strings denied by validators; createdAt must be server time; immutable report fields protected; voter must match auth; duplicate votes, reporter vote, expired vote, count >10, missing parent, standalone counter increment and standalone confirmation blocked by paired before/after checks.
These are design-level checks backed by a successful Firebase console compile/publish and an enabled production index. A real two-phone drive remains the final physical-device validation.
