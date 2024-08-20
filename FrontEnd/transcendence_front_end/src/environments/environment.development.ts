
export const environment = {
    production: false,

    remoteGameReconnectAttempts: 3,
    remoteGameReconnectIntervalMilliseconds: 12000, //Try reconnecting after timeout from backend

  HOST_IP: '10.12.8.8',
  wsEndpoint: `wss://10.12.8.8:6010/ws/`,
};
