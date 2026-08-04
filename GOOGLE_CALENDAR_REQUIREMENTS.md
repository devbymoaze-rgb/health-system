# Google Calendar Integration Requirements

To integrate Google Calendar into your project, you need to set up a project in the Google Cloud Console and obtain the following credentials:

## 1. Google Cloud Project Setup
- Go to the [Google Cloud Console](https://console.cloud.google.com/).
- Create a new project named `CRM-Eye` (or any name you prefer).
- In the sidebar, go to **APIs & Services** > **Library**.
- Search for **Google Calendar API** and click **Enable**.

## 2. OAuth Consent Screen
- Go to **APIs & Services** > **OAuth consent screen**.
- Select **External** and click **Create**.
- Fill in the required app information (App name, User support email, Developer contact info).
- Add the scope: `https://www.googleapis.com/auth/calendar.events`.
- **CRITICAL STEP (Fixes 403 Access Denied):** 
  - Under the **Test users** section, click **+ ADD USERS**.
  - Add the Gmail address you will use to log in (e.g., your personal or business Gmail).
  - Without this, Google will block your access because the app is not "Verified".

## 3. Credentials
- Go to **APIs & Services** > **Credentials**.
- Click **Create Credentials** > **OAuth 2.0 Client ID**.
- Select **Web application** as the Application type.
- Add **Authorized Redirect URIs**:
  - `http://localhost:3000/api/auth/google/callback`
- Click **Create** and copy your **Client ID** and **Client Secret**.

## 4. Environment Variables
Add the following to your `.env.local` file:
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## 5. Next Steps
Once these are set up, the system will be able to:
- Authenticate users via Google.
- Sync booked appointments from WhatsApp directly to your Google Calendar.
- Show your Google Calendar events in the CRM dashboard.
