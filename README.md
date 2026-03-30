# Pulse - Video Upload, Sensitivity Processing & Streaming Platform

A full-stack application for uploading videos, processing them for content sensitivity analysis, and streaming with real-time progress tracking.

## Architecture Overview

```
pulse-full-stack/
├── backend/                  # Node.js + Express API
│   └── src/
│       ├── config/           # DB connection, env config, socket setup
│       ├── controllers/      # Route handlers (auth, video)
│       ├── middleware/        # Auth, upload, error handling
│       ├── models/           # Mongoose schemas (User, Video)
│       ├── routes/           # API route definitions
│       ├── services/         # Video processing pipeline
│       ├── utils/            # JWT token helpers
│       └── server.js         # Express + Socket.io entry point
├── frontend/                 # React + Vite SPA
│   └── src/
│       ├── components/       # Layout, ProtectedRoute
│       ├── context/          # AuthContext (global auth state)
│       ├── lib/              # API client, socket client
│       └── pages/            # Dashboard, Videos, Upload, Admin, etc.
└── README.md
```

## Tech Stack

| Layer      | Technology                                                   |
| ---------- | ------------------------------------------------------------ |
| Backend    | Node.js, Express.js, MongoDB (Mongoose), Socket.io           |
| Frontend   | React 19, Vite, Tailwind CSS v4, React Router v7             |
| Auth       | JWT (Bearer tokens), bcrypt password hashing                 |
| Real-time  | Socket.io for processing progress updates                    |
| Upload     | Multer with disk storage                                     |
| Streaming  | HTTP Range Requests                                          |
| Processing | FFmpeg (metadata/thumbnails), simulated sensitivity analysis |

## Prerequisites

- **Node.js** v18+ (LTS recommended)
- **MongoDB** running locally or MongoDB Atlas connection string
- **FFmpeg** (optional, for video metadata extraction and thumbnails)

## Setup & Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd pulse-full-stack
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env    # Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev             # Starts on http://localhost:5001
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev             # Starts on http://localhost:5173
```

## Environment Variables

### Backend (`backend/.env`)

| Variable         | Description                   | Default                                 |
| ---------------- | ----------------------------- | --------------------------------------- |
| `PORT`           | Server port                   | `5001`                                  |
| `MONGODB_URI`    | MongoDB connection string     | `mongodb://localhost:27017/pulse-video` |
| `JWT_SECRET`     | Secret for signing JWT tokens | (change in production)                  |
| `JWT_EXPIRES_IN` | Token expiry duration         | `7d`                                    |
| `UPLOAD_DIR`     | Directory for uploaded videos | `uploads`                               |
| `MAX_FILE_SIZE`  | Max upload size in bytes      | `524288000` (500MB)                     |
| `CORS_ORIGIN`    | Allowed frontend origin       | `http://localhost:5173`                 |

### Frontend (`frontend/.env`)

| Variable          | Description          | Default                 |
| ----------------- | -------------------- | ----------------------- |
| `VITE_API_URL`    | Backend API base URL | `/api`                  |
| `VITE_SOCKET_URL` | Socket.io server URL | `http://localhost:5001` |

## API Documentation

### Authentication

| Method | Endpoint                   | Description       | Auth Required |
| ------ | -------------------------- | ----------------- | ------------- |
| POST   | `/api/auth/register`       | Register new user | No            |
| POST   | `/api/auth/login`          | Login             | No            |
| GET    | `/api/auth/me`             | Get current user  | Yes           |
| GET    | `/api/auth/users`          | List org users    | Admin         |
| PATCH  | `/api/auth/users/:id/role` | Update user role  | Admin         |

### Videos

| Method | Endpoint                 | Description             | Auth Required |
| ------ | ------------------------ | ----------------------- | ------------- |
| POST   | `/api/videos`            | Upload video            | Editor/Admin  |
| GET    | `/api/videos`            | List videos (paginated) | Yes           |
| GET    | `/api/videos/stats`      | Get video statistics    | Yes           |
| GET    | `/api/videos/:id`        | Get video details       | Yes           |
| GET    | `/api/videos/:id/stream` | Stream video            | Yes           |
| PATCH  | `/api/videos/:id`        | Update video metadata   | Editor/Admin  |
| DELETE | `/api/videos/:id`        | Delete video            | Editor/Admin  |

### Query Parameters (GET `/api/videos`)

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `search` - Search by title
- `status` - Filter: `uploading`, `processing`, `completed`, `failed`
- `sensitivityStatus` - Filter: `pending`, `safe`, `flagged`
- `category` - Filter by category
- `sortBy` - Sort field (default: `createdAt`)
- `order` - Sort order: `asc` or `desc`

## User Roles (RBAC)

| Role   | Permissions                                          |
| ------ | ---------------------------------------------------- |
| Viewer | View own videos, stream content                      |
| Editor | Upload, edit, delete own videos + viewer permissions |
| Admin  | Full access: manage all videos, manage users & roles |

## Features

- **Video Upload** with drag-and-drop, progress tracking, file validation
- **Sensitivity Analysis** pipeline with real-time progress via Socket.io
- **Video Streaming** with HTTP Range Request support for seek/scrub
- **Multi-tenant Isolation** - users only see content from their organization
- **Role-Based Access Control** - Viewer, Editor, Admin roles
- **Admin Panel** with user management and role assignment
- **Responsive UI** built with Tailwind CSS
- **Filtering & Search** by title, safety status, processing status, category

## Design Decisions & Assumptions

1. **Simulated Sensitivity Analysis**: The sensitivity analysis pipeline simulates processing stages with realistic timing. In production, this would integrate with an ML service (e.g., AWS Rekognition, Google Video Intelligence).

2. **Local File Storage**: Videos are stored on disk in the `uploads/` directory. For production, swap to S3/GCS using the storage abstraction.

3. **Organization-based Tenancy**: Users belong to an organization for data isolation. Default organization is "default".

4. **FFmpeg Optional**: The app gracefully handles missing FFmpeg — metadata extraction and thumbnail generation are skipped if unavailable.

5. **Token in Query String**: Video streaming uses a query-string token since `<video>` elements cannot set custom headers.

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT-based stateless authentication
- Rate limiting on API endpoints (200 req/15min)
- Helmet security headers
- Input validation on all endpoints
- File type validation (video MIME types only)
- Organization-scoped data access
- CORS restricted to configured origin
