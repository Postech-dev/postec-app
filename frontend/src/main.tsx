import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import PlanoProvider from './components/PlanoProvider/PlanoProvider'
import Toast from './components/Toast/Toast'
import './index.css'
import App from './App.tsx'
import { iniciarDemo } from './utils/demo'

// lê ?demo=1 antes de qualquer navegação
iniciarDemo()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PlanoProvider>
        <Toast>
          <App />
        </Toast>
      </PlanoProvider>
    </BrowserRouter>
  </StrictMode>,
)
