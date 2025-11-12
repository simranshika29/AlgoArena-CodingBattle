# AlgoArena

A competitive coding platform where users can practice coding problems, participate in coding battles (duels), and improve their algorithmic skills.

## Features

- **User Authentication** - Secure signup/login with JWT
- **Problem Practice** - Solve coding problems with multiple test cases
- **Real-time Code Execution** - Submit code and get instant feedback
- **Coding Duels** - Challenge other users in real-time coding battles
- **Problem Submission** - Users can submit their own problems (admin approval required)
- **Portfolio** - Track your progress and statistics
- **Admin Panel** - Review and approve submitted problems

## Tech Stack

- **Frontend**: React 19 with TypeScript, Material-UI
- **Backend**: Node.js with Express, TypeScript
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io for duels
- **Code Execution**: Docker for safe code execution
- **Deployment**: Railway (backend), Vercel (frontend)

## Project Structure

```
algoarena/
├── client/             # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── contexts/   # React contexts (Auth)
│   │   └── config.ts   # Configuration
│   └── package.json
├── server/             # Node.js backend
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── models/     # MongoDB models
│   │   ├── duels/      # Duel management
│   │   └── services/   # Code execution service
│   └── package.json
└── README.md
```

## Local Development Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Docker (for code execution)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/simranshika29/algoarena.git
   cd algoarena
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies (root, server, and client)
   npm run install-all
   
   # Or install separately:
   npm install                    # Root dependencies
   cd server && npm install       # Server dependencies
   cd ../client && npm install    # Client dependencies
   ```

3. **Set up environment variables**

   Create `server/.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/algoarena
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```

   Create `client/.env` file (optional for local development):
   ```env
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   ```

5. **Start the development servers**
   ```bash
   # From root directory - starts both server and client
   npm start
   
   # Or start separately:
   npm run server    # Backend on http://localhost:5000
   npm run client    # Frontend on http://localhost:3000
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Deployment

### Quick Deploy to Railway + Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Steps:**

1. **Deploy Backend to Railway**
   - Connect GitHub repo to Railway
   - Set root directory to `server`
   - Add environment variables
   - Deploy

2. **Deploy Frontend to Vercel**
   - Connect GitHub repo to Vercel
   - Set root directory to `client`
   - Add environment variables (API URL from Railway)
   - Deploy

3. **Configure Environment Variables**

   **Railway (Backend):**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/algoarena
   JWT_SECRET=your-production-jwt-secret
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   PORT=5000
   ```

   **Vercel (Frontend):**
   ```env
   REACT_APP_API_URL=https://your-backend-url.railway.app
   REACT_APP_SOCKET_URL=https://your-backend-url.railway.app
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Problems
- `GET /api/problems` - Get all problems
- `GET /api/problems/:id` - Get problem by ID
- `POST /api/problems` - Submit new problem (requires auth)
- `GET /api/problems/admin/pending` - Get pending problems (admin only)
- `PATCH /api/problems/admin/:id/approve` - Approve problem (admin only)
- `PATCH /api/problems/admin/:id/reject` - Reject problem (admin only)

### Submissions
- `POST /api/submissions` - Submit code for a problem
- `GET /api/submissions` - Get user's submissions

### Duels
- Socket.io events for real-time duels
- `createDuel` - Create a new duel room
- `joinDuel` - Join an existing duel
- `submitCode` - Submit code during duel

## Environment Variables

### Server (.env)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin

### Client (.env)
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_SOCKET_URL` - Socket.io server URL

## Scripts

### Root
- `npm start` - Start both server and client
- `npm run server` - Start server only
- `npm run client` - Start client only
- `npm run install-all` - Install all dependencies

### Server
- `npm run dev` - Start development server
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run populate` - Populate database with sample problems

### Client
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- Material-UI for the UI components
- MongoDB for the database
- Socket.io for real-time features
- Railway and Vercel for hosting
