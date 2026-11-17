# Shared website standards synchronization

## Activation

1. Merge the standards setup branch in all four repositories into their default
   branches (BuildGuyana: master; the other three: main). This is documentation
   and automation only; it does not merge Johnson Rise & Shine's testing code.
2. In BuildGuyana, add the Actions secret `STANDARDS_SYNC_TOKEN` under Settings →
   Secrets and variables → Actions. Use a fine-grained GitHub token scoped to the
   four participating repositories with **Contents: read and write**. Enter its
   value only in GitHub's secret field, never in chat, source, or documentation.
   The normal GITHUB_TOKEN cannot write to the other private repositories.
3. Enable Actions and run **Sync shared website standards** manually once. The
   schedule works only from the default branch. Direct writes must be allowed by
   branch protection for the selected identity; do not disable protection merely
   to make synchronization pass. If direct writes are disallowed, adapt the
   automation to update pull requests instead.

## Editing

Edit root `WEBSITE_BUILD_STANDARDS.md` in any participating repository, then commit
and push to its default branch (merge a PR if appropriate). BuildGuyana edits
trigger an immediate run. Other repository edits are detected by a nominal
five-minute schedule; GitHub may delay runs. Feature-branch and local edits do not
propagate. Existing local checkouts still need `git pull` to receive updates.

The workflow updates only the shared standards and its hash baseline. It does not
synchronize source code, secrets, restaurant-only standards, or project exceptions.
It does not enforce standards by rewriting websites. Documentation pushes may
trigger existing deployment workflows in a destination repository.

Put project-specific exceptions in `PROJECT_STANDARDS.md`. Existing instructions
and explicit user requests remain authoritative. Do not remove marketplace accounts
because guest service-request forms are the preferred flow for Johnson Rise & Shine.

## Conflicts and recovery

The coordinator compares all four files against the last shared SHA-256 baseline.
One distinct changed version propagates. Multiple different changed versions stop
the run before any writes. Reconcile the conflicting copies manually and rerun;
never reset the baseline merely to hide a conflict. SHA-checked writes reject
concurrent destination edits. A partial write failure leaves the baseline unchanged
so a later retry can finish; new divergent edits still require manual review.

Inspect the Actions run for access, expired token, branch protection, or conflict
failures. Tokens are never printed. Scheduled workflows can be delayed or disabled
by GitHub (including inactivity on public repositories); monitor Actions and use
manual dispatch when necessary. Rotate expiring tokens through the secret field.

Run regression tests with:

    cd .github/scripts
    python3 -B -m unittest test_sync_standards.py

Local tests cover edits from each repository, unchanged reruns, conflicts,
missing copies, and recovery after partial failures. Live cross-repository
synchronization is not verified until the workflow succeeds with the configured
secret on the default branch.
