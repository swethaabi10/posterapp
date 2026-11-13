# 💍 Poster App — Jewelry Gold Rate Poster Creator

A full-stack web application that lets jewelry shop owners create, download, and share daily gold & silver rate promotional posters.

---

## 🚀 Features

- ✅ JWT Authentication (Register / Login / Logout)
- 🏪 Shop Profile with logo, phone, WhatsApp number
- 📅 Auto-generated daily templates with default rates
- ✏️ Live Poster Editor with real-time preview
- ⬇️ Download poster as PNG (html2canvas)
- 📋 Poster History saved to MongoDB
- 📱 WhatsApp share with pre-filled rate message
- 🎨 Elegant dark navy + gold jewelry theme

---

## 📁 Project Structure

```
poster_app/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── api/           # Axios instance
│   │   ├── components/    # Reusable components
│   │   ├── context/       # AuthContext
│   │   ├── pages/         # Route pages
│   │   └── ...
│   └── package.json
├── server/          # Node.js + Express backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── package.json
├── .gitignore
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB Atlas** account (free tier works great)

---

## 🛠️ Setup Instructions

### 1. Clone / open the project

```bash
cd poster_app
```

### 2. Set up the Server

```bash
cd server
npm install
```

Copy the example env file and fill in your values:

```bash
copy .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/posterapp?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=30d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Set up the Client

```bash
cd ../client
npm install
```

Copy the example env file:

```bash
copy .env.example .env
```

The default client `.env` is:

```env
VITE_API_URL=http://localhost:5000/api
```

> Since Vite has a proxy configured, you can leave this as-is for local development.

---

## ▶️ Running the App

### Start the Server (Terminal 1)

```bash
cd server
npm run dev
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🚀 Server running in development mode on port 5000
```

### Start the Client (Terminal 2)

```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🌐 API Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/user/profile` | Get user profile | 🔒 |
| PUT | `/api/user/profile` | Update profile | 🔒 |
| GET | `/api/templates/today` | Get today's template | 🔒 |
| GET | `/api/templates/:id` | Get template by ID | 🔒 |
| POST | `/api/templates/generate` | Create/update template | 🔒 |
| POST | `/api/posters/save` | Save poster to history | 🔒 |
| GET | `/api/posters/history` | Get poster history | 🔒 |

---

## 🗄️ MongoDB Atlas Setup

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Create a database user with username & password
4. Whitelist your IP (or use `0.0.0.0/0` for dev)
5. Get the connection string from **Connect → Drivers**
6. Paste it into `server/.env` as `MONGODB_URI`

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Routing | react-router-dom v6 |
| HTTP | Axios |
| Styling | Vanilla CSS (custom design system) |
| Image Export | html2canvas |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |

---

## 📸 Pages

- **`/login`** — Sign in
- **`/register`** — Create account
- **`/dashboard`** — Today's rates + poster preview + quick actions
- **`/editor`** — Edit rates, live preview, download PNG, share WhatsApp
- **`/profile`** — Manage shop details and logo
- **`/history`** — All previously generated posters

---

## 💡 Tips

- Run the server and client in **separate terminal windows**
- The Vite dev server proxies `/api` calls to `:5000` automatically
- After downloading a poster, it auto-saves to your history
- WhatsApp share uses `wa.me` format with your shop's WhatsApp number
