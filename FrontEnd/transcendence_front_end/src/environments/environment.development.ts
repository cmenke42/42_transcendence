export const environment = {
    production: false,
    wsEndpoint: 'wss://localhost:6010/ws/',
    remoteGameReconnectAttempts: 3,
    remoteGameReconnectIntervalMilliseconds: 12000, //Try reconnecting after timeout from backend
};
