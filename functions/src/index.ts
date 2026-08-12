import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  NOTIFICATION_STRINGS as S,
  formatNotificationDate,
} from "./i18n";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ─── 1. Announcement push notification ───────────────────────────────────────
// Fires whenever a new document is created in the `announcements` collection.
// Sends a push notification to all devices subscribed to the "announcements" topic.

export const onAnnouncementCreated = functions.firestore
  .document("announcements/{announcementId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return;

    const title: string = data.title ?? S.announcementTitle;
    const body: string =
      typeof data.content === "string"
        ? data.content.substring(0, 150)
        : S.announcementBody;

    try {
      const response = await messaging.send({
        topic: "announcements",
        notification: {
          title,
          body,
        },
        data: {
          announcementId: context.params.announcementId,
          type: "announcement",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          priority: "high",
          notification: {
            channelId: "announcements_channel",
            priority: "high",
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      });

      functions.logger.info(
        `Announcement notification sent: ${response}`,
        {announcementId: context.params.announcementId}
      );
    } catch (error) {
      functions.logger.error("Error sending announcement notification:", error);
    }
  });

// ─── 2. Meeting reminder notification ────────────────────────────────────────
// Fires when a new meeting is created.
// Sends a push notification to the "meetings" topic.

export const onMeetingCreated = functions.firestore
  .document("meetings/{meetingId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return;

    const title: string = data.title ?? S.meetingTitle;
    const scheduledDate: string = data.scheduledDate
      ? formatNotificationDate(data.scheduledDate)
      : S.meetingDateTbd;

    try {
      await messaging.send({
        topic: "meetings",
        notification: {
          title,
          body: S.meetingBody.replace("{date}", scheduledDate),
        },
        data: {
          meetingId: context.params.meetingId,
          type: "meeting",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          priority: "high",
          notification: {
            channelId: "announcements_channel",
            priority: "high",
          },
        },
      });

      functions.logger.info(
        `Meeting notification sent for: ${context.params.meetingId}`
      );
    } catch (error) {
      functions.logger.error("Error sending meeting notification:", error);
    }
  });

// ─── 3. Report comment notification ──────────────────────────────────────────
// Fires when a report document is updated (comment added).
// Notifies the report author.

export const onReportCommented = functions.firestore
  .document("reports/{reportId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) return;

    const beforeComments: unknown[] = before.comments ?? [];
    const afterComments: unknown[] = after.comments ?? [];

    // Only proceed if a new comment was added
    if (afterComments.length <= beforeComments.length) return;

    const newComment = afterComments[afterComments.length - 1] as {
      authorName?: string;
      content?: string;
    };
    const authorId: string | undefined = after.authorId;

    if (!authorId) return;

    // Get the report author's FCM token from their user document
    try {
      const userDoc = await db.collection("users").doc(authorId).get();
      const fcmToken: string | undefined = userDoc.data()?.fcmToken;

      if (!fcmToken) {
        functions.logger.info(
          `No FCM token for user ${authorId}, skipping notification`
        );
        return;
      }

      await messaging.send({
        token: fcmToken,
        notification: {
          title: S.reportCommentTitle,
          body: `${newComment.authorName ?? S.someone}: ${
            newComment.content?.substring(0, 100) ?? ""
          }`,
        },
        data: {
          reportId: context.params.reportId,
          type: "report_comment",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          priority: "high",
          notification: {
            channelId: "announcements_channel",
          },
        },
      });

      functions.logger.info(
        `Report comment notification sent to user ${authorId}`
      );
    } catch (error) {
      functions.logger.error(
        "Error sending report comment notification:",
        error
      );
    }
  });

// ─── 4. Resolve a username to its sign-in address ────────────────────────────
// Sign-in by username has to turn a typed name into an email address BEFORE
// there is an account to authorise, which is why `usernames/{username}` is
// world-readable in firestore.rules. That was defensible while the rows held
// only the synthetic @mahibereahaw.local address. It stopped being defensible
// once repairUsernameMapping began writing members' REAL email addresses there
// — anyone could probe names and harvest personal addresses, which is exactly
// what sendPasswordReset refuses to allow by never distinguishing
// auth/user-not-found.
//
// This does the lookup with the Admin SDK so the client does not need read
// access. Once this is DEPLOYED, `usernames` can become `allow get: if
// isAdmin()` in firestore.rules; the web client falls back to the direct read
// until then, so the two can be deployed in either order.
//
// Deliberately unauthenticated — a caller has no account yet. Protections:
//   - one exact document lookup, so it reveals nothing a guess did not already
//     contain, and cannot enumerate;
//   - App Check enforced when the project has App Check configured, which is the
//     real answer to automated probing;
//   - a coarse per-instance throttle as a speed bump. It is per-instance and
//     therefore easily outrun across a scaled-out deployment — it is not the
//     boundary, App Check is.

const RESOLVE_WINDOW_MS = 60_000;
const RESOLVE_MAX_PER_WINDOW = 30;
const resolveHits = new Map<string, {count: number; resetAt: number}>();

function throttled(key: string): boolean {
  const now = Date.now();
  const hit = resolveHits.get(key);
  if (!hit || now > hit.resetAt) {
    resolveHits.set(key, {count: 1, resetAt: now + RESOLVE_WINDOW_MS});
    return false;
  }
  hit.count += 1;
  return hit.count > RESOLVE_MAX_PER_WINDOW;
}

export const resolveLoginEmail = functions.https.onCall(async (data, context) => {
  // `context.app` is populated only when the caller sent a valid App Check
  // token. Undefined means either App Check is not configured for the project or
  // the token was missing, and those are indistinguishable here — so this
  // rejects only when App Check is switched on via config, keeping the function
  // usable before that happens.
  if (functions.config().appcheck?.required === "true" && !context.app) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "App Check token required"
    );
  }

  const raw = typeof data?.username === "string" ? data.username : "";
  const username = raw.trim().toLowerCase();

  // Same shape the sign-up form and changeUsername accept. Rejecting anything
  // else keeps this from being used as a general document reader.
  if (!/^[a-z0-9._-]{3,64}$/.test(username)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Not a valid username"
    );
  }

  if (throttled(context.rawRequest?.ip ?? "unknown")) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      "Too many lookups. Please wait a moment."
    );
  }

  const snap = await db.collection("usernames").doc(username).get();
  const email = snap.exists ? (snap.data()?.email as string | undefined) : undefined;

  // A miss returns null rather than an error, and the caller falls back to the
  // deterministic synthetic address. Saying "no such user" here would rebuild
  // the enumeration oracle this function exists to remove.
  return {email: email ?? null};
});

// ─── 5. Save FCM token when user logs in ─────────────────────────────────────
// Called from the mobile app to store the device's FCM token in Firestore.
// This enables direct (token-based) notifications to specific users.

export const saveFcmToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated"
    );
  }

  const token: string = data.token;
  if (!token) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "FCM token is required"
    );
  }

  await db.collection("users").doc(context.auth.uid).update({
    fcmToken: token,
    fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {success: true};
});
