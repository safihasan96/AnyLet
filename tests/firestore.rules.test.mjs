/**
 * AnyLet – Firestore Security Rules Tests
 * Run with: node --experimental-vm-modules tests/firestore.rules.test.mjs
 *
 * Emulator must be running on port 9090 first:
 *   firebase emulators:start --only firestore
 *
 * 4 Tests:
 *  1. Attacker tries to create a paymentIntent directly → MUST be DENIED
 *  2. Authenticated user reads their own paymentIntent → MUST be ALLOWED
 *  3. Unauthenticated user reads any collection → MUST be DENIED
 *  4. Admin reads commissions/withdrawals → MUST be ALLOWED
 */

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load your actual firestore.rules file ────────────────────────────────────
const rulesPath = resolve(__dirname, '../firestore.rules');
const rules = readFileSync(rulesPath, 'utf8');

// ─── Project ID must match emulator project ───────────────────────────────────
const PROJECT_ID = 'anylet-test';

let testEnv;

// ── Helpers ────────────────────────────────────────────────────────────────────
const log = (icon, label, passed) =>
  console.log(`  ${icon}  ${passed ? '\x1b[32mPASSED\x1b[0m' : '\x1b[31mFAILED\x1b[0m'}  ${label}`);

async function setup() {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 9090,
    },
  });

  // Seed a paymentIntent document as if written by backend (no rules — direct admin write)
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'paymentIntents', 'intent-abc'), {
      uid: 'user-123',
      status: 'completed',
      used: true,
      amount: 5000,
    });

    // Seed a commission for admin read test
    await setDoc(doc(db, 'commissions', 'comm-001'), {
      referrerId: 'user-999',
      amount: 200,
    });

    // Seed a withdrawal for admin read test
    await setDoc(doc(db, 'withdrawals', 'w-001'), {
      uid: 'user-999',
      amount: 150,
      status: 'pending',
    });
  });
}

async function teardown() {
  await testEnv.cleanup();
}

// ── TEST 1: Attacker cannot create a paymentIntent directly ────────────────────
async function test1_attackerCannotCreatePaymentIntent() {
  const label = 'TEST 1 — Attacker tries to CREATE a paymentIntent directly → DENIED';
  try {
    // Simulate an authenticated attacker (not a backend service)
    const attacker = testEnv.authenticatedContext('attacker-uid');
    const db = attacker.firestore();

    await assertFails(
      setDoc(doc(db, 'paymentIntents', 'fake-intent'), {
        uid: 'attacker-uid',
        status: 'completed',
        used: true,
        amount: 99999,
      })
    );
    log('✅', label, true);
    return true;
  } catch (e) {
    log('❌', label, false);
    console.error('    Error:', e.message);
    return false;
  }
}

// ── TEST 2: Authenticated user reads their OWN paymentIntent ──────────────────
async function test2_userReadsOwnPaymentIntent() {
  const label = 'TEST 2 — Authenticated user reads their OWN paymentIntent → ALLOWED';
  try {
    const user = testEnv.authenticatedContext('user-123');
    const db = user.firestore();

    await assertSucceeds(
      getDoc(doc(db, 'paymentIntents', 'intent-abc'))
    );
    log('✅', label, true);
    return true;
  } catch (e) {
    log('❌', label, false);
    console.error('    Error:', e.message);
    return false;
  }
}

// ── TEST 3: Unauthenticated user cannot read any collection ───────────────────
async function test3_unauthenticatedUserDenied() {
  const label = 'TEST 3 — Unauthenticated user reads paymentIntents → DENIED';
  try {
    const guest = testEnv.unauthenticatedContext();
    const db = guest.firestore();

    await assertFails(
      getDoc(doc(db, 'paymentIntents', 'intent-abc'))
    );
    log('✅', label, true);
    return true;
  } catch (e) {
    log('❌', label, false);
    console.error('    Error:', e.message);
    return false;
  }
}

