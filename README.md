<p align="center">
  <img src="docs/logo.png" alt="AlgoArena logo" width="160" />
</p>

<h1 align="center">AlgoArena</h1>

<p align="center">
  A coding practice platform with real-time 1v1 coding duels.<br/>
  Solve DSA problems in the browser, get judged against hidden test cases in a sandbox, and race a friend to the first accepted solution.
</p>

<p align="center">
  <a href="https://algoarena-codingbattle.vercel.app"><strong>Live demo</strong></a> ·
  <a href="https://algoarena-api.onrender.com/api/health">API health</a>
</p>

---

## Features

**Practice**
- 31 curated problems (easy → hard) with input/output formats, constraints, examples and hidden tests. Every test case is verified against reference solutions.
- Search, difficulty, topic and solved/attempted/unsolved filters with pagination; filter state lives in the URL, so views are shareable.
- Monaco editor with Python, JavaScript, C++, C and Java starter templates; drafts autosave per problem and language in the browser.
- **Run** checks your code against the sample tests; **Submit** judges it against every test. Verdicts: Accepted, Wrong Answer, Runtime Error, Time Limit Exceeded, Compilation Error. Hidden test data is never sent to the browser.
- Per-problem submission history with "load code into editor".

**Practice sets (dynamic, multi-source)**
- Generate a random set of **1–50 problems** by difficulty (**Easy, Medium, Hard, or Mixed**, which splits evenly), one or more **topics**, and **sources**.
- Sources: AlgoArena's own problems (judged here) and **11,000+ Codeforces problems** from the official Codeforces API (links out to codeforces.com, credited as the source).
- Duplicate prevention: problem identity is the source's own id; no two items with the same title in one set; problems from your earlier sets are not repeated (with a clear notice if the pool runs out); already-solved problems are skipped.
- Link a Codeforces handle (verified through the API) to mark Codeforces problems solved or attempted from your real submissions.
- Graceful fallback: the Codeforces list is cached in memory and as a MongoDB snapshot. If Codeforces is unreachable, the cached list is used (with a notice); with no cache, that source is skipped and the rest still works.
- The Problems page can browse **AlgoArena, Codeforces, or all sources** with the same search, difficulty and topic filters.

**Duels (Socket.io)**
- Create a room and share its six-character code or invite link; the lobby of open rooms updates live.
- Both players ready up → 5-second countdown → the same random problem, chosen from ones neither player has duelled on.
- Difficulty-based timer (10/20/30 min), a live scoreboard (tests passed, submissions, judging state, connection state), and a server-authoritative result: first full pass wins, otherwise the most tests passed at time-out, otherwise a draw. Leaving or staying disconnected for 20 s forfeits; a page refresh reconnects you to the same duel.
- Finished duels are stored for history and the leaderboard.

**Progress**
- Dashboard: solved count, current/longest daily streak, acceptance rate, global rank, duel record, difficulty breakdown, a 12-week activity grid, recent submissions and "next up" suggestions. All of it is computed from real submissions.
- Public profiles (`/u/:username`) and a leaderboard ranked by distinct problems solved, then duel wins.

**Accounts**
- Email and password, or **Continue with Google** (Google Identity Services; the ID token is verified on the server).
- Signing in with Google using an email that already has an AlgoArena password account asks for that password once to link them, then keeps all progress. This prevents account pre-hijacking.

