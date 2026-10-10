# Account metadata schema extension

Target: existing Standard `(default)` database in `cubo-app-cac-data`, verified in Firebase console. Existing profile path is `users/{auth.uid}`. Existing reads use direct owner document snapshots; saves update `accountDetails` and server `updatedAt`; signup creates the same owner profile. No list query or new index is required. Existing hazard paths remain denied by this deployment.

Add an optional bounded accountDetails map to owner-only user documents. It stores self-declared DOB, phone, minor/adult UI classification, and fixed unverified/not-linked labels. It is not identity verification, SMS verification, or authority for family permissions. Family server domain code remains the authority for linked-minor approvals and roles; that service is not deployed. DOB string rules validate bounded format, not actual calendar validity or adulthood; the client normalizes valid calendar dates. A future trusted service must validate ages for privilege decisions.

Manual attack review: unauthenticated reads/writes denied; second-account reads/writes denied by path UID; ownership changes denied; extra top-level or nested keys denied; oversized or non-string phone/DOB denied; verification/guardian flag escalation denied; createdAt changes denied; update timestamps must equal request time. Required profile fields cannot be deleted. Existing profiles without accountDetails remain valid. A user can forge self-declared age metadata: this must never authorize family roles or bypass the family server's minor review.

No actual user's birthday or phone number was entered or changed for QA. Deployment and runtime test results are reported separately in the chat.

## Verification and publication

Firebase console rules simulator compiled the draft and verified anonymous reads denied, other-UID reads denied, same-UID reads allowed. The account-metadata-only rule version was published Oct 10, 2026 (console shows Today 4:19 PM, America/New_York). This does not deploy the hazard proposal or the optional family backend. UI/ordered-write unit tests are not a substitute for end-to-end saving actual account details; the user supplies and saves those in-app.
