import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function AdminForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const redirectTo = `${window.location.origin}/admin/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    setLoading(false)
    if (error) {
      setError('تعذّر إرسال رابط إعادة التعيين. تحقق من البريد.')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full">
        <div className="text-center mb-6">
          <Logo size={90} className="mx-auto" />
          <h1 className="text-2xl font-bold text-gold mt-3">إعادة تعيين كلمة المرور</h1>
          <p className="text-muted text-sm mt-1">أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين</p>
        </div>

        {sent ? (
          <div className="bg-ok/20 border border-ok/50 rounded-lg p-4 text-sm text-center">
            تم إرسال رابط إعادة التعيين إلى بريدك. تحقق من صندوق الوارد.
          </div>
        ) : (
          <>
            {error && <div className="bg-danger/20 border border-danger/50 rounded-lg p-3 mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">البريد الإلكتروني</label>
                <input className="input" type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? '...جاري الإرسال' : 'إرسال رابط إعادة التعيين'}
              </button>
            </form>
          </>
        )}

        <div className="text-center mt-4">
          <Link to="/admin/login" className="text-gold text-sm hover:underline">العودة لتسجيل الدخول</Link>
        </div>
      </div>
    </div>
  )
}