**Community**
- Any user can contribute a problem (statement, formats, constraints, topics, languages, visible and hidden tests). It stays pending until an admin approves it in the review queue.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Material UI 5, React Router 7, Monaco Editor, Axios, Socket.io client (Create React App) |
| Backend | Node.js, Express 4, TypeScript, Socket.io 4, JWT auth, bcrypt, Helmet, express-rate-limit |
| Database | MongoDB with Mongoose 8 |
| Code execution | [Judge0](https://judge0.com) (default) or self-hosted Docker sandboxes |
| Testing | Jest, Supertest, mongodb-memory-server, socket.io-client, React Testing Library |
| Deployment | Vercel (frontend), Render (API + WebSockets), MongoDB Atlas |

## Problem sources

| Source | Status | How |
| --- | --- | --- |
| AlgoArena | Integrated, judged here | Curated and community problems with hidden tests |
| Codeforces | Integrated, external | Official API (`problemset.problems`, `user.info`, `user.status`), rate-limited to 1 call per 2 s, cached for 6 h |
| LeetCode | Not integrated | No official public API, and `robots.txt` disallows `/api/` |
| HackerRank | Not integrated | No public problem API |
| CodeChef | Not integrated | The official developer API has been discontinued |

To add a source, implement `ProblemProvider` in `server/src/services/providers/` using the platform's official API and register it in `providers/index.ts`. Problem statements from external sites are never copied; AlgoArena stores only metadata (title, rating, tags, link) with attribution.

## Architecture

```
            ┌───────────────────────────┐      HTTPS (REST)       ┌────────────────────────────┐
 Browser ──▶│ React SPA (Vercel)        │ ───────────────────────▶│ Express API (Render)       │
            │ - Axios API client + JWT  │                         │ - /api/auth, problems,     │
            │ - one shared Socket.io    │ ◀──── WebSocket ───────▶│   submissions, users, duels│
            │   connection for duels    │                         │ - Socket.io DuelManager    │
            └───────────────────────────┘                         └──────┬──────────────┬──────┘
                                                                         │              │
                                                              Mongoose   │              │ HTTPS
                                                                         ▼              ▼
                                                                 ┌──────────────┐ ┌──────────────┐
                                                                 │ MongoDB Atlas│ │ Judge0 sandbox│
                                                                 └──────────────┘ └──────────────┘
```

- **Auth**: passwords are hashed with bcrypt; the API issues a JWT that the client sends as a Bearer token. Socket connections authenticate with the same JWT during the handshake, so duel actions can't be spoofed with another user's id. Admin rights are checked against the database on every admin request.
- **Judging**: `services/execution` defines an `ExecutionProvider` interface. The Judge0 provider sends each test case with CPU/wall/memory limits (interpreted languages get 2–3× time, as on most judges); the Docker provider runs throwaway containers with no network, a read-only filesystem, dropped capabilities, a non-root user, and memory/CPU/PID limits. Outputs are compared after normalising line endings and trailing whitespace. User code never runs inside the API process.
- **Duels**: live rooms are held in memory in `DuelManager` (single API instance); results are written to MongoDB when a duel ends.
- **Stats**: dashboard, profile and leaderboard numbers are MongoDB aggregations over submissions and finished duels, with no stored counters that can drift.

## Getting started

### Prerequisites
- Node.js 18.18+ (tested with Node 22)
- A MongoDB database: local `mongod` or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- Internet access for the default Judge0 code runner (or Docker for the self-hosted runner)

### Installation

```bash
git clone https://github.com/simranshika29/AlgoArena-CodingBattle.git
cd AlgoArena-CodingBattle
npm run install-all
```

### Environment variables

Copy the examples and fill in values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

**Server (`server/.env`)**

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Long random string for signing tokens (≥ 32 chars in production) |
| `JWT_EXPIRES_IN` | no | Token lifetime, default `7d` |
| `PORT` | no | Default `5000` |
| `NODE_ENV` | no | `development` / `production` |
| `CORS_ORIGIN` | yes in prod | Comma-separated allowed frontend origins |
| `EXECUTION_PROVIDER` | no | `judge0` (default), `docker`, or `disabled` |
| `JUDGE0_URL` | no | Default `https://ce.judge0.com` (public, rate-limited) |
| `JUDGE0_API_KEY` | no | RapidAPI key or self-hosted Judge0 auth token |
| `GOOGLE_CLIENT_ID` | no | OAuth Web client id for "Continue with Google"; the button is hidden when unset |
| `CODEFORCES_ENABLED` | no | `true` (default) or `false` |

**Client (`client/.env.local`)**

| Variable | Description |
| --- | --- |
| `REACT_APP_API_URL` | API base URL, e.g. `http://localhost:5000` |
| `REACT_APP_SOCKET_URL` | Optional; defaults to `REACT_APP_API_URL` |

Client variables are compiled into public JavaScript, so never put secrets there.

### Running locally

```bash
npm run seed        # load the curated problem set (safe to re-run; it upserts)
npm run dev         # API on :5000 and React app on :3000
```

To make a registered user an admin (for the review queue):

```bash
npm run make-admin --prefix server -- you@example.com
```

### Tests

```bash
npm test --prefix server   # 48 tests: API, judging, stats, duels, practice sets, providers, Google sign-in
npm test --prefix client -- --watchAll=false
```

## Project structure

```
algoarena/
├── client/                    # React SPA
│   ├── public/                # index.html, icons, manifest
│   └── src/
│       ├── api/               # Axios client + shared API types
│       ├── components/        # Layout, editor, statement, result panel, stats widgets…
│       ├── contexts/          # AuthContext (session), SocketContext (one duel socket)
│       ├── pages/             # Landing, Problems, ProblemDetail, Dashboard, Arena, DuelRoom…
│       ├── utils/             # languages/starter code, formatting
│       └── theme.ts           # MUI theme and design tokens
├── server/                    # Express + Socket.io API
│   └── src/
│       ├── app.ts             # Express app (routes, security middleware)
│       ├── index.ts           # HTTP + Socket.io bootstrap
│       ├── config.ts          # validated environment config
│       ├── duels/             # DuelManager + socket handlers
│       ├── middleware/        # auth, error handling
│       ├── models/            # User, Problem, Submission, Duel
│       ├── routes/            # auth, problems, submissions, users, duels
│       ├── services/          # execution providers (Judge0/Docker), stats
│       ├── seed/              # curated problems, seed + make-admin scripts
│       └── __tests__/         # Jest test suites
├── docs/                      # README assets
└── render.yaml                # Render blueprint for the API
```

## API overview

All endpoints are under `/api`. Errors return `{ "message": string }` with an appropriate status code.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | – | Liveness + database status |
| POST | `/auth/register` | – | Create account → `{ token, user }` |
| POST | `/auth/login` | – | Log in → `{ token, user }` |
| GET | `/auth/me` | user | Current user |
| GET | `/auth/config` | – | Public client settings (Google client id) |
| POST | `/auth/google` | – | Sign in/up with a Google ID token; `409 LINK_REQUIRED` if a password account uses that email |
| POST | `/auth/google/link` | – | Link Google to that account after confirming its password |
| GET | `/problems` | optional | List problems. Query: `source` (`codeforces`, `all`; default AlgoArena only), `search`, `difficulty`, `tag`, `status`, `page`, `limit` |
| GET | `/problems/tags` | – | Available topics |
| GET | `/problems/:id` | optional | Problem statement + sample tests (hidden tests are never returned) |
| POST | `/problems` | user | Contribute a problem (pending review) |
| GET | `/problems/contributions/mine` | user | Your contributed problems and their status |
| GET | `/problems/admin/pending` | admin | Review queue |
| PATCH | `/problems/admin/:id/approve` · `/reject` | admin | Moderate a contribution |
| PUT / DELETE | `/problems/:id` | admin | Edit / delete a problem |
| POST | `/submissions/run` | user | Run code on sample tests (not saved) |
| POST | `/submissions` | user | Judge on all tests and save |
| GET | `/submissions/mine` | user | Your submissions (`problemId`, `limit`) |
| GET | `/submissions/:id` | owner | Submission details including code |
| GET | `/users/me/stats` | user | Dashboard statistics |
| GET | `/users/:username/profile` | – | Public profile + stats |
| GET | `/users/leaderboard` | – | Ranking |
| GET | `/duels/history` | user | Your finished duels |
| GET | `/problem-sets/options` | – | Sources (with live availability), topics, max set size |
| POST | `/problem-sets` | user | Generate a practice set: `difficulty`, `topics`, `count`, `sources`, `excludeSolved`, `avoidRepeats` |
| GET | `/problem-sets`, `/problem-sets/:id` | owner | Your sets with per-problem progress |
| POST | `/problem-sets/:id/sync-codeforces` | owner | Check Codeforces problems against your real submissions |
| DELETE | `/problem-sets/:id` | owner | Delete a set |
| PUT | `/users/me/codeforces` | user | Link or unlink a Codeforces handle (verified via the API) |

**Socket.io events** (authenticated with the JWT in `auth.token`; every event replies via acknowledgement with `{ ok, data | error }`):
`lobby:subscribe`, `duel:active`, `duel:create`, `duel:join {code}`, `duel:ready {code, ready}`, `duel:submit {code, language, source}`, `duel:leave {code}`. The server pushes `duel:update` (room state) and `lobby:rooms`.

Execution endpoints are rate-limited per user (12/min) and auth endpoints per IP (30 per 15 min).

## Screenshots

_Add screenshots to `docs/` and reference them here:_ landing page, problem workspace, dashboard, duel room.

## Deployment

The API needs a long-running process for WebSockets, so it runs on **Render**; the static SPA runs on **Vercel**.

1. **Database**: create a free MongoDB Atlas cluster and a database user, and allow network access from anywhere (`0.0.0.0/0`), since Render's free tier has no static IPs. Copy the connection string.
2. **API on Render**: *New → Blueprint*, select this repository (it reads `render.yaml`). Set `MONGODB_URI` and `CORS_ORIGIN` (your Vercel URL). `JWT_SECRET` is generated automatically. Health check: `/api/health`.
3. **Seed**: run `npm run seed` locally with `MONGODB_URI` pointing at Atlas, or `npm run seed:prod` in the Render shell.
4. **Frontend on Vercel**: import the repository with **Root Directory = `client`** (or run `vercel deploy --prod` from `client/`), and set `REACT_APP_API_URL` to the Render URL (for example `https://algoarena-api.onrender.com`). `client/vercel.json` rewrites all routes to `index.html` so deep links work.
5. Update `CORS_ORIGIN` on Render if the Vercel domain changes.
6. **Continue with Google**: in Google Cloud Console → Google Auth Platform, configure branding (app name, support email, home page, privacy `/privacy` and terms `/terms` links), set the audience to External and publish, then create a **Web application** OAuth client with the Vercel URL (and `http://localhost:3000` for development) as authorized JavaScript origins. No redirect URI or client secret is needed. Put the client id in `GOOGLE_CLIENT_ID` (it is set in `render.yaml`, since client ids are public).

Live deployment: frontend https://algoarena-codingbattle.vercel.app (auto-deploys from `main`), API https://algoarena-api.onrender.com (auto-deploys from `main`), MongoDB Atlas free cluster.

Notes: Render's free tier sleeps after inactivity (the first request can take about 30 s). The public Judge0 CE instance is rate-limited and intended for demos; for real traffic, use a RapidAPI key or self-host Judge0 and set `JUDGE0_URL`/`JUDGE0_API_KEY`.

## Known limitations

- Live duel rooms live in memory, so the API must run as a single instance, and a restart ends in-progress duels. Scaling out would need the Socket.io Redis adapter plus shared room state.
- The default Judge0 instance is a shared public service; judging speed and availability depend on it.
- The Docker execution provider is included for self-hosting, but it is not exercised by the automated tests.
- Tokens are stored in `localStorage`; httpOnly cookies would reduce XSS exposure.

## Future improvements

- Redis-backed duel state for horizontal scaling and restart resilience
- Add more sources as official APIs become available (see Problem sources)
- Custom-input runs ("run with my own stdin")
- Rematch and private best-of-three duels
- Editorials and discussion per problem
- Email verification and password reset

## Author

**Simran Shikha** · [GitHub](https://github.com/simranshika29)

## License

[MIT](LICENSE)
