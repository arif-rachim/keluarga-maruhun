import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { I18nProvider } from './i18n/i18n.jsx'
import { AccessProvider } from './access/useAccess.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <AccessProvider>
        <App />
      </AccessProvider>
    </I18nProvider>
  </React.StrictMode>,
)
