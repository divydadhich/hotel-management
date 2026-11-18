import { useCallback } from 'react';
import { useSocketContext } from '../context/SocketContext';

const useSocket = () => {
  const { socket, connected } = useSocketContext() || {};

  const joinRoom = useCallback(
    (room) => {
      if (socket && connected) socket.emit(`join:${room}`, room);
    },
    [socket, connected]
  );

  const onEvent = useCallback(
    (event, handler) => {
      if (socket) {
        socket.on(event, handler);
        return () => socket.off(event, handler);
      }
      return () => {};
    },
    [socket]
  );

  const emitEvent = useCallback(
    (event, data) => {
      if (socket && connected) socket.emit(event, data);
    },
    [socket, connected]
  );

  return { socket, connected, joinRoom, onEvent, emitEvent };
};

export default useSocket;
