import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './state/AuthProvider'
import { ToastProvider } from './state/ToastProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* 로그인 상태를 모든 화면에서 쓸 수 있게 앱 전체를 감쌈 */}
      <AuthProvider>
        {/* 어느 화면에서든 토스트를 띄울 수 있게 감쌈 */}
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
