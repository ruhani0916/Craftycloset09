# Crafty Closet

A full-stack e-commerce app for handmade/craft goods — product catalog, cart, wishlist, orders, ratings, and an admin dashboard.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS, Firebase Auth, React Router
- **Backend:** Node.js + Express, MySQL (`mysql2`), Firebase Admin SDK (token verification), Cloudinary (images), SendGrid (email)
- **Database:** MySQL — `users`, `products`, `cart`, `wishlist`, `orders`, `order_items`, `ratings`

## Project structure

```
backend/     Express API (controllers, routes, middleware, MySQL config)
frontend/    React + Vite SPA
database/    schema.sql — run this to create all tables
```

## Local setup

### 1. Database

```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env    # fill in your local DB + Firebase + Cloudinary + SendGrid values
npm install
npm run dev              # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env     # fill in Firebase web config; leave VITE_API_URL unset for local dev
npm install
npm run dev               # http://localhost:5173, proxies /api → localhost:5000
```

### Tests (backend)

```bash
cd backend
npm test
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide — Railway (backend) + Firebase Hosting (frontend).

## Admin access

`backend/scripts/promote-admin.js` promotes an existing user (by email) to the `admin` role directly in the database — run it after signing up your first account.
