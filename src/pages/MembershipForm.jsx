import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

function DobPicker({ value, onChange }) {
  const parts = value ? value.split('-') : ['', '', '']
  const [y, setY] = useState(parts[0] || '')
  const [m, setM] = useState(parts[1] ? String(Number(parts[1])) : '')
  const [d, setD] = useState(parts[2] ? String(Number(parts[2])) : '')

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  const daysInMonth = (yy, mm) => {
    if (!yy || !mm) return 31
    return new Date(Number(yy), Number(mm), 0).getDate()
  }
  const maxDay = daysInMonth(y, m)
  const days = Array.from({ length: maxDay }, (_, i) => i + 1)

  useEffect(() => {
    if (d && m && y) {
      const cap = daysInMonth(y, m)
      const dayNum = Math.min(Number(d), cap)
      onChange(`${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`)
    } else {
      onChange('')
    }
  }, [d, m, y])

  useEffect(() => {
    if (d && Number(d) > maxDay) setD(String(maxDay))
  }, [maxDay])

  return (
    <div className="grid grid-cols-3 gap-2">
      <select className="input" value={d} onChange={(e) => setD(e.target.value)}>
        <option value="">اليوم</option>
        {days.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <select className="input" value={m} onChange={(e) => setM(e.target.value)}>
        <option value="">الشهر</option>
        {MONTHS_AR.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
      </select>
      <select className="input" value={y} onChange={(e) => setY(e.target.value)}>
        <option value="">السنة</option>
        {years.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  )
}

const initial = {
  full_name: '',
  date_of_birth: '',
  email: '',
  mobile_number: '',
  city: '',
  employer: '',
  job_title: '',
  invited_by_member: '',
  inviter_name: '',
  linkedin_url: '',
  instagram_url: '',
  agree_terms: false,
  profile_photo: null,
}

const STEPS = [
  'ملف التعريف الخاص بك',
  'معلومات التواصل المهني والاجتماعي',
  'لائحة العضوية',
]

function validateStep(step, v) {
  const e = {}
  if (step === 0) {
    if (!v.full_name.trim()) e.full_name = 'الاسم مطلوب'
    if (!v.date_of_birth) e.date_of_birth = 'تاريخ الميلاد مطلوب'
    if (!v.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'بريد إلكتروني غير صالح'
    if (!v.mobile_number.trim() || !/^[0-9+\s\-()]{6,}$/.test(v.mobile_number)) e.mobile_number = 'رقم جوال غير صالح'
    if (!v.city.trim()) e.city = 'مدينة الإقامة مطلوبة'
  }
  if (step === 1) {
    if (!v.employer.trim()) e.employer = 'جهة العمل مطلوبة'
    if (!v.job_title.trim()) e.job_title = 'المسمى الوظيفي مطلوب'
    if (!['yes', 'no'].includes(v.invited_by_member)) e.invited_by_member = 'هذا الحقل مطلوب'
    if (v.invited_by_member === 'yes' && !v.inviter_name.trim()) e.inviter_name = 'اسم العضو مطلوب'
    if (v.linkedin_url && !/^https?:\/\//.test(v.linkedin_url)) e.linkedin_url = 'رابط غير صالح'
    if (v.instagram_url && !/^https?:\/\//.test(v.instagram_url)) e.instagram_url = 'رابط غير صالح'
  }
  if (step === 2) {
    if (!v.agree_terms) e.agree_terms = 'يجب الموافقة على الشروط والأحكام'
    if (!v.profile_photo) e.profile_photo = 'الصورة الشخصية مطلوبة'
  }
  return e
}

function ageFromDob(dob) {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export default function MembershipForm() {
  const [step, setStep] = useState(0)
  const [v, setV] = useState(initial)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const navigate = useNavigate()

  const set = (name) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setV(s => ({ ...s, [name]: value }))
  }

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrors(s => ({ ...s, profile_photo: 'الحد الأقصى 5MB' }))
      return
    }
    setErrors(s => { const { profile_photo, ...rest } = s; return rest })
    setV(s => ({ ...s, profile_photo: file }))
  }

  const photoPreview = useMemo(
    () => (v.profile_photo ? URL.createObjectURL(v.profile_photo) : null),
    [v.profile_photo]
  )

  const finalStepComplete = v.agree_terms && !!v.profile_photo

  function next() {
    const errs = validateStep(step, v)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setStep(s => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function prev() {
    setErrors({})
    setStep(s => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    const errs = { ...validateStep(0, v), ...validateStep(1, v), ...validateStep(2, v) }
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      const ext = (v.profile_photo.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const up = await supabase.storage.from('profile-photos').upload(path, v.profile_photo, {
        cacheControl: '3600',
        upsert: false,
        contentType: v.profile_photo.type || undefined,
      })
      if (up.error) {
        up.error.message = `[STORAGE UPLOAD] ${up.error.message}`
        throw up.error
      }
      const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(path)

      const { error } = await supabase.from('membership_applications').insert({
        full_name: v.full_name.trim(),
        date_of_birth: v.date_of_birth,
        age: ageFromDob(v.date_of_birth),
        city: v.city.trim(),
        email: v.email.trim().toLowerCase(),
        mobile_number: v.mobile_number.trim(),
        linkedin_url: v.linkedin_url.trim() || null,
        instagram_url: v.instagram_url.trim() || null,
        employer: v.employer.trim(),
        job_title: v.job_title.trim(),
        invited_by_member: v.invited_by_member === 'yes',
        inviter_name: v.invited_by_member === 'yes' ? v.inviter_name.trim() : null,
        agreed_terms: true,
        profile_photo_url: pub.publicUrl,
        status: 'pending',
      })
      if (error) {
        error.message = `[DB INSERT] ${error.message}`
        throw error
      }
      navigate(`/success?name=${encodeURIComponent(v.full_name.trim())}`)
    } catch (err) {
      console.error(err)
      const msg = err?.message || err?.error_description || 'خطأ غير معروف'
      setServerError(`حدث خطأ أثناء إرسال الطلب: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  const Err = ({ name }) => errors[name] ? <p className="text-danger text-sm mt-1">{errors[name]}</p> : null

  return (
    <div className="min-h-screen flex flex-col">
      <header className="pt-10 pb-6 text-center">
        <Logo size={140} className="mx-auto" />
        <h1 className="text-3xl md:text-4xl font-bold text-gold mt-4">عضوية VIP Lounge</h1>
        <p className="text-muted mt-1">الضيافة الخاصة</p>
        <div className="mx-auto mt-4 h-px w-24 bg-gold/60" />
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pb-12">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-start">
            {STEPS.map((label, i) => (
              <Fragment key={label}>
                <div className="flex flex-col items-center shrink-0 w-32">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
                    i < step ? 'bg-gold text-black border-gold' :
                    i === step ? 'bg-gold/20 text-gold border-gold' :
                    'bg-white/5 text-muted border-white/10'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <div className={`mt-2 text-xs text-center ${i === step ? 'text-gold' : 'text-muted'}`}>{label}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 mt-[18px] mx-2 ${i < step ? 'bg-gold' : 'bg-white/10'}`} />
                )}
              </Fragment>
            ))}
          </div>
          <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-l from-gold to-golddark transition-all"
                 style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {serverError && (
          <div className="bg-danger/20 border border-danger/50 text-cream rounded-lg p-4 mb-4">{serverError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {step === 0 && (
            <section className="glass-card">
              <h2 className="section-title">{STEPS[0]}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">الاسم</label>
                  <input className="input" type="text" maxLength={100} value={v.full_name} onChange={set('full_name')} />
                  <Err name="full_name" />
                </div>
                <div>
                  <label className="label">تاريخ الميلاد</label>
                  <DobPicker value={v.date_of_birth} onChange={(val) => setV(s => ({ ...s, date_of_birth: val }))} />
                  <Err name="date_of_birth" />
                </div>
                <div>
                  <label className="label">الايميل</label>
                  <input className="input" type="email" dir="ltr" maxLength={150} value={v.email} onChange={set('email')} />
                  <Err name="email" />
                </div>
                <div>
                  <label className="label">رقم الجوال</label>
                  <input className="input" type="tel" dir="ltr" maxLength={20} value={v.mobile_number} onChange={set('mobile_number')} />
                  <Err name="mobile_number" />
                </div>
                <div className="md:col-span-2">
                  <label className="label">مدينة الاقامة</label>
                  <input className="input" type="text" maxLength={100} value={v.city} onChange={set('city')} />
                  <Err name="city" />
                </div>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="glass-card">
              <h2 className="section-title">{STEPS[1]}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">المنظمة / جهة العمل</label>
                  <input className="input" type="text" maxLength={150} value={v.employer} onChange={set('employer')} />
                  <Err name="employer" />
                </div>
                <div>
                  <label className="label">المسمّى الوظيفي</label>
                  <input className="input" type="text" maxLength={150} value={v.job_title} onChange={set('job_title')} />
                  <Err name="job_title" />
                </div>
                <div className="md:col-span-2">
                  <label className="label">هل تلقيت دعوة الانضمام من أحد الأعضاء؟</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="invited_by_member" value="yes" checked={v.invited_by_member === 'yes'} onChange={set('invited_by_member')} />
                      <span>نعم</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="invited_by_member" value="no" checked={v.invited_by_member === 'no'} onChange={set('invited_by_member')} />
                      <span>لا</span>
                    </label>
                  </div>
                  <Err name="invited_by_member" />
                </div>
                {v.invited_by_member === 'yes' && (
                  <div className="md:col-span-2">
                    <label className="label">اسم العضو الذي دعاك</label>
                    <input className="input" type="text" maxLength={100} value={v.inviter_name} onChange={set('inviter_name')} />
                    <Err name="inviter_name" />
                  </div>
                )}
                <div>
                  <label className="label">رابط ملف LinkedIn <span className="text-muted font-normal">(اختياري)</span></label>
                  <input className="input" type="url" dir="ltr" maxLength={255} value={v.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/..." />
                  <Err name="linkedin_url" />
                </div>
                <div>
                  <label className="label">رابط صفحة Instagram <span className="text-muted font-normal">(اختياري)</span></label>
                  <input className="input" type="url" dir="ltr" maxLength={255} value={v.instagram_url} onChange={set('instagram_url')} placeholder="https://instagram.com/..." />
                  <Err name="instagram_url" />
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="glass-card">
              <h2 className="section-title">لائحة العضوية للصالة الخاصّة - مقهى عمّار</h2>
              <p className="text-muted mb-4">
                لضمان تجربة استثنائية وبيئة مريحة تليق بضيوفنا، نرجو التكرم بالاطلاع والموافقة على الشروط والأحكام الآتية:
              </p>
              <h3 className="text-gold font-bold mb-2">أولاً: نظام العضوية والدخول</h3>
              <ul className="list-disc pr-6 space-y-2 text-cream/90 mb-6">
                <li>ستكون رسوم العضوية لعام 2026 مجانًا.</li>
                <li><span className="font-semibold">خصوصية الاستخدام:</span> تُعد بطاقة العضوية امتيازاً شخصياً، ويقتصر استخدامها على العضو المسجل فقط.</li>
                <li><span className="font-semibold">حق الإدارة:</span> تحتفظ إدارة مقهى عمّار بالحق في تعديل الشروط والأحكام أو إلغاء العضوية للأسباب التي تراها مناسبة، لضمان جودة التجربة المقدمة.</li>
                <li><span className="font-semibold">حرمة الخصوصية:</span> نعتز بخصوصية ضيوفنا الكرام، لذا نرجو مراعاة عدم تصوير الأعضاء الآخرين أثناء تواجدكم في أرجاء المكان.</li>
                <li><span className="font-semibold">السكينة والهدوء:</span> حرصاً على توفير أجواء هادئة، يسعدنا استقبال ضيوفنا ممن هم في سن 12 عاماً فما فوق.</li>
                <li><span className="font-semibold">بروتوكول الدخول:</span> يتم استقبال ودخول الضيوف من قبل العضو مباشرة، حيث لا يملك موظفونا صلاحية إدخال الضيوف بشكل منفرد.</li>
              </ul>

              <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1" checked={v.agree_terms} onChange={set('agree_terms')} />
                  <span className="text-cream">أقر بالاطلاع على الشروط والأحكام والموافقة على الالتزام بها.</span>
                </label>
                <Err name="agree_terms" />

                <div>
                  <label className="label">إرفاق صورة شخصية لغرض التعريف <span className="text-muted font-normal">(لا يلزم أن تكون صورة رسمية)</span></label>
                  <div className="flex items-center gap-4">
                    <label className="btn-secondary cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                      اختر صورة
                    </label>
                    {photoPreview && (
                      <img src={photoPreview} alt="preview" className="w-16 h-16 rounded-full object-cover border border-gold/40" />
                    )}
                    {v.profile_photo && <span className="text-sm text-muted truncate">{v.profile_photo.name}</span>}
                  </div>
                  <Err name="profile_photo" />
                </div>
              </div>
            </section>
          )}

          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={prev} disabled={step === 0} className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed">
              السابق
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="btn-primary">
                التالي
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !finalStepComplete}
                className="btn-primary text-lg px-10 py-4"
              >
                {submitting ? '...جاري الإرسال' : 'إرسال الطلب'}
              </button>
            )}
          </div>
        </form>
      </main>

      <footer className="text-center text-muted text-xs py-4">
        © {new Date().getFullYear()} Ammar Cafe — جميع الحقوق محفوظة
        <div className="opacity-50 mt-1" dir="ltr">build {__BUILD_SHA__}</div>
      </footer>
    </div>
  )
}
