import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/theme-variables.css'
import './styles/global.css'

// 移除 StrictMode 以避免双重执行（开发环境下会导致脚本执行两次）
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)

