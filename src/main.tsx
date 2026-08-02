import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './styles/theme-variables.css'
import './styles/global.css'

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
