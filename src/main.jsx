import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111d32',
            color: '#e2e8f4',
            border: '1px solid #1e2f4a',
            borderRadius: '10px',
            fontFamily: 'Sora, sans-serif',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#111d32' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#111d32' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
