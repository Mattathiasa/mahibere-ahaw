#!/usr/bin/env node
/**
 * One-shot migration: move parish bank accounts and contacts out of the
 * publicly-readable parish record.
 *
 * `/hierarchy` is readable by anonymous visitors on purpose — the public sign-up
 * form needs the parish dropdown before anyone has an account, and the
 * `where('level','==','Atbiya')` equality filter is what makes that query
 * provable against the Firestore rule. That was fine for a parish name. It was
 * not fine once the records grew to carry `bankAccounts` (bank name, ACCOUNT
 * NUMBER, account holder) and `contact` (parish leader name, two phone numbers,
 * email): anyone on the internet could list the collection and take the lot.
 *
 * Firestore rules cannot project fields, so a public document has to be safe in
 * its entirety. This script copies those two fields into
 * `atbiyaPrivate/{parishId}` — gated to admins, head office and the parish
 * itself — and deletes them from the parish record.
 *
 * Idempotent: a parish with neither field is skipped, so re-running is a no-op.
 * Ordered copy-then-delete, so an interrupted run leaves data duplicated rather
 * than lost. Re-run it and the leftovers are cleaned up.
 *
 * Lives under functions/ because it needs the Admin SDK, which is a dependency
 * of the functions codebase and deliberately not of the web app.
 *
 *   # against the emulator (do this first)
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GOOGLE_CLOUD_PROJECT=mahibere-ahaw \
 *     node functions/scripts/migrate-atbiya-private.mjs
 *
 *   # against production — needs service-account credentials
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     GOOGLE_CLOUD_PROJECT=<project-id> \
 *     node functions/scripts/migrate-atbiya-private.mjs
 *
 * Pass --dry-run to report what would move without writing anything.
 *
 * RUN THIS BEFORE DEPLOYING firestore.rules. The new rules refuse `contact` and
 * `bankAccounts` on /hierarchy, so a parish edit fails until its record has been
 * migrated.
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const DRY_RUN = process.argv.includes('--dry-run');
const PRIVATE_KEYS = ['bankAccounts', 'contact'];

// The emulator accepts any credential; production needs a real one. Reading the
// host variable rather than a flag keeps this consistent with how the Firebase
// tooling already decides where it is pointed.
const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;

if (!projectId) {
  console.error('Set GOOGLE_CLOUD_PROJECT to the Firebase project id.');
  process.exit(1);
}

initializeApp(
  usingEmulator ? { projectId } : { projectId, credential: applicationDefault() }
);

const db = getFirestore();

async function main() {
  console.log(
    `${DRY_RUN ? '[dry run] ' : ''}Migrating parish private fields in ${projectId}` +
    `${usingEmulator ? ` (emulator ${process.env.FIRESTORE_EMULATOR_HOST})` : ''}\n`
  );

  const snap = await db.collection('hierarchy').where('level', '==', 'Atbiya').get();

  let moved = 0;
  let skipped = 0;

  for (const parish of snap.docs) {
    const data = parish.data();
    const present = PRIVATE_KEYS.filter((k) => data[k] !== undefined);

    if (present.length === 0) {
      skipped += 1;
      continue;
    }

    const privatePart = Object.fromEntries(present.map((k) => [k, data[k]]));
    const label = data.name || parish.id;
    const bankCount = Array.isArray(data.bankAccounts) ? data.bankAccounts.length : 0;

    console.log(
      `  ${label} — moving ${present.join(', ')}` +
      `${bankCount ? ` (${bankCount} bank account${bankCount === 1 ? '' : 's'})` : ''}`
    );

    if (!DRY_RUN) {
      // Copy first. An interrupted run must never lose the only copy.
      await db.collection('atbiyaPrivate').doc(parish.id).set(
        { ...privatePart, migratedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      await parish.ref.update(
        Object.fromEntries(present.map((k) => [k, FieldValue.delete()]))
      );
    }

    moved += 1;
  }

  console.log(
    `\n${DRY_RUN ? 'Would move' : 'Moved'} ${moved} paris` +
    `${moved === 1 ? 'h' : 'hes'}; ${skipped} had nothing to move.`
  );

  if (DRY_RUN) console.log('\nNothing was written. Drop --dry-run to apply.');
}

main().catch((err) => {
  console.error('\nMigration failed:', err);
  process.exit(1);
});
