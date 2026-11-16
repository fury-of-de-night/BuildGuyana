# Repository repairs — 16 November 2026

These repairs were made while the Supabase project was paused. No database, storage, provider settings, deployment or migration was changed. Migration files were not used as evidence of the live schema or authorization rules. The changes remain in the working tree for review.

## Changes

- Registration now renders the contact step for both roles. File controls have accessible names, photo preview URLs are released, and document-upload failures appear in the interface.
- Admin UI checks share `VITE_ADMIN_EMAIL` configuration and use Vite's browser environment API. Admin routes require admin access even in demo mode. The control panel fails closed if its PIN cannot be loaded; locking it no longer resets mount-only session checks.
- A `/reset-password` route completes the password-change flow and handles missing/expired sessions and rejected updates.
- Verification requests use the `document` upload field and include the current user's access token. Pending records pass their existing ID to the API; the API updates that record and returns its result. The browser no longer inserts an extra result record. Both repositories must be deployed together for this contract.
- Verification API errors are surfaced, historic manual approval/rejection statuses are normalized, and front/back ID document fields already used by registration are displayed with legacy `doc_id_card` fallback.
- Confirmation-required signup without a session now stops before authenticated document/profile writes and explicitly tells the user that selected files have not been saved.
- Milestone handlers check returned mutation errors before reporting success. Reward failures display partial-failure guidance. This does not make these operations transactional.
- Type mismatches, incomplete demo fixtures, a duplicate mock image key, and incorrect registration test setups were repaired. The contractor notification uses the signed-in owner's profile name.
- The verification API URL supports `VITE_VERIFICATION_API_URL`; existing hosted-URL fallback remains. Open Graph uses the `.gy` canonical domain.
- GitHub checks were added for type-checking, offline tests and production compilation. Equivalent type, test and build checks passed locally; the GitHub workflow itself has not run. Existing tracked dependencies and build outputs were not removed; `.gitignore` prevents additional generated files being added accidentally.

## Validation

- TypeScript passes.
- 86 frontend tests pass, including the original 65 tests and regressions for admin access, verification requests, password reset, and unsuccessful receipt/reward writes.
- Production compilation passes, with the existing large-bundle warning.
- Chromium with external requests blocked: homepage, login, reset-password, directory and demo pages render; both registration roles reach the contact step. Anonymous requests to all three admin routes redirect to login.
- Lint has no errors, but the strict `npm run lint` command still exits nonzero because of five existing Fast Refresh warnings for component modules exporting hooks. The rule was not disabled to obtain a passing result.
- No live authentication, email delivery, database persistence, storage access or financial operation was validated.

Run locally:

```sh
npm run type-check
npm test -- --maxWorkers=2 --minWorkers=1 --no-cache
npm run build -- --outDir /tmp/buildguyana-build
npm run dev -- --strictPort
```

Use the existing isolated checkout; a separate Git worktree is unnecessary. Node 24 was used. Browser smoke checks used the installed system Chromium. Avoid committing generated changes under tracked `node_modules` or `out`. The Graphify CLI was unavailable, so its generated knowledge graph was left unchanged.

## Deferred until Supabase is available

- Inspect the actual schema, RLS policies, column privileges, triggers and deployed function configuration. Do not assume the bundled SQL reflects them.
- Move quote debits, top-up approval, hiring, milestones and one-time reputation awards into validated server/database transactions. Current error reporting is improved, but concurrency and partial-write risks remain.
- Verify canonical submission persistence against real permissions and existing rows; reconcile old duplicate verification records only after inspection. Current retry handling does not provide database-level concurrency locking.
- Confirm private storage for identity documents and logs, authorized delivery, retention and deletion. Repository URL construction cannot establish bucket privacy.
- Reconcile verification approval, contractor badges and expiry fields against live behavior before changing multiple records together.
- Test confirmation email, recovery links and invitations with controlled accounts. The password reset destination `/reset-password` must be allowed by the project's redirect configuration; no external settings were changed.
- Align frontend `VITE_ADMIN_EMAIL`, backend `ADMIN_EMAIL`, and the separately deployed invitation function's authorization configuration. UI email checks are not a substitute for server/database permissions.
- Review the `.gy`/`.com` hosting relationship, real contact details, placeholder content, bundle splitting and existing dependency tracking before launch.
