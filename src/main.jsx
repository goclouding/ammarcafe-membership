import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Cairo, sans-serif' }}>
          <div style={{ maxWidth: 600, background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.5)', color: '#f5e9d7', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>حدث خطأ غير متوقع</h1>
            <p style={{ fontSize: 14, marginBottom: 12 }}>Unexpected error — check the browser console for details.</p>
            <pre style={{ fontSize: 12, textAlign: 'left', direction: 'ltr', whiteSpace: 'pre-wrap', opacity: 0.8 }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  )
} catch (err) {
  document.getElementById('root').innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Cairo,sans-serif;"><div style="max-width:600px;background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.5);color:#f5e9d7;border-radius:12px;padding:24px;text-align:center;"><h1 style="font-size:20px;font-weight:700;margin-bottom:8px;">فشل تحميل التطبيق</h1><p style="font-size:14px;">Bootstrap error: ' +
    String(err?.message || err).replace(/</g, '&lt;') +
    '</p></div></div>'
}
