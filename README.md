# AlgoArena

A competitive coding platform where users can practice coding problems, participate in coding battles, and improve their algorithmic skills.

## Features

- User authentication (signup/login)
- Practice coding problems with real-time test case results
- Code submission and evaluation
- Future: Coding battles (duels & contests)

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT
- Code Execution: Docker for safe code execution

## Project Structure

```
algoarena/
├── client/             # React frontend
├── server/             # Node.js backend
└── docker/             # Docker configuration for code execution
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```
3. Set up environment variables:
   - Create `.env` files in both client and server directories
   - Add necessary environment variables (see .env.example files)

4. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd ../client
   npm start
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT 