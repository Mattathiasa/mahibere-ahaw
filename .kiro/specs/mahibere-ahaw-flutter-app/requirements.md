# Requirements Document

## Introduction

This document defines the requirements for the **Mahibere Ahaw Flutter Mobile App** — a native Android and iOS mobile application that mirrors the existing React web app for the Mahibere Ahaw Yekiristos Betekerstian church management system.

The mobile app will connect to the **same Firebase project** (same Firestore database and Firebase Auth) as the web app, so all data is shared in real time between web and mobile users. The app supports both English and Amharic languages, role-based access control across seven hierarchy levels, and covers all major modules of the web app.

The Flutter app is a **new project** that will live alongside the existing React web app in the same repository (or as a sibling folder). It does not modify the web app.

---

## Glossary

- **App**: The Mahibere Ahaw Flutter mobile application.
- **Firebase_Auth**: Firebase Authentication service used for email/password sign-in, shared with the web app.
- **Firestore**: Cloud Firestore database, shared between the web app and the mobile app.
- **Firebase_Storage**: Firebase Cloud Storage for file/document uploads.
- **FCM**: Firebase Cloud Messaging, used for push notifications.
- **HierarchyLevel**: One of seven church organizational levels: `Sinodos`, `KuamiSinodos`, `Memriya`, `Zone`, `Atbiya`, `EnkesekaseMaikel`, `HiyawanMahderat`.
- **Role**: The user's `role` field in Firestore (e.g., `admin`, `user`), used alongside HierarchyLevel for permission checks.
- **Permission_Service**: The in-app service that evaluates a user's HierarchyLevel and role to determine what actions they may perform.
- **Auth_Service**: The in-app service that handles sign-in, sign-out, and session persistence via Firebase_Auth.
- **Member**: A church member record stored in the `users` Firestore collection.
- **Transaction**: A financial record stored in the `finance_transactions` Firestore collection.
- **Budget**: A monthly budget record stored in the `finance_budgets` Firestore collection.
- **Financial_Report**: A financial summary record stored in the `finance_reports` Firestore collection.
- **Announcement**: A record in the `announcements` Firestore collection.
- **Meeting**: A record in the `meetings` Firestore collection.
- **Plan**: A ministry plan record in the `plans` Firestore collection.
- **Report**: A ministry report-back record in the `reports` Firestore collection.
- **Teaching**: A record in the `teachings` Firestore collection.
- **Notification**: A per-user record in the `notifications` Firestore collection.
- **Strategic_Plan**: A record in the `strategic_plans` Firestore collection.
- **Document**: A church document record in the `documents` Firestore collection.
- **ETB**: Ethiopian Birr, the currency used throughout the finance module.
- **EARS**: Easy Approach to Requirements Syntax — the pattern used for all acceptance criteria.

---

## Requirements

---

### Requirement 1: Project Setup and Firebase Shared Backend

**User Story:** As a developer, I want a Flutter project correctly configured to connect to the existing Firebase project, so that the mobile app shares the same Firestore database and Auth as the web app.

#### Acceptance Criteria

