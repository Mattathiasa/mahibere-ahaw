# Mahibere-Ahaw — Development & Production Readiness Report

> **Stack:** React 18 + TypeScript + Vite + Firebase (Auth + Firestore) + TailwindCSS + Vercel  
> **Analyzed:** April 2026

---

## 🔴 CRITICAL BUGS (Fix before any real use)

### 1. `getAuditLogs` Does Not Exist — App Will Crash
`UserManagement.tsx` calls `userService.getAuditLogs(10)`, but that method is **never defined** in `src/services/users.ts`. This throws a runtime TypeError the moment any Memriya-level user loads the User Management page.

**Fix:** Add the method to `userService`:
```ts
// Add to src/services/users.ts
async getAuditLogs(limit: number = 10) {
  return { logs: [] }; // stub; wire up a real 'audit_logs' Firestore collection
},
```

---

### 2. Password Change Is Not Implemented
`authService.changePassword()` in `src/services/auth.ts` always throws:
```ts
throw new Error('Password change requires re-authentication');
```
The Settings page exposes a password-change form that will always fail with no guidance to the user.

**Fix:** Implement `reauthenticateWithCredential` + `updatePassword` from Firebase Auth.

---

### 3. MongoDB ObjectId Validation on Firebase UIDs
`UserManagement.tsx` (line 248) validates `hierarchyEntityId` against a 24-char hex pattern — a MongoDB ID format. Firebase generates alphanumeric UIDs that do NOT match this pattern. Valid Firebase entity IDs are being rejected.

**Fix:** Replace the regex with a simple empty-string check:
```ts
if (!hierarchyEntityId || hierarchyEntityId.trim() === '') {
  toast.error('Hierarchy entity is required.');
  return;
}
```

---

## 🔴 SECURITY VULNERABILITIES

### 4. Real Firebase API Keys in `.env`
Your `.env` file contains live Firebase credentials. Verify it was never committed to git:
```bash
git log --all -- .env
```
If it appears in history, rotate your Firebase API key in the Firebase Console and scrub it with `git filter-repo`.

---

### 5. Firestore Rules: All Member Data Is Publicly Readable
```js
// firestore.rules (current)
match /users/{userId} {
  allow read: if true;  // ← ANY unauthenticated person can read ALL member data
  allow write: if request.auth != null;
}
```
Anyone on the internet can query your full member database without logging in.

**Minimum fix:**
```js
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

### 6. Firestore Rules Have No Role Enforcement
All collections allow **any authenticated user** to write. The role logic in `src/lib/rolePermissions.ts` is **client-side only** and can be bypassed by any logged-in user calling Firestore directly.

**Fix:** Add role checks in Firestore rules for sensitive collections (Finance, Members, UserManagement). At minimum add `request.auth.uid` ownership checks.

---

### 7. Hardcoded Default Password `'password123'`
Both `src/services/users.ts` and `src/services/members.ts` fall back to:
```ts
const password = userData.password || 'password123';
```
Any account created without a password gets a well-known insecure default.

**Fix:** Make `password` required, throw if missing.

---

### 8. Profile Pictures Stored as Base64 in Firestore
`UserManagement.tsx` stores raw base64 image strings directly in Firestore documents (1MB limit). Large images will silently fail or bloat the database.

**Fix:** Upload to Firebase Storage and store only the download URL.

---

## 🟠 DEVELOPMENT READINESS ISSUES

### 9. Two Parallel User Services (Duplicate Code)
- `src/services/users.ts` → `userService`
- `src/services/members.ts` → `memberService`

Both operate on the same `users` Firestore collection. **Consolidate into one service.**

---

### 10. `socket.io-client` Is a Dependency But Never Used
`package.json` includes `"socket.io-client": "^4.8.1"` but there is zero usage in the source. This adds ~100KB+ to the production bundle.

```bash
npm uninstall socket.io-client
```

---

### 11. `axios` API Client Points to `localhost:5000` — Never Used
`src/services/api.ts` creates an axios client targeting `http://localhost:5000` (or the placeholder `https://api.example.com` in production). The app uses Firestore directly; this client is never called.

```bash
npm uninstall axios
```

---

### 12. `mockData.ts` Still Imported in Production Code
`src/lib/rolePermissions.ts` imports `HierarchyLevel` from `mockData.ts`, coupling production code to a file of hardcoded sample data. Move the type to `src/types/index.ts` and delete `mockData.ts`.

---

### 13. `NotFound` Route Silently Redirects to Home
```tsx
<Route path="*" element={<Navigate to="/" replace />} />
```
Fix: Use the existing `NotFound.tsx` page instead.

