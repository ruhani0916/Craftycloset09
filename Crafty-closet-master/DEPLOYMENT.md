# Deploying Crafty Closet

Stack: **Railway** (backend API) + **Firebase Hosting** (frontend) + a hosted **MySQL** database.

## 1. Database

Provision MySQL (Railway's MySQL plugin, or a free host like Aiven/PlanetScale). Then load the schema:

```bash
mysql -u USER -p -h HOST -P PORT DATABASE_NAME < database/schema.sql
```

Keep the full connection string — you'll set it as `MYSQL_URL`.

## 2. Firebase

1. In the [Firebase Console](https://console.firebase.google.com), use the existing project (`crafty-closet-5dc41`, see `.firebaserc`) or create your own and update `.firebaserc` to match.
2. **Authentication** → enable the sign-in providers you need (Email/Password, Google, etc.).
3. **Project Settings → Service Accounts** → *Generate new private key* → downloads a JSON file. Base64-encode it:
   ```bash
   # macOS/Linux
   base64 -i serviceAccount.json | tr -d '\n'
   # Windows PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes('serviceAccount.json'))
   ```
   This becomes `FIREBASE_SERVICE_ACCOUNT`.
4. **Project Settings → General → Your apps** → copy the web config values (`apiKey`, `authDomain`, etc.) — these become the `VITE_FIREBASE_*` frontend vars.

## 3. Cloudinary + SendGrid (optional but recommended)

- [Cloudinary](https://cloudinary.com/users/register_free) — free tier, used for product image uploads. Grab `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` from the dashboard.
- [SendGrid](https://sendgrid.com) — used for order/confirmation emails. Grab `SENDGRID_API_KEY` and set `MAIL_FROM` to a verified sender address.

Without these the app still runs — image uploads and emails are just skipped (see `backend/config/mailer.js` and `backend/middleware/cloudinaryUpload.js`).

## 4. Backend → Railway

1. Push this repo to GitHub.
2. [Railway](https://railway.app) → **New Project → Deploy from GitHub repo** → select this repo. Railway auto-builds with Nixpacks using `railway.json`.
3. Under the service's **Variables** tab, set:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MYSQL_URL` | your connection string from step 1 |
   | `FIREBASE_SERVICE_ACCOUNT` | base64 string from step 2 |
   | `CLIENT_URL` | your Firebase Hosting URL, e.g. `https://crafty-closet-5dc41.web.app` |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from step 3 |
   | `SENDGRID_API_KEY` / `MAIL_FROM` | from step 3 |

   `PORT` is injected by Railway automatically — don't set it manually.
4. Railway builds with `npm install` and starts with `npm start` (`node server.js`), health-checked at `/api/health` (see `railway.json`).
5. Copy the generated `*.up.railway.app` URL once the deploy is live.

## 5. Frontend → Firebase Hosting

1. In `frontend/`, copy `.env.example` to `.env.production` and fill in:
   - `VITE_API_URL` = `https://<your-railway-app>.up.railway.app/api`
   - the six `VITE_FIREBASE_*` values from step 2
2. Build and deploy:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   npm install -g firebase-tools   # if not already installed
   firebase login
   firebase use crafty-closet-5dc41   # or your project ID
   firebase deploy --only hosting
   ```
3. Your app is live at `https://<project-id>.web.app`.

## 6. Verify

- Hit `https://<railway-url>/api/health` — should return `{"success": true, ...}`.
- Open the Hosting URL, sign up/log in, browse products, add to cart.
- CORS errors in the browser console almost always mean `CLIENT_URL` on Railway doesn't exactly match the Hosting URL (including `https://` and no trailing slash).