1. THE App SHALL include a `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) generated from the **existing** Firebase project, so that no new Firebase project is created.
2. THE App SHALL initialize Firebase using `firebase_core` before any Firestore or Auth calls are made.
3. THE App SHALL use the `cloud_firestore` Flutter package to read and write to the same Firestore collections used by the web app (`users`, `announcements`, `meetings`, `plans`, `reports`, `finance_transactions`, `finance_budgets`, `finance_reports`, `notifications`, `hierarchy`, `teachings`, `documents`, `strategic_plans`, `missionary_applications`, `missionary_reports`).
4. THE App SHALL use the `firebase_auth` Flutter package and authenticate against the same Firebase Auth tenant as the web app.
5. THE App SHALL use the `firebase_storage` Flutter package for file uploads to the same Firebase Storage bucket.
6. THE App SHALL use the `firebase_messaging` Flutter package to receive FCM push notifications.
7. WHEN a document is created or updated in Firestore from the mobile app, THE Firestore SHALL reflect that change immediately in the web app (and vice versa), because both share the same project.
8. THE App SHALL provide a step-by-step `FLUTTER_SETUP.md` guide in the repository root covering: Flutter SDK installation, Firebase CLI setup, `flutterfire configure` usage, dependency installation, and first run instructions.

---

### Requirement 2: Authentication

**User Story:** As a church member, I want to sign in to the mobile app using my existing username or email and password, so that I can access the same account I use on the web.

#### Acceptance Criteria

1. WHEN a user submits a username (non-email) on the login screen, THE Auth_Service SHALL query the `users` Firestore collection for a document where `username == submittedValue` and retrieve the associated email before calling `signInWithEmailAndPassword`.
2. WHEN a user submits an email address directly, THE Auth_Service SHALL call `signInWithEmailAndPassword` with that email without a Firestore lookup.
3. IF the username is not found in Firestore, THEN THE Auth_Service SHALL return an error message "Username not found".
4. IF Firebase_Auth returns `auth/wrong-password` or `auth/user-not-found`, THEN THE Auth_Service SHALL display "Invalid username, email, or password."
5. WHEN authentication succeeds, THE Auth_Service SHALL fetch the user's Firestore document from the `users` collection using the Firebase UID and store the user profile (including `role`, `hierarchyLevel`, `fullName`, `fullNameAmharic`) in local secure storage.
6. WHILE a user session is active, THE App SHALL persist the session across app restarts using Firebase Auth's built-in token persistence.
7. WHEN the user taps "Log Out", THE Auth_Service SHALL call `signOut()` on Firebase_Auth and clear the locally stored user profile.
8. THE Login_Screen SHALL display both an English and Amharic label for the app name ("Mahibere Ahaw" / "ማኅበረ አኀው").

---

### Requirement 3: Role-Based Permissions

**User Story:** As a system administrator, I want the mobile app to enforce the same role-based permissions as the web app, so that users only see and do what their hierarchy level allows.

#### Acceptance Criteria

1. THE Permission_Service SHALL determine permissions based on the authenticated user's `hierarchyLevel` field from Firestore, matching the web app's `rolePermissions` logic exactly.
2. THE Permission_Service SHALL grant `canCreateAnnouncement` only to users with HierarchyLevel in `[Sinodos, KuamiSinodos, Memriya]`.
3. THE Permission_Service SHALL grant `canCreatePlan` only to users with HierarchyLevel in `[Sinodos, KuamiSinodos, Memriya, Zone, Atbiya]`.
4. THE Permission_Service SHALL grant `canCreateReport` only to users with HierarchyLevel in `[Sinodos, KuamiSinodos, Memriya, Zone, Atbiya]`.
5. THE Permission_Service SHALL grant `canViewAllReports` only to users with HierarchyLevel in `[Sinodos, KuamiSinodos]`.
6. THE Permission_Service SHALL grant `canAddMembers` only to users with HierarchyLevel in `[Sinodos, KuamiSinodos, Memriya, Zone, Atbiya, HiyawanMahderat]`.
7. THE Permission_Service SHALL grant `canScheduleMeeting` only to users with HierarchyLevel in `[Sinodos, KuamiSinodos, Memriya]`.
8. THE Permission_Service SHALL grant `canExportData` only to users with HierarchyLevel in `[Sinodos, KuamiSinodos, Memriya]`.
9. THE Permission_Service SHALL return a `dashboardView` of `full` for `[Sinodos, KuamiSinodos]`, `limited` for `[Memriya, Zone, Atbiya]`, and `basic` for all others.
10. WHEN a user without the required permission attempts a restricted action, THE App SHALL display a localized "Access denied" message and not perform the action.

---

### Requirement 4: Navigation and App Shell

**User Story:** As a user, I want a clear and consistent navigation structure on mobile, so that I can easily move between all sections of the app.

#### Acceptance Criteria

1. THE App SHALL use a bottom navigation bar for primary navigation on screens narrower than 600dp, showing icons and labels for: Dashboard, Members, Finance, Announcements, and More.
2. THE App SHALL use a navigation drawer (side menu) accessible from the "More" entry or a hamburger icon, listing all available modules: Dashboard, Members, Finance, Announcements, Meetings, Plans, Reports, Teachings, Strategic Plan, Hierarchy, Missionary, Volunteer, Notifications, User Management, Church Laws, Documents, HigeDenb, Partner Contact, Settings.
3. WHEN a user's Permission_Service returns `dashboardView == basic`, THE App SHALL hide the Finance, User Management, and Hierarchy menu items from the navigation drawer.
4. THE App SHALL display the authenticated user's full name and hierarchy level in the navigation drawer header.
5. THE App SHALL include a notification bell icon in the app bar that shows an unread count badge WHEN there are unread notifications for the current user.
6. THE App SHALL support both light and dark themes, persisting the user's preference in local storage.

---

### Requirement 5: Dashboard

**User Story:** As a church leader, I want a dashboard that shows key statistics and recent activity, so that I can quickly understand the current state of the church.

#### Acceptance Criteria

1. WHEN the Dashboard screen loads, THE App SHALL fetch and display four stat cards: Total Members (count of `users` collection), Active Announcements, Pending Reports, and Upcoming Meetings.
2. THE App SHALL display the authenticated user's profile card at the top of the Dashboard, showing: full name (English and Amharic), hierarchy level, role, phone, and email.
3. THE App SHALL display the three most recent Announcements on the Dashboard with title, description preview, and creation date.
4. THE App SHALL display the three nearest upcoming Meetings on the Dashboard with title and scheduled date.
5. THE App SHALL display the three most recent Reports on the Dashboard with plan name, option, and submission date.
6. WHEN `dashboardView == full`, THE App SHALL show quick-action buttons for: Submit Report, View Members, and Announcements.
7. THE Dashboard SHALL refresh its data automatically every 30 seconds WHILE the screen is visible.
8. IF any Firestore fetch fails, THEN THE App SHALL display a localized error message and a retry button.

---

### Requirement 6: Members Management

**User Story:** As a church administrator, I want to view, add, edit, and search church members on mobile, so that I can manage the congregation from anywhere.

#### Acceptance Criteria

1. THE Members_Screen SHALL fetch all documents from the `users` Firestore collection and display them as a scrollable list of member cards showing: avatar/initials, full name (English), full name (Amharic), hierarchy level, phone, and region/zone.
2. THE Members_Screen SHALL provide a search field that filters members in real time by: full name (English), full name (Amharic), phone, hierarchy level, region, and zone.
3. THE Members_Screen SHALL provide filter controls for gender (`Male`, `Female`, `All`) and hierarchy level (all seven levels plus `All`).
4. THE Members_Screen SHALL provide sort options: by name, by hierarchy, by region, by zone.
5. WHEN a user taps a member card, THE App SHALL display a member detail sheet showing all profile fields: names, phone, email/username, address (region, zone, woreda), gender, date of birth, marital status, children, work/school, church roles, and ministry types.
6. WHEN `canAddMembers` is true, THE Members_Screen SHALL display an "Add Member" button that opens a multi-step member creation form.
7. THE Member_Creation_Form SHALL collect: full name (English and Amharic), username, password, email, phone, gender, date of birth, address (region, zone, woreda), hierarchy level, church roles, ministry types, marital status, and work/school.
8. WHEN the member creation form is submitted, THE App SHALL create a Firebase Auth account using a secondary Firebase app instance and then write the user document to the `users` Firestore collection, matching the web app's `userService.createUser` logic.
9. WHEN `canAddMembers` is true, THE Members_Screen SHALL allow editing an existing member's profile fields (excluding password) by updating the `users` Firestore document.
10. IF a Firestore write fails during member creation or update, THEN THE App SHALL display a localized error message and not close the form.

---

### Requirement 7: Finance Module

**User Story:** As a church treasurer, I want to manage transactions, budgets, and financial reports on mobile, so that I can track the church's finances at any time.

#### Acceptance Criteria

1. THE Finance_Screen SHALL display four summary cards: Total Income, Total Expenses, Remainder (Income − Expenses), and Total Tithes, calculated from all documents in `finance_transactions`.
2. THE Finance_Screen SHALL use tabs to separate: Transactions, Monthly Budgets, and Financial Reports.
3. THE Transactions_Tab SHALL list all documents from `finance_transactions` ordered by `createdAt` descending, showing: description, type badge, date, and amount (with `+` for income types and `−` for expenses, in ETB).
4. THE App SHALL classify the following transaction types as income: `Income`, `Tithe`, `Offering`, `Donation`, `Collection`, `Asrat`, `YefikirSetota`, `Deposit`; and `Expense` as expense.
5. WHEN the user taps "Add Transaction", THE App SHALL open a form to create a new document in `finance_transactions` with fields: type (dropdown), amount, description, date, and category.
6. THE Budgets_Tab SHALL list all documents from `finance_budgets` ordered by `createdAt` descending, showing: month/year, planned income, actual income (computed from transactions), variance, planned expenses, actual expenses, remainder, and status badge.
7. WHEN the user taps "Create Budget", THE App SHALL open a form to create a new document in `finance_budgets` with fields: month, year, planned income, planned expenses, and status.
8. THE Reports_Tab SHALL list all documents from `finance_reports` ordered by `createdAt` descending, showing: title, Amharic title, report type, date range, total income, total expenses, and remainder.
9. WHEN the user taps "Generate Report", THE App SHALL open a form to create a new document in `finance_reports` with fields: title, Amharic title, report type, start date, end date, total income, total expenses, total tithes, total offerings, remainder, and recipient info.
10. IF a Firestore write to any finance collection fails, THEN THE App SHALL display a localized error message and preserve the form data.

---

### Requirement 8: Announcements

**User Story:** As a church member, I want to read announcements and (if authorized) create new ones, so that I stay informed about church activities.

#### Acceptance Criteria

1. THE Announcements_Screen SHALL fetch all documents from the `announcements` Firestore collection ordered by `createdAt` descending and display them as cards with: title, content preview, priority badge, and creation date.
2. WHEN `canCreateAnnouncement` is true, THE Announcements_Screen SHALL display a "New Announcement" button.
3. WHEN the user taps "New Announcement", THE App SHALL open a form with fields: title, content, priority (`High`, `Medium`, `Low`), and optional expiry date, and write the result to the `announcements` collection.
4. WHEN a user taps an announcement card, THE App SHALL display the full announcement content in a detail view.
5. WHEN `canCreateAnnouncement` is true, THE App SHALL allow editing and deleting announcements from the detail view.

---

### Requirement 9: Meetings

**User Story:** As a church leader, I want to schedule and view meetings on mobile, so that I can coordinate leadership gatherings.

#### Acceptance Criteria

1. THE Meetings_Screen SHALL fetch all documents from the `meetings` Firestore collection ordered by `scheduledDate` ascending and display them in two sections: Upcoming and Past.
2. WHEN `canScheduleMeeting` is true, THE Meetings_Screen SHALL display a "Schedule Meeting" button.
3. WHEN the user taps "Schedule Meeting", THE App SHALL open a form with fields: title, description, and scheduled date/time, and write the result to the `meetings` collection.
4. WHEN a user taps a meeting card, THE App SHALL display the full meeting details.
5. WHEN `canScheduleMeeting` is true, THE App SHALL allow editing and deleting meetings.

---

### Requirement 10: Plans

**User Story:** As a ministry leader, I want to create and track ministry plans on mobile, so that I can manage the church's strategic activities.

#### Acceptance Criteria

1. THE Plans_Screen SHALL fetch all documents from the `plans` Firestore collection ordered by `createdAt` descending and display them as cards with: name, timeframe badge, details preview, and creation date.
2. THE Plans_Screen SHALL provide filter tabs for timeframe: Weekly, Monthly, Annually, and All.
3. WHEN `canCreatePlan` is true, THE Plans_Screen SHALL display a "New Plan" button.
4. WHEN the user taps "New Plan", THE App SHALL open a form with fields: plan name, timeframe (`Weekly`, `Monthly`, `Annually`), and details, and write the result to the `plans` collection.
5. WHEN a user taps a plan card, THE App SHALL display the full plan details and any existing comments.
6. THE App SHALL allow any authenticated user to add a comment to a plan by appending to the `comments` array field in the plan document.

---

### Requirement 11: Reports (Report Backs)

**User Story:** As a ministry worker, I want to submit report backs against plans on mobile, so that I can document the work done.

#### Acceptance Criteria

1. THE Reports_Screen SHALL fetch all documents from the `reports` Firestore collection ordered by `createdAt` descending and display them as cards with: plan name, option badge, timeframe, submission date, and status.
2. WHEN `canCreateReport` is true, THE Reports_Screen SHALL display a "New Report" button.
3. WHEN the user taps "New Report", THE App SHALL open a form with fields: select plan (from `plans` collection), option (`Memriya`, `Kifil`, `Zerf`), timeframe, work done, result, and optional attachments.
4. WHEN the report form is submitted, THE App SHALL write a new document to the `reports` collection with `status: submitted`, `submittedAt`, and `createdAt` fields.
5. WHEN a user taps a report card, THE App SHALL display the full report details and allow adding a comment.

---

### Requirement 12: Teachings

**User Story:** As a church member, I want to browse and read teachings and articles on mobile, so that I can access spiritual content.

#### Acceptance Criteria

1. THE Teachings_Screen SHALL fetch all documents from the `teachings` Firestore collection ordered by `createdAt` descending and display them as cards with: title, speaker, service type badge, status badge, and date.
2. WHEN a user taps a teaching card, THE App SHALL display the full teaching content.
3. WHEN the user has admin-level permissions (`Sinodos` or `KuamiSinodos`), THE App SHALL display a "New Teaching" button that opens a creation form with fields: title, speaker, content, service type, and status.

---

### Requirement 13: Notifications

**User Story:** As a user, I want to receive and manage in-app notifications on mobile, so that I am alerted to important church events.

#### Acceptance Criteria

1. THE Notifications_Screen SHALL fetch all documents from the `notifications` Firestore collection where `userId == currentUser.id`, ordered by `createdAt` descending.
2. THE App SHALL display each notification with: title, message, type icon, read/unread status, and creation date.
3. WHEN a user taps a notification, THE App SHALL mark it as read by updating `status` to `read` in Firestore.
4. THE App SHALL provide a "Mark All Read" action that updates all unread notifications for the current user to `status: read` using a Firestore batch write.
5. THE App SHALL provide a delete action on each notification that removes the document from Firestore.
6. WHEN the App receives an FCM push notification WHILE in the background or terminated, THE App SHALL display a system notification and increment the unread badge count.
7. WHEN the App is in the foreground and receives an FCM message, THE App SHALL display an in-app banner notification.

---

### Requirement 14: Hierarchy

**User Story:** As a church administrator, I want to view the organizational hierarchy on mobile, so that I can understand the church's structure.

#### Acceptance Criteria

1. THE Hierarchy_Screen SHALL fetch all documents from the `hierarchy` Firestore collection and display them in a tree or list structure grouped by level: Sinodos → KuamiSinodos → Memriya → Zone → Atbiya → EnkesekaseMaikel → HiyawanMahderat.
2. WHEN `canViewHierarchy` is true, THE Hierarchy_Screen SHALL be accessible from the navigation drawer.
3. WHEN `canViewHierarchy` is false, THE App SHALL hide the Hierarchy menu item and redirect to the Dashboard if the route is accessed directly.

---

### Requirement 15: Strategic Plan

**User Story:** As a senior leader, I want to view and manage the church's strategic plan on mobile, so that I can track long-term goals.

#### Acceptance Criteria

1. THE Strategic_Plan_Screen SHALL fetch all documents from the `strategic_plans` Firestore collection and display them with: title, target year, current value, target value, and progress percentage.
2. WHEN `canCreatePlan` is true, THE Strategic_Plan_Screen SHALL display a button to create a new strategic plan entry.
3. THE App SHALL display a progress indicator (e.g., linear progress bar) for each strategic plan item showing `current / target` as a percentage.

---

### Requirement 16: Documents (Memriya Documents)

**User Story:** As a church administrator, I want to access and upload official church documents on mobile, so that important files are always available.

#### Acceptance Criteria

1. THE Documents_Screen SHALL fetch all documents from the `documents` Firestore collection and display them as a list with: title, file type icon, upload date, and uploader name.
2. THE Documents_Screen SHALL provide a search field that filters documents by title in real time.
3. WHEN the user has `canExportData` permission, THE Documents_Screen SHALL display an "Upload Document" button.
4. WHEN the user taps "Upload Document", THE App SHALL allow selecting a file from the device, upload it to Firebase_Storage, and write a metadata document to the `documents` Firestore collection.
5. WHEN a user taps a document, THE App SHALL open the file URL in the device's default browser or file viewer.

---

### Requirement 17: Settings

**User Story:** As a user, I want to manage my profile, language, theme, and password in the Settings screen, so that I can personalize my experience.

#### Acceptance Criteria

1. THE Settings_Screen SHALL display tabs for: Profile, Notifications, Appearance, Language, and Security.
2. THE Profile_Tab SHALL display the current user's editable fields: full name (English and Amharic), phone, and work/school, and save changes to the `users` Firestore document on submit.
3. THE Language_Tab SHALL allow switching between English and Amharic, persisting the selection in local storage and applying it immediately to all UI strings.
4. THE Appearance_Tab SHALL allow switching between light and dark theme, persisting the selection in local storage.
5. THE Security_Tab SHALL provide a "Change Password" form with fields: current password, new password, and confirm new password.
6. WHEN the Change Password form is submitted, THE Auth_Service SHALL re-authenticate the user with the current password using `reauthenticateWithCredential` before calling `updatePassword`.
7. IF the current password is incorrect during re-authentication, THEN THE Auth_Service SHALL display "Current password is incorrect."
8. IF the new password is fewer than 6 characters, THEN THE Auth_Service SHALL display "New password must be at least 6 characters long."

---

### Requirement 18: Internationalization (i18n)

**User Story:** As an Amharic-speaking user, I want the entire app UI to be available in Amharic, so that I can use the app in my native language.

#### Acceptance Criteria

1. THE App SHALL support two locales: English (`en`) and Amharic (`am`).
2. THE App SHALL provide translations for all UI strings matching the keys defined in the web app's `translations.ts` file (both `en` and `am` maps).
3. WHEN the user changes the language in Settings, THE App SHALL immediately re-render all visible UI strings in the selected language without requiring a restart.
4. THE App SHALL default to English on first launch.
5. THE App SHALL persist the selected language across app restarts using local storage.
6. THE App SHALL use the Amharic-compatible font (e.g., Noto Sans Ethiopic) for all Amharic text rendering.

---

### Requirement 19: Offline Support and Data Caching

**User Story:** As a user in an area with poor connectivity, I want the app to show cached data when offline, so that I can still access important information.

#### Acceptance Criteria

1. THE App SHALL enable Firestore offline persistence so that previously fetched data is available WHILE the device has no internet connection.
2. WHILE offline, THE App SHALL display a visible "Offline" indicator banner at the top of the screen.
3. WHILE offline, THE App SHALL allow read operations from the local Firestore cache.
4. WHILE offline, THE App SHALL queue write operations (create/update) and sync them to Firestore automatically WHEN connectivity is restored.
5. IF a write operation fails to sync after connectivity is restored, THEN THE App SHALL notify the user with a localized error message.

---

### Requirement 20: Additional Modules (Missionary, Volunteer, Church Laws, HigeDenb, Partner Contact)

**User Story:** As a church member, I want access to all remaining modules from the web app on mobile, so that the mobile app is feature-complete.

#### Acceptance Criteria

1. THE Missionary_Screen SHALL fetch documents from `missionary_applications` and `missionary_reports` Firestore collections and display them in separate tabs.
2. THE Volunteer_Screen SHALL display volunteer opportunities and allow authenticated users to express interest.
3. THE Church_Laws_Screen SHALL display church law documents fetched from Firestore or a static local data source.
4. THE HigeDenb_Screen SHALL display the church's governance guidelines, fetched from Firestore or a static local data source.
5. THE Partner_Contact_Screen SHALL display partner organization contact information with name, phone, and description.
6. THE User_Management_Screen SHALL be accessible only to users with `role == admin` or HierarchyLevel in `[Sinodos, KuamiSinodos]`, and SHALL list all users with options to update their role and hierarchy level.
