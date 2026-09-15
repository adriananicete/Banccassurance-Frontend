import { io } from 'socket.io-client'

import { API_ORIGIN } from '@/lib/apiClient'

/**
 * The chat socket -- socket.io v4, the same major as the server (a mismatched
 * client fails the handshake with no useful error). One connection for the
 * whole app.
 *
 * The handshake authenticates with the auth_token cookie, so `withCredentials`
 * is the whole of the auth. The server refuses the three roles with no chat,
 * which is why the app only connects for the other six.
 *
 * The socket is DELIVERY, NOT TRUTH (BACKEND.md §11): it only tells the app to
 * refetch. If it never connects, messages still send and load over HTTP.
 */
let socket = null

export function connectMessagesSocket() {
  if (!socket) {
    socket = io(API_ORIGIN, {
      path: '/socket.io',
      withCredentials: true,
      // Reconnects on its own; a refused handshake just stays quiet.
      reconnectionDelayMax: 30_000,
    })
  }
  return socket
}

/** On sign-out, so the next account does not inherit the connection. */
export function disconnectMessagesSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
