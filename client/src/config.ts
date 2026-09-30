const apiBaseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

const config = {
  apiBaseUrl,
  // Socket.io is served by the same backend unless configured otherwise.
  socketUrl: (process.env.REACT_APP_SOCKET_URL || apiBaseUrl).replace(/\/+$/, ''),
};

export default config;
