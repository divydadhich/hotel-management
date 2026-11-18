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
              colorPrimary: '#386b58',
              borderRadius: 10,
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
                background: '#ffffff',
                color: '#344239',
                borderRadius: '12px',
                border: '1px solid #e6e9e3',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 12px 32px rgba(38, 51, 45, 0.12)',
              },
              className: 'app-toast',
              success: {
                iconTheme: { primary: '#386b58', secondary: '#fff' },
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
