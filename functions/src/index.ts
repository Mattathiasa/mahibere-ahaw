import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

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

    const title: string = data.title ?? "New Announcement";
    const body: string =
      typeof data.content === "string"
        ? data.content.substring(0, 150)
        : "A new announcement has been posted.";

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

    const title: string = data.title ?? "New Meeting Scheduled";
    const scheduledDate: string = data.scheduledDate
      ? new Date(data.scheduledDate).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Date TBD";

    try {
      await messaging.send({
        topic: "meetings",
        notification: {
          title,
          body: `Scheduled for ${scheduledDate}`,
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
          title: `New feedback on your report`,
          body: `${newComment.authorName ?? "Someone"}: ${
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

// ─── 4. Save FCM token when user logs in ─────────────────────────────────────
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
