export const REPORT_LIFETIME_MS = 30 * 60 * 1000;
export const REPORT_RESPONSE_LIMIT = 10;
export const SURVEY_TIMEOUT_MS = 10000;
type Report = { reporterId: string; createdAtMs: number; confirmationCount?: number; active?: boolean };
export function isLiveRoadReport(report: Report, now = Date.now()) {
  return Number.isFinite(report.createdAtMs) && report.createdAtMs <= now && now - report.createdAtMs < REPORT_LIFETIME_MS && report.active !== false && (report.confirmationCount ?? 0) < REPORT_RESPONSE_LIMIT;
}
export function canConfirmRoadReport(report: Report, uid: string, alreadyAnswered: boolean, now = Date.now()) {
  return !!uid && report.reporterId !== uid && !alreadyAnswered && isLiveRoadReport(report, now);
}