---

### 14. No React Error Boundaries
An unhandled runtime error (like the `getAuditLogs` crash) blanks the entire app. Add an `ErrorBoundary` wrapping `<BrowserRouter>`.

---

### 15. No TypeScript Strictness — Many `any` Types
Multiple files use `any` for user and mutation types. Add to `tsconfig.app.json`:
```json
{ "compilerOptions": { "strict": true, "noImplicitAny": true } }
```

---

### 16. `console.log` Statements in Production Code
11 `console.log/warn/error` calls exist across the source. Strip them in production via `vite.config.ts`:
```ts
esbuild: { drop: ['console', 'debugger'] }
```

---

### 17. `getAllUsers` Has No Pagination
A full `getDocs(collection(db, 'users'))` with no limit downloads all members on every page load. Add `limit()` + cursor-based pagination.

---

## 🟡 PRODUCTION READINESS ISSUES

### 18. `.env.production` Has a Placeholder API URL
```
VITE_API_URL=https://api.example.com
```
This is never updated. Remove it or point it to a real URL.

---

### 19. Firebase Env Vars Must Be Set in Vercel
Your `.env` file is gitignored and will **not** be auto-deployed. Add all `VITE_FIREBASE_*` variables manually in Vercel → Settings → Environment Variables.

| Variable | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | from Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | `mahibere-ahaw.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `mahibere-ahaw` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `mahibere-ahaw.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `43913101958` |
| `VITE_FIREBASE_APP_ID` | `1:43913101958:web:c09ab05d172b3860294707` |

---

### 20. Firebase Storage Not Initialized
`src/lib/firebase.ts` initializes Auth and Firestore but not Storage. Add:
```ts
import { getStorage } from 'firebase/storage';
export const storage = getStorage(app);
```

---

### 21. Firestore Security Rules May Not Be Deployed
The local `firestore.rules` file may never have been pushed to Firebase. Your live database could have completely different rules.

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

---

### 22. No Firestore Composite Indexes
Queries using `orderBy` + `where` (used in `finance.ts`, `notifications.ts`) require composite indexes. Without them, these queries fail silently in production.

Create `firestore.indexes.json` and run:
```bash
firebase deploy --only firestore:indexes
```

---

### 23. No HTTP Security Headers
Add to `vercel.json`:
```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-XSS-Protection", "value": "1; mode=block" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ]
  }
]
```

---

### 24. No Code Splitting — All 25 Pages Eagerly Imported
All pages are imported at the top of `App.tsx`, even before the user logs in. Use `React.lazy` + `Suspense`:
```tsx
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
```

---

### 25. No Tests
Zero test files exist. For a system managing financial records and member data, add at minimum:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```
Priority: auth flow, role permissions logic, finance calculations.

---

## ✅ PRIORITIZED ACTION CHECKLIST

### 🔴 Fix NOW (Before Any Real Users)
- [ ] Fix `getAuditLogs` crash — add stub method to `userService`
- [ ] Fix Firestore user rules — add `request.auth != null` to the `users` read rule
- [ ] Remove hardcoded `'password123'` — make password required
- [ ] Remove MongoDB ObjectId regex — replace with empty-string check
- [ ] Set Vercel env vars — add all `VITE_FIREBASE_*` keys in Vercel dashboard
- [ ] Deploy Firestore rules — `firebase deploy --only firestore:rules`

### 🟠 Fix Before Beta Launch
- [ ] Implement `changePassword` with Firebase re-authentication
- [ ] Move profile pictures to Firebase Storage (not base64 in Firestore)
- [ ] Remove unused `socket.io-client` and `axios` dependencies
- [ ] Consolidate `memberService` and `userService` into one
- [ ] Move `HierarchyLevel` type to `src/types/index.ts` and delete `mockData.ts`
- [ ] Fix `NotFound` catch-all route to show `<NotFound />` page
- [ ] Add a React Error Boundary wrapping the app
- [ ] Add `esbuild.drop: ['console', 'debugger']` to `vite.config.ts`
- [ ] Add pagination to `getAllUsers`
- [ ] Initialize Firebase Storage in `firebase.ts`

### 🟡 Fix Before Public Launch
- [ ] Add role-based Firestore rules (not just auth-existence checks)
- [ ] Add HTTP security headers to `vercel.json`
- [ ] Implement `React.lazy` code splitting for all 25 page routes
- [ ] Create and deploy `firestore.indexes.json`
- [ ] Check git history: `git log --all -- .env`
- [ ] Enable TypeScript strict mode and eliminate `any` types
- [ ] Add Vitest + React Testing Library and write critical tests
