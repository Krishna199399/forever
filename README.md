# ❤️ Her Rhythm ❤️ - Private Wellness Companion

A premium private MERN stack wellness journal and companion built by a boyfriend for his girlfriend. The application is designed to encourage healthy habits, track cycles, log workouts/meals, log sleep waves, and archive beautiful shared memories.

---

## Folder Structure

```text
├── client/                 # React 19 + TypeScript + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── animations/     # Floating background particles
│   │   ├── components/     # Double-bordered Glass Cards, Checkboxes
│   │   ├── pages/          # Home, Journey, Exercise, Meals, Sleep, Memories, Progress, Settings
│   │   ├── routes/         # React Router v7 configuration with Page transitions
│   │   └── styles/         # Global typography and Tailwind directives
│   ├── public/             # PWA manifests, icons, and sw.js caching workers
│   └── package.json
│
├── server/                 # Express.js + Mongoose + MongoDB API backend
│   ├── src/
│   │   ├── config/         # Database and middleware configuration files
│   │   ├── models/         # Mongoose Schemas (detailed logs, recipes, memories)
│   │   └── app.js          # Express app entrypoint, rate-limiters, routers
│   └── package.json
```

---

## Technology Stack

### Frontend
- React 19
- Vite
- TypeScript
- Tailwind CSS v4 (with custom CSS design tokens)
- Framer Motion (Page transitions, polaroid tilts)
- Lucide Icons (premium iconography)
- LocalStorage persistence for checklists and targets

### Backend
- Node.js & Express.js
- MongoDB & Mongoose ORM
- Helmet (HTTP security headers)
- Gzip Compression
- Custom IP rate limiter

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Server Configuration
Create `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:20017/personal_care
NODE_ENV=production
```

Run setup:
```bash
cd server
npm install
npm run dev
```

### 2. Client Configuration
Run setup:
```bash
cd client
npm install
npm run dev
```

The React app will load at `http://localhost:5173`.

## Production VPS Deployment Guide (Without Docker)

Follow these steps to deploy this application to a Linux VPS (e.g. Ubuntu) with **Nginx** serving static assets and proxying API traffic, and **PM2** managing the Node.js server.

### 1. Prerequisites
- Node.js (v18+) and npm installed on VPS.
- Nginx and PM2 installed (`npm install -g pm2`).
- Domain name pointed to the VPS IP address.
- MongoDB Atlas cluster URL.

### 2. Initial Setup
Clone the repository to your web directory (e.g., `/var/www/her-rhythm`):
```bash
git clone <your-repo-url> /var/www/her-rhythm
cd /var/www/her-rhythm
```

### 3. Server Configuration (.env)
Create the backend environment file:
```bash
cp server/.env.example server/.env
nano server/.env
```
Update the values:
- `MONGODB_URI`: Set to your MongoDB Atlas connection string.
- `CORS_ORIGIN`: Set to your frontend domain (e.g., `https://yourdomain.com`).

Start the API server under PM2:
```bash
pm2 start ecosystem.config.cjs --env production
```
Set PM2 to start on system boot:
```bash
pm2 startup
pm2 save
```

### 4. Client Build (.env)
Create the frontend environment file:
```bash
cp client/.env.example client/.env
nano client/.env
```
Update `VITE_API_BASE_URL` to your production API URL (e.g., `https://yourdomain.com`).

Build the frontend static assets:
```bash
cd client
npm install
npm run build
cd ..
```

### 5. Configure Nginx & SSL
Copy the project [nginx.conf](file:///d:/personal%20care/nginx.conf) to your Nginx sites configuration directory:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/her-rhythm
sudo ln -s /etc/nginx/sites-available/her-rhythm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Obtain a free SSL certificate from Let's Encrypt using Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 6. Quick Deployments
For future updates, run the automated deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

## API References
- `GET /api/water` / `POST /api/water` — Logs hydration metrics.
- `GET /api/workout-library` — Searchable movement catalog.
- `GET /api/workout-progress` / `POST /api/workout-progress` — Workout logs.
- `GET /api/meal-library` — PCOS-friendly recipe manager.
- `GET /api/sleep-logs` / `POST /api/sleep-logs` — Bedtime checklists and dream notes.
- `GET /api/cycle-logs` / `POST /api/cycle-logs` — Symptoms and flow trackers.
- `GET /api/memories` / `POST /api/memories` — Scrapbook cards and letters.

---

## Maintenance Guidelines
- Periodically check server memory usage using `pm2 status`.
- Backup data securely by exporting JSON sheets from the **App Settings & Backup** panel.
- Ensure all educational articles carry the medical disclaimer.
