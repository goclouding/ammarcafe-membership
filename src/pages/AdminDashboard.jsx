import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

const TABS = [
  { key: 'pending', label: 'قيد المراجعة' },
  { key: 'approved', label: 'مقبول' },
  { key: 'rejected', label: 'مرفوض' },
]

function StatusBadge({ status }) {
  const map = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }
  const labels = { pending: 'قيد المراجعة', approved: 'مقبول', rejected: 'مرفوض' }
  return <span className={`badge ${map[status]}`}>{labels[status]}</span>
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-white/5 last:border-0">
      <div className="text-muted sm:w-48 text-sm">{label}</div>
      <div className="text-cream break-all">{value}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('pending')
  const [apps, setApps] = useState([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data }, ...countRes] = await Promise.all([
      supabase.from('membership_applications').select('*').eq('status', tab).order('created_at', { ascending: false }),
      ...TABS.map(t =>
        supabase.from('membership_applications').select('id', { count: 'exact', head: true }).eq('status', t.key)
      ),
    ])
    setApps(data || [])
    const c = {}
    TABS.forEach((t, i) => { c[t.key] = countRes[i].count || 0 })
    setCounts(c)
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  async function updateStatus(id, action) {
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const { error } = await supabase.from('membership_applications').update({ status: newStatus }).eq('id', id)
    if (error) { alert('فشل التحديث'); return }
    load()
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-black/30 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={48} />
            <h1 className="text-xl font-bold text-gold">لوحة التحكم</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn-secondary text-sm">صفحة التقديم</Link>
            <button onClick={logout} className="btn-danger text-sm">تسجيل الخروج</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {TABS.map(t => (
            <div key={t.key} className="glass-card !p-4 text-center">
              <div className="text-muted text-sm">{t.label}</div>
              <div className={`text-3xl font-bold mt-1 ${
                t.key === 'pending' ? 'text-warn' : t.key === 'approved' ? 'text-ok' : 'text-danger'
              }`}>{counts[t.key]}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.key ? 'bg-gold text-black' : 'bg-white/5 text-cream hover:bg-white/10'
              }`}
            >
              {t.label} ({counts[t.key]})
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card !p-0 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted">...جاري التحميل</div>
          ) : apps.length === 0 ? (
            <div className="p-8 text-center text-muted">لا توجد طلبات في هذا القسم</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/30 text-muted">
                  <tr>
                    <th className="text-right px-4 py-3">#</th>
                    <th className="text-right px-4 py-3">الاسم</th>
                    <th className="text-right px-4 py-3">الجوال</th>
                    <th className="text-right px-4 py-3">جهة العمل</th>
                    <th className="text-right px-4 py-3">التاريخ</th>
                    <th className="text-right px-4 py-3">الحالة</th>
                    <th className="text-right px-4 py-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map(a => (
                    <tr key={a.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">{a.id}</td>
                      <td className="px-4 py-3">{a.full_name}</td>
                      <td className="px-4 py-3" dir="ltr">{a.mobile_number}</td>
                      <td className="px-4 py-3">{a.employer}</td>
                      <td className="px-4 py-3 text-muted">{new Date(a.created_at).toLocaleDateString('ar-EG')}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setSelected(a)} className="btn-secondary text-xs">عرض</button>
                          {a.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(a.id, 'approve')} className="btn-ok text-xs">قبول</button>
                              <button onClick={() => updateStatus(a.id, 'reject')} className="btn-danger text-xs">رفض</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gold">تفاصيل الطلب #{selected.id}</h2>
              <button onClick={() => setSelected(null)} className="btn-secondary text-sm">إغلاق</button>
            </div>
            {selected.profile_photo_url && (
              <div className="flex justify-center mb-4">
                <img src={selected.profile_photo_url} alt={selected.full_name} className="w-28 h-28 rounded-full object-cover border-2 border-gold/40" />
              </div>
            )}
            <Row label="الاسم الكامل" value={selected.full_name} />
            <Row label="تاريخ الميلاد" value={selected.date_of_birth ? new Date(selected.date_of_birth).toLocaleDateString('ar-EG') : null} />
            <Row label="العمر" value={selected.age} />
            <Row label="المدينة" value={selected.city} />
            <Row label="البريد الإلكتروني" value={selected.email} />
            <Row label="رقم الجوال" value={selected.mobile_number} />
            <Row label="LinkedIn" value={selected.linkedin_url} />
            <Row label="Instagram" value={selected.instagram_url} />
            <Row label="جهة العمل" value={selected.employer} />
            <Row label="المسمى الوظيفي" value={selected.job_title} />
            <Row label="دعوة من عضو" value={selected.invited_by_member ? 'نعم' : 'لا'} />
            <Row label="اسم العضو" value={selected.inviter_name} />
            <Row label="الحالة" value={<StatusBadge status={selected.status} />} />
            <Row label="تاريخ التقديم" value={new Date(selected.created_at).toLocaleString('ar-EG')} />
            <Row label="آخر تحديث" value={new Date(selected.updated_at).toLocaleString('ar-EG')} />
          </div>
        </div>
      )}
    </div>
  )
}
