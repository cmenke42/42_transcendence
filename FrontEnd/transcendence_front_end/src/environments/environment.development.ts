export const environment = {
    production: false,
    wsEndpoint: 'ws://localhost:8000/ws/',
    remoteGameReconnectAttempts: 3,
    remoteGameReconnectIntervalMilliseconds: 12000, //Try reconnecting after timeout from backend
};
