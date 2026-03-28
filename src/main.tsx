import { errorLogService } from '@services/firebase/error-log-service';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (event) => {
  void errorLogService.capture({
    message: event.message || 'Unhandled error',
    stack: event.error?.stack,
    context: 'window.error',
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason as Error | string | undefined;
  void errorLogService.capture({
    message: typeof reason === 'string' ? reason : reason?.message || 'Unhandled promise rejection',
    stack: typeof reason === 'string' ? undefined : reason?.stack,
    context: 'window.unhandledrejection',
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
