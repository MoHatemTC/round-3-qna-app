import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router'
import { SessionProvider } from './context/SessionContext'
import { PreferencesProvider } from './context/PreferencesContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <PreferencesProvider>
      <SessionProvider>
        <App />
      </SessionProvider>
    </PreferencesProvider>
  </BrowserRouter>,
)
