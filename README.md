# NoteNexus - Clean Architecture

A modern note-taking application with separated frontend and backend.

## 🏗️ Structure

```
NoteNexus/
├── client/          # Frontend (React + TypeScript + Vite)
├── server/          # Backend (Node.js + Express + TypeScript)
├── shared/          # Shared types and schemas
└── package.json     # Workspace configuration
```

## 🚀 Quick Start

### Install Dependencies
```bash
npm run install:all
```

### Development
```bash
# Run both frontend and backend
npm run dev

# Run separately
npm run dev:frontend
npm run dev:backend
```

### Build
```bash
# Build both
npm run build

# Build separately
npm run build:frontend
npm run build:backend
```

## 🌐 Ports
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## 📦 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Render)
```bash
cd server
npm run build
npm run start:prod
```

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## 🎯 Features
- ✅ Clean Architecture
- ✅ Separated Dependencies
- ✅ Independent Deployment
- ✅ TypeScript Support
- ✅ Modern UI Components
