import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function AdminResetPassword() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    if (password !== confirm) { setError('كلمتا المرور غير متطابقتين'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError('فشل تحديث كلمة المرور. حاول مرة أخرى.'); return }
    setDone(true)
    setTimeout(() => navigate('/admin', { replace: true }), 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full">
        <div className="text-center mb-6">
          <Logo size={90} className="mx-auto" />
          <h1 className="text-2xl font-bold text-gold mt-3">تعيين كلمة مرور جديدة</h1>
        </div>

        {!ready ? (
          <div className="text-center text-muted text-sm">
            الرجاء فتح هذه الصفحة من الرابط المرسل إلى بريدك الإلكتروني.
          </div>
        ) : done ? (
          <div className="bg-ok/20 border border-ok/50 rounded-lg p-4 text-sm text-center">
            تم تحديث كلمة المرور. جاري التوجيه للوحة التحكم...
          </div>
        ) : (
          <>
            {error && <div className="bg-danger/20 border border-danger/50 rounded-lg p-3 mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">كلمة المرور الجديدة</label>
                <input className="input" type="password" dir="ltr" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div>
                <label className="label">تأكيد كلمة المرور</label>
                <input className="input" type="password" dir="ltr" minLength={8} value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? '...جاري الحفظ' : 'حفظ كلمة المرور'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
