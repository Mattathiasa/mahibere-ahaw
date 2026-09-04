import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// ─── App Check ───────────────────────────────────────────────────────────────
// The homepage suggestion box is the one write path open to people who are not
// approved members (see the `suggestions` block in firestore.rules). The rules
// there cap a submission's shape and size, but rules cannot count requests —
// only App Check can, and without it a script holding the config from this
// bundle can burn the project's daily write quota, which on the Spark plan
// stops writes for EVERY collection, not just this one.
//
// Deliberately opt-in rather than required: with no site key set this is a
// no-op and the app behaves exactly as before, so the feature ships without a
// hard dependency on console configuration. To turn it on, register a
// reCAPTCHA v3 provider for this app in the Firebase console and set
// VITE_FIREBASE_APPCHECK_SITE_KEY. `vercel.json` already allows
// https://www.google.com in script-src and frame-src for it.
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
if (appCheckSiteKey) {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
    });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
// No `storage` export: nothing imported it, uploads go to Cloudinary, and
// initialising an unused SDK only pulled the bucket into the bundle. Its rules
// are now deny-by-default in storage.rules.
export default app;
