// Configuration for different environments
const config = {
  // API Base URL - use environment variable or fallback to localhost
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  
  // Socket.io URL - use environment variable or fallback to localhost
  socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
  
  // Environment
  isProduction: process.env.NODE_ENV === 'production',
  
  // App Name
  appName: 'AlgoArena',
  
  // Version
  version: '1.0.0'
};

export default config; 