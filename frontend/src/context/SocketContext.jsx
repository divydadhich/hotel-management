import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { SOCKET_URL } from '../utils/constants';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      socketRef.current = io(SOCKET_URL, {
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
      });

      socketRef.current.on('connect', () => {
        setConnected(true);
        if (user.tenantId) {
          socketRef.current.emit('join:tenant', user.tenantId);
          if (user.role === 'kitchen') {
            socketRef.current.emit('join:kitchen', user.tenantId);
          }
        }
      });

      socketRef.current.on('disconnect', () => {
        setConnected(false);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setConnected(false);
        }
      };
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
export default SocketContext;
