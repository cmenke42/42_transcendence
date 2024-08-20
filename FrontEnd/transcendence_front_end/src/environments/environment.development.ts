
export const environment = {
    production: false,
    //wsEndpoint: 'wss://localhost:6010/ws/',

    remoteGameReconnectAttempts: 3,
    remoteGameReconnectIntervalMilliseconds: 12000, //Try reconnecting after timeout from backend
// These lines added by script:

  Backend_IP: '10.11.15.1',
  wsEndpoint: `wss://10.11.15.1:6010/ws/`,
};
