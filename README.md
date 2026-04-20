# PixShard 🔐

> **Secret Image Sharing** — Split any image into cryptographic shares using Shamir's Secret Sharing Scheme. Reconstruct the original only when enough participants combine their shares.

[![Firebase Hosting](https://img.shields.io/badge/Frontend-Firebase%20Hosting-orange?logo=firebase)](https://pixshard.web.app)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-green?logo=mongodb)](https://cloud.mongodb.com)
[![Python](https://img.shields.io/badge/Crypto%20Engine-Python%203-blue?logo=python)](https://python.org)
[![Node.js](https://img.shields.io/badge/API-Node.js%20%2F%20Express-brightgreen?logo=node.js)](https://nodejs.org)

---

## 📐 Project Architecture

```
PixShard/
├── client/                  ← React + Vite (Firebase Hosting)
│   ├── src/
│   │   ├── firebase/        ← Firebase SDK config + error helpers
│   │   ├── context/         ← AuthContext (Firebase Auth)
│   │   ├── pages/           ← Landing, Login, Register, Dashboard,
│   │   │                       Create, ShareCenter, Reconstruct
│   │   ├── components/      ← Navbar, ProjectCard
│   │   └── api/             ← Axios with Firebase ID token
│   └── dist/                ← Production build (deployed to Firebase)
│
├── api/                     ← Node.js / Express (deployed to Railway/Render)
│   ├── routes/              ← authRoutes.js, shareRoutes.js
│   ├── models/              ← Project.js (MongoDB / Mongoose)
│   ├── middleware/          ← authMiddleware.js (Firebase token verify)
│   ├── utils/
│   │   ├── pythonBridge.js  ← child_process.spawn → Python
│   │   └── firebaseAdmin.js ← Firebase Admin SDK init
│   ├── uploads/             ← Multer temp files (git-ignored)
│   ├── images/              ← Generated share .npy files (git-ignored)
│   ├── public_datas/        ← Generated metadata JSON (git-ignored)
│   └── server.js
│
├── logic/                   ← 🐍 Production Python crypto engine
│   ├── encrypt.py           ← Unified CLI: k,n  and  t,k,n schemes
│   └── decrypt.py           ← Unified CLI: reconstruct from shares
│
├── Secret_Sharing_Schemes/  ← 📚 Research & reference implementations
│   ├── 1.a.standard(k,n)_SSS-gray/   ← Original grayscale prototype
│   ├── 1.b.standard(k,n)_SSS-RGB/    ← Original RGB prototype
│   └── 2.essential(t,k,n)_SSS/       ← Original essential SSS prototype
│
├── firebase.json            ← Firebase Hosting config (public: client/dist)
├── .firebaserc              ← Firebase project alias → "pixshard"
└── .gitignore
```

---

## ❓ Why Two Python Folders?

| Folder | Role | Used in production? |
|--------|------|:---:|
| `Secret_Sharing_Schemes/` | **Research prototypes** — the original experimental scripts, one per scheme variant, used to design and validate the algorithms | ❌ No |
| `logic/` | **Production engine** — unified CLI scripts distilled from the research above. The Node.js API calls only these. | ✅ Yes |

> Think of `Secret_Sharing_Schemes/` as a **notebook** and `logic/` as the **final, clean implementation**.  
> The research folder is kept for academic reference and is never executed by the API.

---

## ❓ Why Are `firebase.json` / `.firebaserc` in the Root?

The Firebase CLI **requires** these files to be at the **project root** — it won't find them anywhere else. They tell Firebase:

- **`firebase.json`** → *"deploy the `client/dist/` folder to Firebase Hosting"*
- **`.firebaserc`** → *"this project maps to the `pixshard` Firebase project"*

They live at the root so a single `firebase deploy` command from the project root works without any path flags.

---

## 🌐 How Does Everything Deploy?

PixShard uses a **split deployment** strategy because the Python encryption engine cannot run on Firebase Functions (requires numpy/PIL on the OS level):

```
┌──────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT MAP                           │
├────────────────┬─────────────────────────────────────────────────┤
│  What          │  Where                                          │
├────────────────┼─────────────────────────────────────────────────┤
│ React Client   │ Firebase Hosting  → pixshard.web.app            │
│ Firebase Auth  │ Firebase Auth     → handles login/register      │
│ MongoDB        │ MongoDB Atlas     → pixshard01.l52ufj5.mongodb  │
│ Express API    │ Railway / Render  → your-api.up.railway.app     │
│ Python logic   │ Same server as API (logic/ ships with api/)     │
└────────────────┴─────────────────────────────────────────────────┘
```

### Data Flow

```
Browser (Firebase Hosting)
    │  Firebase Auth — login/register (client-side)
    │  Firebase ID Token  ──────────────────────────────────┐
    │                                                       ▼
    │  POST /api/share/create (multipart image)    Express API (Railway)
    │  ◄──── project JSON ─────────────────────    │  authMiddleware verifies token
    │                                             │  multer saves temp file
    │                                             │  pythonBridge.spawn(encrypt.py)
    │                                             │       ▼
    │                                             │  logic/encrypt.py
    │                                             │  → writes share_*.npy + metadata.json
    │                                             │       ▼
    │                                             │  Project saved to MongoDB Atlas
    │  GET /api/share/download-shares/:id         │
    │  ◄──── shares.zip ───────────────────────── │  streams archiver ZIP
```

---

## 🚀 Deployment Guide

### 1 — Frontend (Firebase Hosting)

```bash
# Login once (opens browser)
firebase login

# Build the React app
cd client
npm run build
cd ..

# Deploy to https://pixshard.web.app
firebase deploy --only hosting
```

### 2 — Backend API (Railway recommended)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select the `api/` sub-directory as **root directory** (`/api`)
3. Set environment variables in Railway dashboard:

```env
PORT=8080
MONGODB_URI=mongodb+srv://...your atlas string...
FIREBASE_PROJECT_ID=pixshard
FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json   # upload file separately
LOGIC_DIR=../logic
```

4. Upload your `serviceAccountKey.json` as a Railway secret file
5. Note your Railway URL (e.g. `https://pixshard-api.up.railway.app`)

### 3 — Connect Frontend to Deployed API

Create `client/.env.production`:
```env
VITE_API_BASE_URL=https://pixshard-api.up.railway.app/api
```

Rebuild and redeploy:
```bash
cd client && npm run build && cd ..
firebase deploy --only hosting
```

---

## 🛠️ Local Development

### Prerequisites
- Node.js ≥ 18
- Python 3.10+ with `numpy` and `pillow`
- MongoDB (local or Atlas)

### Install Python deps
```bash
pip install numpy pillow
```

### Setup
```bash
# Clone
git clone https://github.com/your-username/pixshard.git
cd pixshard

# API
cd api
cp .env.example .env      # fill in your values
npm install
npm run dev               # starts on :5000

# Client (new terminal)
cd client
npm install
npm run dev               # starts on :5173
```

### Environment Variables

**`api/.env`**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/pixshard
FIREBASE_PROJECT_ID=pixshard
FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
LOGIC_DIR=../logic
CLIENT_URL=http://localhost:5173
```

> **Firebase Service Account** — Download from:  
> Firebase Console → Project Settings → Service accounts → Generate new private key  
> Save as `api/serviceAccountKey.json` (already git-ignored)

---

## 🔐 Cryptographic Schemes

### Standard (k, n) — Shamir's Secret Sharing
- Split an image into **n** shares
- Any **k** shares reconstruct the original
- Uses **GF(257)** (prime field), vectorized Lagrange interpolation over RGB pixels
- Example: (3, 5) — any 3 of 5 participants can reconstruct

### Essential (t, k, n) — Essential Secret Sharing
- Split into **n** shares, **t** of which are "essential"
- Reconstruction requires **all t essential** + enough regular shares to reach threshold **k**
- Uses Vandermonde matrix construction over GF(257)
- Example: (2, 3, 5) — both essential participants must be present, plus any 1 of 3 regular

---

## 📡 API Reference

All routes require `Authorization: Bearer <firebase-id-token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/me` | Get current user info |
| `GET` | `/api/share` | List user's projects |
| `POST` | `/api/share/create` | Upload image + encrypt |
| `GET` | `/api/share/:id` | Get single project |
| `GET` | `/api/share/download-shares/:id` | Download shares ZIP |
| `GET` | `/api/share/download-public/:id` | Download public data ZIP |
| `GET` | `/api/share/download-file/:id/:filename` | Download single file |
| `POST` | `/api/share/reconstruct` | Reconstruct image from shares |
| `DELETE` | `/api/share/:id` | Delete project |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS v4 + Framer Motion |
| Auth | Firebase Authentication (email/password) |
| Hosting | Firebase Hosting |
| API | Node.js + Express |
| Database | MongoDB Atlas (Mongoose) |
| File handling | Multer + Archiver |
| Crypto engine | Python 3 + NumPy + Pillow |
| Python bridge | Node.js `child_process.spawn` |

---

## 📁 Generated Files Per Project

When a shard is created, the API generates:

```
api/images/{project-id}/
    share_1.npy   ← participant 1's share (binary NumPy array)
    share_2.npy
    ...
    share_n.npy

api/public_datas/{project-id}/
    metadata.json          ← scheme params (k, n, t, image shape)
    public_b.json          ← public vector b  (essential scheme only)
    matrix_A.npy           ← public matrix A  (essential scheme only)
```

These files are **git-ignored** (can be large) and are served as ZIP downloads from the Share Center.

---

## 🔒 Security Notes

- `.env` and `serviceAccountKey.json` are **git-ignored** — never commit them
- Firebase ID tokens are verified server-side on every request
- Multer temp files are deleted immediately after encryption
- MongoDB Atlas has IP allowlist configured

---

*Built as a cryptography systems project demonstrating Shamir's and Essential Secret Sharing schemes.*
