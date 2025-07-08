const sockets = new Map();

// Default message handler that logs and returns parsed data
function defaultOnMessage(event) {
  const rawData = event.data;
  const parsed = parseJSON(rawData);
  console.log('[WebSocket] Message:', parsed);
  return parsed;
}

// Default error handler
function defaultOnError(event) {
  console.error('[WebSocket] Error:', event);
}

// Safe JSON parser
function parseJSON(data) {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

export function connectWebSocket(id, url, { 
  onOpen,
  onMessage = defaultOnMessage, 
  onClose, 
  onError = defaultOnError
} = {}) {
  if (sockets.has(id)) {
    const existing = sockets.get(id);
    if (existing.readyState !== WebSocket.CLOSED && existing.readyState !== WebSocket.CLOSING) {
        console.warn(`WebSocket with ID "${id}" already exists.`);
        return existing;
    }
  }

  const socket = new WebSocket(url);

  if (onOpen) socket.addEventListener('open', onOpen);
  if (onClose) socket.addEventListener('close', onClose);
  socket.addEventListener('message', onMessage);
  socket.addEventListener('error', onError);

  socket.sendMessage = (data) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.warn(`WebSocket "${id}" is not open.`);
    }
  };

  socket.closeSocket = () => {
    socket.close();
    sockets.delete(id);
  };

  sockets.set(id, socket);
  return socket;
}

export function getSocket(id) {
  return sockets.get(id);
}

export function isConnected(id) {
  const socket = sockets.get(id);
  return socket?.readyState === WebSocket.OPEN;
}

export function closeSocket(id) {
  const socket = sockets.get(id);
  if (socket) {
    socket.close();
    sockets.delete(id);
  }
}

export function closeAllSockets() {
  for (const [id, socket] of sockets.entries()) {
    socket.close();
    sockets.delete(id);
  }
}
