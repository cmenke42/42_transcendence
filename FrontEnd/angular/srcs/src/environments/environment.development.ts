
export const environment = {
    production: false,

    remoteGameReconnectAttempts: 3,
    remoteGameReconnectIntervalMilliseconds: 12000, //Try reconnecting after timeout from backend


  HOST_IP: 'localhost',
  wsEndpoint: `wss://localhost:6010/ws/`,
};
