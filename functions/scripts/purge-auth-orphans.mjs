#!/usr/bin/env node
/**
 * Deletes Firebase Auth accounts that no longer have a member record.
 *
 * The app can delete a `users/{uid}` document but not the credential behind it:
 * there is no Admin SDK in the browser, and `deleteUser` in the client SDK only
 * ever works on the account that is currently signed in. So purging somebody
 * from Software Control leaves a login that still authenticates and then gets
 * turned away for having no profile. This sweeps those up.
 *
 * It is the second half of that flow, not a thing to run casually. Every account
 * it deletes is a person who can no longer sign in, and there is no undo.
 *
 * Lives under functions/ because it needs firebase-admin, which is a dependency
 * of the functions codebase and deliberately not of the web app. It is a plain
 * node script rather than a deployed function, so the Spark plan does not block
 * it — only Cloud Functions need Blaze.
 *
 *   # look, change nothing (the default — see REQUIRED FLAGS below)
 *   GOOGLE_CLOUD_PROJECT=mahibere-ahaw \
 *     node functions/scripts/purge-auth-orphans.mjs
 *
 *   # actually delete
 *   GOOGLE_CLOUD_PROJECT=mahibere-ahaw \
 *     node functions/scripts/purge-auth-orphans.mjs --yes
 *
 * REQUIRED FLAGS. Unlike migrate-atbiya-private.mjs, this one is destructive, so
 * the safe mode is the DEFAULT and `--yes` is what arms it. There is no
 * `--dry-run` to forget.
 *
 * Refuses to run when `users` reads as empty. A permissions failure or a wrong
 * project id would otherwise look exactly like "every account is an orphan", and
 * this script would cheerfully delete every login in the project.
 */

import { existsSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--yes');
const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;

if (!projectId) {
  console.error('Set GOOGLE_CLOUD_PROJECT to the Firebase project id.');
  process.exit(1);
}

const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

// Fail early and legibly, the same way the parish migration does — without
// credentials the Admin SDK throws from deep inside google-gax, after the banner
// has printed, which reads like the sweep ran and broke.
if (!usingEmulator && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const adc = `${process.env.HOME}/.config/gcloud/application_default_credentials.json`;
  if (!existsSync(adc)) {
    console.error(
      'No credentials.\n\n' +
      'Deleting an Auth account needs the Admin SDK: the client SDK can only\n' +
      'delete the account it is signed in as, which is why the app cannot do\n' +
      'this itself.\n\n' +
      'Either:\n' +
      '  1. Firebase Console -> Project Settings -> Service Accounts ->\n' +
      '     "Generate new private key", save it OUTSIDE this repository, then\n' +
      '     GOOGLE_APPLICATION_CREDENTIALS=~/mahibere-ahaw-key.json \\\n' +
      '       GOOGLE_CLOUD_PROJECT=mahibere-ahaw \\\n' +
      '       node functions/scripts/purge-auth-orphans.mjs\n\n' +
      '  2. gcloud auth application-default login\n'
    );
    process.exit(1);
  }
}

initializeApp(
  usingEmulator ? { projectId } : { projectId, credential: applicationDefault() }
);

const auth = getAuth();
const db = getFirestore();

async function main() {
  console.log(
    `${APPLY ? '' : '[report only] '}Sweeping orphaned Auth accounts in ${projectId}\n`
  );

  // Every uid that still has a member record.
  const snap = await db.collection('users').get();
  const known = new Set(snap.docs.map((d) => d.id));

  // The guard that matters. An empty read here means a wrong project, a bad
  // credential, or a rules/IAM problem — never "this church has no members".
  // Without this check the sweep below would delete every login in the project.
  if (known.size === 0) {
    console.error(
      'The `users` collection came back EMPTY, so every Auth account would look\n' +
      'orphaned. Refusing to continue. Check GOOGLE_CLOUD_PROJECT and the\n' +
      'credentials before trying again.'
    );
    process.exit(1);
  }

  console.log(`  ${known.size} member records found.`);

  const orphans = [];
  let scanned = 0;
  let pageToken;

  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      scanned += 1;
      if (!known.has(user.uid)) {
        orphans.push({
          uid: user.uid,
          email: user.email ?? '(no address)',
          created: user.metadata.creationTime,
          lastSignIn: user.metadata.lastSignInTime || 'never',
        });
      }
    }
    pageToken = page.pageToken;
  } while (pageToken);

  console.log(`  ${scanned} Auth accounts scanned.\n`);

  if (orphans.length === 0) {
    console.log('Nothing to sweep — every login has a member record.');
    return;
  }

  console.log(`${orphans.length} login${orphans.length === 1 ? '' : 's'} with no member record:\n`);
  for (const o of orphans) {
    console.log(`  ${o.email.padEnd(38)} last signed in: ${o.lastSignIn}`);
  }

  if (!APPLY) {
    console.log('\nNothing was deleted. Re-run with --yes to apply.');
    return;
  }

  // deleteUsers takes at most 1000 uids per call and reports per-uid failures
  // rather than throwing, so a single locked account cannot abort the sweep.
  let deleted = 0;
  const failures = [];
  for (let i = 0; i < orphans.length; i += 1000) {
    const batch = orphans.slice(i, i + 1000);
    const result = await auth.deleteUsers(batch.map((o) => o.uid));
    deleted += result.successCount;
    for (const err of result.errors) {
      failures.push(`${batch[err.index].email}: ${err.error.message}`);
    }
  }

  console.log(`\nDeleted ${deleted} login${deleted === 1 ? '' : 's'}.`);
  if (failures.length > 0) {
    console.log(`${failures.length} could not be deleted:`);
    for (const f of failures) console.log(`  ${f}`);
  }
}

main().catch((err) => {
  console.error('\nSweep failed:', err);
  process.exit(1);
});
