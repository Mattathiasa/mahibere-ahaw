/**
 * Safely converts any Firestore/date value to a valid JavaScript Date.
 *
 * Handles:
 *  - Firestore Timestamp objects (have .toDate())
 *  - Raw Firestore Timestamp shape { seconds, nanoseconds } (plain object)
 *  - JavaScript Date objects
 *  - ISO string or numeric milliseconds
 *  - null / undefined → returns current date as fallback
 */
export function toDate(value: any): Date {
    let result = new Date(); // Fallback date

    try {
        if (!value) {
            return result;
        }

        // Already a Date
        if (value instanceof Date) {
            result = value;
        }
        // Firestore Timestamp class (has .toDate() method)
        else if (typeof value.toDate === 'function') {
            result = value.toDate();
        }
        // Plain Firestore Timestamp shape { seconds, nanoseconds }
        else if (typeof value === 'object' && typeof value.seconds === 'number') {
            result = new Date(value.seconds * 1000);
        }
        // String or number
        else if (typeof value === 'string' || typeof value === 'number') {
            result = new Date(value);
        }
    } catch (e) {
        // Ignore and fallback
    }

    // Absolute guarantee: if it's an Invalid Date, fallback to current time
    if (isNaN(result.getTime())) {
        return new Date();
    }

    return result;
}
