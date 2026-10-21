const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(relative) {
  const file = path.join(__dirname, '..', relative);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const result = { exports: {} };
  new Function('module', 'exports', code)(result, result.exports);
  return result.exports;
}
const { formatDuration, elapsedSeconds } = load('src/features/drives/formatDuration.ts');
const { snapPipCorner, isAhead } = load('src/features/drives/mapGeometry.ts');
const { parseBirthDate, makeAccountDetails } = load('src/features/auth/accountDetails.ts');
const { matchNearbyCruise } = load('src/features/devices/cruiseProximity.ts');
const { formatBirthInput, phoneDigits, formatPhoneInput, internationalPhone } = load('src/features/auth/inputFormatting.ts');
const { isLiveRoadReport, canConfirmRoadReport, REPORT_LIFETIME_MS, SURVEY_TIMEOUT_MS } = load('src/features/drives/roadReportPolicy.ts');
const { commitAccountDetails } = load('src/features/auth/commitAccountDetails.ts');

test('account details are not marked updated until the cloud write succeeds', async () => {
  const calls = [];
  let acknowledge;
  const pending = commitAccountDetails({}, {
    persistCloud: () => new Promise(resolve => { calls.push('cloud'); acknowledge = resolve; }),
    cacheLocally: async () => { calls.push('cache'); },
    onSaved: () => { calls.push('updated'); },
  });
  assert.deepEqual(calls, ['cloud']);
  acknowledge(); await pending;
  assert.deepEqual(calls, ['cloud', 'updated', 'cache']);
});

test('a rejected cloud save never changes local account details; cache failure does not undo cloud success', async () => {
  let updated = false;
  await assert.rejects(commitAccountDetails({}, {
    persistCloud: async () => { throw Error('permission-denied'); },
    cacheLocally: async () => { throw Error('must not run'); },
    onSaved: () => { updated = true; },
  }), /permission-denied/);
  assert.equal(updated, false);
  await commitAccountDetails({}, {
    persistCloud: async () => undefined,
    cacheLocally: async () => { throw Error('storage full'); },
    onSaved: () => { updated = true; },
  });
  assert.equal(updated, true);
});

test('hazards stop exactly after 30 minutes or the tenth unique response', () => {
  const report = { reporterId: 'driver-a', createdAtMs: 1000, active: true, confirmationCount: 9 };
  assert.equal(isLiveRoadReport(report, 1000 + REPORT_LIFETIME_MS - 1), true);
  assert.equal(isLiveRoadReport(report, 1000 + REPORT_LIFETIME_MS), false);
  assert.equal(isLiveRoadReport({ ...report, confirmationCount: 10 }, 2000), false);
  assert.equal(isLiveRoadReport({ ...report, active: false }, 2000), false);
});
test('report submitter and duplicate respondents are excluded from hazard survey', () => {
  const report = { reporterId: 'driver-a', createdAtMs: 1000 };
  assert.equal(canConfirmRoadReport(report, 'driver-a', false, 2000), false);
  assert.equal(canConfirmRoadReport(report, 'driver-b', false, 2000), true);
  assert.equal(canConfirmRoadReport(report, 'driver-b', true, 2000), false);
  assert.equal(SURVEY_TIMEOUT_MS, 10000);
});

test('birthday formatting inserts separators, allows deletion, and limits year length', () => {
  assert.equal(formatBirthInput('11'), '11/');
  assert.equal(formatBirthInput('1105'), '11/05/');
  assert.equal(formatBirthInput('11052011'), '11/05/2011');
  assert.equal(formatBirthInput('110520111'), '11/05/2011');
  assert.equal(formatBirthInput('11', '11/'), '1');
  assert.equal(formatBirthInput('13', '1'), '1');
  assert.equal(formatBirthInput('1132', '11/3'), '11/3');
  assert.throws(() => parseBirthDate('11/05/20011'));
});
test('phone entry formats locally and stores the selected calling code', () => {
  assert.equal(phoneDigits('+1 (919) 555-0123', '1'), '9195550123');
  assert.equal(formatPhoneInput('9195550123', '1'), '(919) 555-0123');
  assert.equal(internationalPhone('9195550123', '1'), '+19195550123');
  assert.equal(internationalPhone('9876543210', '91'), '+919876543210');
  assert.equal(internationalPhone('', '1'), '');
  assert.throws(() => internationalPhone('919', '1'));
});
test('age classification changes on the eighteenth birthday and rejects impossible dates', () => {
  const now = new Date(2026, 9, 9);
  assert.equal(parseBirthDate('10/09/2008', now).accountType, 'adult');
  assert.equal(parseBirthDate('10/10/2008', now).accountType, 'minor');
  assert.throws(() => parseBirthDate('02/30/2008', now));
  assert.throws(() => parseBirthDate('10/09/2030', now));
  assert.throws(() => makeAccountDetails('10/09/2008', '9195550123'));
  assert.equal(makeAccountDetails('10/09/2008', '+1 (919) 555-0123').phoneVerification, 'unverified');
  assert.equal(makeAccountDetails('10/09/2008', '').phoneNumber, '');
});
test('Cruise recognizer requires trusted stable signals and refuses ambiguous cars', () => {
  const now = 10000; const bindings = [{ deviceId: 'a', vehicleId: 'car-a' }, { deviceId: 'b', vehicleId: 'car-b' }];
  const samples = (deviceId, rssi, authenticated = true) => [6000, 7000, 9000].map(timestamp => ({ deviceId, rssi, authenticated, timestamp }));
  assert.equal(matchNearbyCruise(bindings, samples('a', -50, false), now).state, 'none');
  assert.deepEqual(matchNearbyCruise(bindings, samples('a', -50), now), { state: 'nearby', vehicleId: 'car-a' });
  assert.equal(matchNearbyCruise(bindings, [...samples('a', -50), ...samples('b', -55)], now).state, 'ambiguous');
  assert.equal(matchNearbyCruise(bindings, samples('a', -50), 30000).state, 'none');
});
test('short trips retain seconds and elapsed time excludes pre-drive setup', () => {
  assert.equal(formatDuration(3), '3s');
  assert.equal(formatDuration(66), '1m 6s');
  assert.equal(elapsedSeconds('2026-10-09T20:00:00.000Z', Date.parse('2026-10-09T20:00:03.900Z')), 3);
  assert.equal(elapsedSeconds('bad timestamp'), 0);
});
test('PiP release chooses each corner, including exact measured lower boundary', () => {
  assert.deepEqual(snapPipCorner(30, 120, 250, 104, 430), { x: 16, y: 104 });
  assert.deepEqual(snapPipCorner(230, 120, 250, 104, 430), { x: 250, y: 104 });
  assert.deepEqual(snapPipCorner(30, 420, 250, 104, 430), { x: 16, y: 430 });
  assert.deepEqual(snapPipCorner(230, 420, 250, 104, 430), { x: 250, y: 430 });
});
test('approach alerts distinguish hazards ahead from hazards behind a moving driver', () => {
  const origin = { latitude: 35, longitude: -78, heading: 90 };
  assert.equal(isAhead(origin, { latitude: 35, longitude: -77.999 }), true);
  assert.equal(isAhead(origin, { latitude: 35, longitude: -78.001 }), false);
  assert.equal(isAhead({ ...origin, heading: 180 }, { latitude: 34.999, longitude: -78 }), true);
});
