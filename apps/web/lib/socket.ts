import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let chatSocket: Socket | null = null;
let notifSocket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!chatSocket || !chatSocket.connected) {
    chatSocket = io(`${WS_URL}/chat`, {
      auth: { token: getAccessToken() },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return chatSocket;
}

export function getNotificationsSocket(): Socket {
  if (!notifSocket || !notifSocket.connected) {
    notifSocket = io(`${WS_URL}/notifications`, {
      auth: { token: getAccessToken() },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return notifSocket;
}

export function disconnectAll() {
  chatSocket?.disconnect();
  notifSocket?.disconnect();
  chatSocket = null;
  notifSocket = null;
}
