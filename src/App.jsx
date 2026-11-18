import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { fetchCurrentUser } from './store/slices/authSlice';
import AppRoutes from './routes/index';
import { FullPageSpinner } from './components/common/Spinner';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  const dispatch = useDispatch();
  const { isLoading, accessToken } = useSelector((state) => state.auth);

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, accessToken]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SocketProvider>
          {isLoading ? <FullPageSpinner /> : <AppRoutes />}
        </SocketProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
