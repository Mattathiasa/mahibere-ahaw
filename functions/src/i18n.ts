/**
 * Push notification text.
 *
 * These strings land on a member's phone, so they are the church's most public
 * writing — and they were English, on an app whose default language is Amharic
 * and whose readers overwhelmingly are not English speakers.
 *
 * ## Why Amharic is hardcoded rather than per-reader
 *
 * The announcement and meeting notifications are *topic* sends: one message
 * goes to everyone subscribed to `announcements` or `meetings`, and the
 * function never learns who the recipients are. There is no reader whose
 * language could be looked up. Amharic is therefore the only correct choice —
 * it matches DEFAULT_LANGUAGE in the client and is what nearly every member
 * reads.
 *
 * Making these genuinely per-reader means per-language FCM topics
 * (`announcements_am`, `announcements_en`, …) and a client change to subscribe
 * to the right one on language switch. Worth doing; deliberately not done here,
 * because it is a client/server protocol change rather than a string fix.
 *
 * Token-targeted sends are a different case — `onReportCommentCreated` knows
 * exactly which user it is waking, so it could read a language preference off
 * that user's document. Nothing writes such a preference yet (language lives in
 * localStorage, per device), so it uses the same Amharic text for now.
 */

/** Ge'ez/Ethiopic locale chain, mirroring `localeFor` in the client. */
export const NOTIFICATION_LOCALE = ["am-ET", "am", "en-GB"];

export const NOTIFICATION_STRINGS = {
  /** Fallback title when an announcement has none. */
  announcementTitle: "አዲስ ማስታወቂያ",
  /** Fallback body when an announcement has no content. */
  announcementBody: "አዲስ ማስታወቂያ ተለጥፏል።",

  /** Fallback title when a meeting has none. */
  meetingTitle: "አዲስ ስብሰባ ተይዟል",
  /** Shown when a meeting has no scheduled date yet. */
  meetingDateTbd: "ቀኑ ገና አልተወሰነም",
  /** `{date}` is replaced with the formatted meeting date. */
  meetingBody: "ለ{date} ተይዟል",

  /** Title when someone comments on a report the reader wrote. */
  reportCommentTitle: "በሪፖርትዎ ላይ አዲስ አስተያየት",
  /** Used when the commenter's name is missing. */
  someone: "አንድ ሰው",
} as const;

/** Format a date for a notification body in Amharic. */
export function formatNotificationDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString(NOTIFICATION_LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
