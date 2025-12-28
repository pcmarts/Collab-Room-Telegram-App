# Architecture Overview

The Collab Room uses a three-tier architecture connecting Telegram users to a web application backed by PostgreSQL.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TELEGRAM                                        │
│  ┌─────────────┐     ┌─────────────────┐     ┌────────────────────────────┐ │
│  │   User      │────▶│  Telegram Bot   │────▶│   Telegram WebApp          │ │
│  │   (Mobile)  │     │  (@YourBot)     │     │   (Opens in Telegram)      │ │
│  └─────────────┘     └────────┬────────┘     └─────────────┬──────────────┘ │
└───────────────────────────────┼────────────────────────────┼────────────────┘
                                │                            │
                    Bot Commands│               WebApp initData
                    & Callbacks │               (Authentication)
                                │                            │
                                ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           YOUR SERVER                                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Express.js Backend                              │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────────┐ │ │
│  │  │  Bot Handlers   │  │   REST API      │  │  Session Management    │ │ │
│  │  │  /start         │  │   /api/users    │  │  (express-session)     │ │ │
│  │  │  /help          │  │   /api/collabs  │  │                        │ │ │
│  │  │  Callbacks      │  │   /api/requests │  │                        │ │ │
│  │  └─────────────────┘  └─────────────────┘  └────────────────────────┘ │ │
│  │                              │                                         │ │
│  │                              ▼                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                     Storage Layer (Drizzle ORM)                 │  │ │
│  │  │  Type-safe queries • Zod validation • Connection pooling        │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    React Frontend (Vite)                               │ │
│  │  Components • Pages • TanStack Query • Wouter routing                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          POSTGRESQL DATABASE                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   users     │  │  companies  │  │ collaborations│  │    requests      │   │
│  │             │◀─┤             │◀─┤             │◀─┤                  │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────────┘   │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐    │
│  │ marketing_preferences│  │notification_prefs   │  │  referrals       │    │
│  └─────────────────────┘  └─────────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Authentication
```
User opens Telegram → Clicks bot button → WebApp opens
     │
     ▼
WebApp sends initData to backend → Backend validates with Telegram API
     │
     ▼
Session created → User can access protected routes
```

### 2. Collaboration Discovery
```
User browses collaborations → Frontend fetches /api/collaborations
     │
     ▼
Backend queries PostgreSQL → Returns filtered results
     │
     ▼
Frontend renders cards → User can request to collaborate
```

### 3. Collaboration Request
```
User clicks "Request" → POST /api/requests
     │
     ▼
Backend creates request record → Sends Telegram notification to host
     │
     ▼
Host approves/declines → Both parties notified via Telegram
```

## Key Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React + Vite | User interface, runs in Telegram WebApp |
| Backend | Express.js | API endpoints, authentication, business logic |
| Database | PostgreSQL | Persistent storage for all data |
| ORM | Drizzle | Type-safe database queries |
| Bot | node-telegram-bot-api | Commands, notifications, callbacks |
| Auth | Telegram initData | Secure user verification |

## Port Configuration

| Service | Port | Description |
|---------|------|-------------|
| Frontend (dev) | 5000 | Vite dev server |
| Backend | 5000 | Express serves both API and static files |

In production, the Express server serves the built React app from `/dist/public`.