// ── TEST 4: Admin can read commissions and withdrawals ────────────────────────
async function test4_adminReadsCommissionsAndWithdrawals() {
  const label = 'TEST 4 — Admin reads commissions + withdrawals → ALLOWED';
  try {
    // Simulate admin user — pass custom claims directly (no 'token' wrapper)
    const admin = testEnv.authenticatedContext('admin-uid', {
      admin: true,
    });
    const db = admin.firestore();

    await assertSucceeds(getDoc(doc(db, 'commissions', 'comm-001')));
    await assertSucceeds(getDoc(doc(db, 'withdrawals', 'w-001')));

    log('✅', label, true);
    return true;
  } catch (e) {
    log('❌', label, false);
    console.error('    Error:', e.message);
    return false;
  }
}

// ── TEST 5: Notification abuse — extra fields / oversized payload ─────────────
async function test5_notificationAbuseDenied() {
  const label = 'TEST 5 — Malformed/oversized notification for another user → DENIED';
  try {
    const attacker = testEnv.authenticatedContext('attacker-uid');
    const db = attacker.firestore();

    // a) Unexpected extra field (schema lock via hasOnly)
    await assertFails(
      setDoc(doc(db, 'notifications', 'evil-1'), {
        userId: 'victim-uid',
        type: 'system',
        title: 'Hi',
        isRead: false,
        payloadExploit: 'arbitrary',
      })
    );

    // b) Oversized title (phishing/spam payload bound)
    await assertFails(
      setDoc(doc(db, 'notifications', 'evil-2'), {
        userId: 'victim-uid',
        type: 'system',
        title: 'x'.repeat(500),
        isRead: false,
      })
    );

    // c) isRead pre-set to true (must start unread)
    await assertFails(
      setDoc(doc(db, 'notifications', 'evil-3'), {
        userId: 'victim-uid',
        type: 'system',
        title: 'Hi',
        isRead: true,
      })
    );

    log('✅', label, true);
    return true;
  } catch (e) {
    log('❌', label, false);
    console.error('    Error:', e.message);
    return false;
  }
}

// ── TEST 6: Legitimate cross-user notification still works ────────────────────
async function test6_legitNotificationAllowed() {
  const label = 'TEST 6 — Well-formed notification for another user → ALLOWED';
  try {
    const user = testEnv.authenticatedContext('sender-uid');
    const db = user.firestore();

    await assertSucceeds(
      setDoc(doc(db, 'notifications', 'legit-1'), {
        userId: 'owner-uid',
        type: 'request_received',
        title: 'New viewing request',
        message: 'A tenant requested to view your property.',
        link: '/enquiry',
        isRead: false,
        metadata: { propertyId: 'p-1' },
      })
    );
    log('✅', label, true);
    return true;
  } catch (e) {
    log('❌', label, false);
    console.error('    Error:', e.message);
    return false;
  }
}

// ── Main runner ───────────────────────────────────────────────────────────────
async function run() {
  console.log('\n\x1b[1m🔥 AnyLet – Firestore Security Rules Test Suite\x1b[0m');
  console.log('━'.repeat(58));

  try {
    process.stdout.write('  ⏳  Setting up test environment...\r');
    await setup();
    console.log('  ✅  Test environment ready              ');
    console.log('');

    const results = await Promise.all([
      test1_attackerCannotCreatePaymentIntent(),
      test2_userReadsOwnPaymentIntent(),
      test3_unauthenticatedUserDenied(),
      test4_adminReadsCommissionsAndWithdrawals(),
      test5_notificationAbuseDenied(),
      test6_legitNotificationAllowed(),
    ]);

    const passed = results.filter(Boolean).length;
    const failed = results.length - passed;

    console.log('');
    console.log('━'.repeat(58));
    console.log(`  Results: \x1b[32m${passed} passed\x1b[0m${failed > 0 ? `, \x1b[31m${failed} failed\x1b[0m` : ''} / ${results.length} total`);

    if (failed === 0) {
      console.log('\n  \x1b[32m🎉 All tests passed! Your Firestore rules are secure.\x1b[0m\n');
    } else {
      console.log('\n  \x1b[31m⚠️  Some tests failed. Review your firestore.rules.\x1b[0m\n');
    }
  } catch (err) {
    console.error('\n  \x1b[31m💥 Fatal error during setup:\x1b[0m', err.message);
    console.error('  Make sure the emulator is running on port 9090\n');
    process.exit(1);
  } finally {
    await teardown();
    process.exit(0);
  }
}

run();
