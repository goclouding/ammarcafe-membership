import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('بيانات الدخول غير صحيحة')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full">
        <div className="text-center mb-6">
          <Logo size={90} className="mx-auto" />
          <h1 className="text-2xl font-bold text-gold mt-3">لوحة التحكم</h1>
          <p className="text-muted text-sm mt-1">تسجيل دخول المسؤول</p>
        </div>
        {error && <div className="bg-danger/20 border border-danger/50 rounded-lg p-3 mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input className="input" type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input className="input" type="password" dir="ltr" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? '...جاري الدخول' : 'تسجيل الدخول'}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link to="/admin/forgot-password" className="text-gold text-sm hover:underline">نسيت كلمة المرور؟</Link>
        </div>
      </div>
    </div>
  )
}
