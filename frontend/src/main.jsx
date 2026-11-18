import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ConfigProvider } from 'antd';
import store from './store/index';
import { injectStore } from './services/api';
import App from './App';
import './styles/globals.css';

// Inject redux store reference into axios interceptors
injectStore(store);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#6366f1',
              borderRadius: 12,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            },
          }}
        >
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                borderRadius: '16px',
                border: '1px solid #1e293b',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
