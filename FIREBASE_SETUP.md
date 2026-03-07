# Firebase Configuration Guide

This guide will help you set up Firebase for the Mahibere Ahaw project and resolve the `invalid-api-key` error.

## Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or select an existing one).
3. Follow the prompts to create your project. Google Analytics is optional but recommended.

## Step 2: Register your Web App
1. On the Project Overview page, click the **Web icon** (`</>`) to add an app.
2. Enter an App nickname (e.g., `mahibere-ahaw-web`).
3. Click **Register app**.
4. You will see a `firebaseConfig` object. **Keep this open**; you'll need these values for your `.env` file.

## Step 3: Configure Environment Variables
1. Open your local project.
2. Ensure you have a `.env` file in the root directory.
3. Map the values from the `firebaseConfig` in the console to the `.env` file like this:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY_HERE
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

## Step 4: Enable Authentication
1. In the Firebase Sidebar, go to **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Add new provider**.
4. Select **Email/Password** and click **Enable**, then **Save**.

## Step 5: Setup Cloud Firestore (Database)
The project expects a `users` collection for roles and profile data.
1. Go to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Select a location and start in **Test mode** (for initial development).
4. Create a collection named `users`.
5. Add a document with an ID matching your Auth User UID with fields like:
   - `role`: "admin"
   - `firstName`: "YourName"

## Step 6: Restart the App
After updating the `.env` file, you **must** stop and restart your development server:
```bash
# Press Ctrl+C in your terminal, then:
npm run dev
```
