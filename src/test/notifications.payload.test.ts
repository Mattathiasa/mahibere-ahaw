import { describe, it, expect } from 'vitest';

import {
  buildNotification,
  NOTIFICATION_KEYS,
  NOTIFICATION_TITLE_MAX,
  NOTIFICATION_MESSAGE_MAX,
} from '@/services/notifications';

/**
 * Pins the notification payload to firestore.rules.
 *
 * The rules live in a file nothing here compiles against, so a mismatch is
 * silent: `hasOnly()` fails the whole write, and a broadcast is one write per
 * recipient — a stray key does not fail once, it reaches nobody. That is
 * exactly what happened when `link` was removed from the rules while both
 * broadcast paths were still sending it.
 */
describe('notification payload matches the rules whitelist', () => {
  const sender = { senderId: 'u1', senderName: 'Abebe' };

  it('every key it writes is one the rules accept', () => {
    const doc = buildNotification(
      { userId: 'u2', title: 'Notice', message: 'Body', type: 'info' },
      sender,
      '2026-06-01T00:00:00.000Z'
    );
    for (const key of Object.keys(doc)) {
      expect(NOTIFICATION_KEYS).toContain(key);
    }
  });

  it('writes the fields the rules require', () => {
    const doc = buildNotification(
      { userId: 'u2', title: 'Notice', message: 'Body' },
      sender,
      '2026-06-01T00:00:00.000Z'
    );
    expect(doc.senderId).toBe('u1');
    expect(doc.senderName).toBe('Abebe');
    expect(doc.status).toBe('unread');
    // Defaulted rather than left undefined, which Firestore rejects outright.
    expect(doc.type).toBe('info');
  });

  it('never writes a link', () => {
    const doc = buildNotification(
      // Deliberately forced past the type, which is how it would come back.
      { userId: 'u2', title: 'T', message: 'M', link: '/meetings' } as never,
      sender,
      '2026-06-01T00:00:00.000Z'
    );
    expect(doc).not.toHaveProperty('link');
  });

  it('the documented bounds match the rules', () => {
    expect(NOTIFICATION_TITLE_MAX).toBe(200);
    expect(NOTIFICATION_MESSAGE_MAX).toBe(2000);
    expect(NOTIFICATION_KEYS).toHaveLength(8);
  });
});
