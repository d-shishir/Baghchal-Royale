// This file automatically configures the API host.
//
// - When running on a physical device, it uses your computer's local network IP.
// - When running on an emulator, it uses localhost.

import Constants from 'expo-constants';

const getApiHost = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return 'localhost';
};

const API_HOST = getApiHost();

console.log('🤖 Determined API host:', API_HOST);

export const aPI_URL = `http://${API_HOST}:8000`;
export const WEBSOCKET_URL = `ws://${API_HOST}:8000`; 