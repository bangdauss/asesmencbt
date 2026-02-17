'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState('dashboard') // Default ke dashboard
  const [users, setUsers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [formSiswa, setFormSiswa] = useState({ no_peserta: '', nama_lengkap: '', jk: 'L', kelas: '', password: '', sesi: '1', status: false })

  const fetchData = useCallback(async () => {
    try {
      const { data: userData } = await supabase.from('admin_user').select('*')
      if (userData) setUsers(userData)
      const { data: studentData } = await supabase.from('data_siswa').select('*')
      if (studentData) setStudents(studentData)
    } catch (err) { 
      console.error("Error fetching:", err) 
    } finally { 
      setLoading(false) 
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Memuat Data...</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f1f5f9' }}>
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: '#1e293b', color: 'white', padding: '20px' }}>
        <h2 style={{ marginBottom: '30px' }}>e-Asesmen</h2>
        <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '10px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#334155' : 'transparent', borderRadius: '8px', marginBottom: '5px' }}>📊 Dashboard</div>
        <div onClick={() => setActiveMenu('user')} style={{ padding: '10px', cursor: 'pointer', backgroundColor: activeMenu === 'user' ? '#334155' : 'transparent', borderRadius: '8px', marginBottom: '5px' }}>👤 Data Pengguna</div>
        <div onClick={() => setActiveMenu('siswa')} style={{ padding: '10px', cursor: 'pointer', backgroundColor: activeMenu === 'siswa' ? '#334155' : 'transparent', borderRadius: '8px' }}>🎓 Data Siswa</div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1 }}>
        <header style={{ padding: '20px 40px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <h1 style={{ fontSize: '1.2rem', margin: 0 }}>Panel Administrator</h1>
        </header>

        <main style={{ padding: '40px' }}>
          {activeMenu === 'dashboard' && (
            <div>
              <h2 style={{ marginBottom: '20px' }}>Ringkasan Data</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', margin: 0 }}>Total Peserta</p>
                  <h3 style={{ fontSize: '2rem', margin: '10px 0 0 0' }}>{students.length}</h3>
                </div>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', margin: 0 }}>Siswa Aktif (ON)</p>
                  <h3 style={{ fontSize: '2rem', margin: '10px 0 0 0', color: '#22c55e' }}>{students.filter(s => s.status).length}</h3>
                </div>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', margin: 0 }}>Administrator</p>
                  <h3 style={{ fontSize: '2rem', margin: '10px 0 0 0', color: '#3b82f6' }}>{users.length}</h3>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Daftar Murid</h3>
                <button onClick={() => { setIsEdit(false); setShowModalSiswa(true); }} style={{ padding: '8px 16px', backgroundColor: '#1e293b', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>+ Tambah</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '12px' }}>No Peserta</th>
                    <th style={{ padding: '12px' }}>Nama</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.no_peserta} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>{s.no_peserta}</td>
                      <td style={{ padding: '12px' }}>{s.nama_lengkap}</td>
                      <td style={{ padding: '12px' }}>
                         {/* TOGGLE STATUS */}
                         <button 
                          onClick={async () => { await supabase.from('data_siswa').update({status: !s.status}).eq('no_peserta', s.no_peserta); fetchData(); }}
                          style={{ padding: '4px 12px', borderRadius: '20px', border: 'none', backgroundColor: s.status ? '#dcfce7' : '#fee2e2', color: s.status ? '#166534' : '#991b1b', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                         >
                          {s.status ? 'ON' : 'OFF'}
                         </button>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => { setFormSiswa(s); setIsEdit(true); setShowModalSiswa(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>📝</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* MODAL SIMPEL & BERSIH */}
      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '400px' }}>
            <h3 style={{ marginTop: 0 }}>{isEdit ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              isEdit ? await supabase.from('data_siswa').update(formSiswa).eq('no_peserta', formSiswa.no_peserta) : await supabase.from('data_siswa').insert([formSiswa]);
              setShowModalSiswa(false); fetchData();
            }}>
              <input placeholder="No Peserta" value={formSiswa.no_peserta} disabled={isEdit} onChange={e => setFormSiswa({...formSiswa, no_peserta: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' }} required />
              <input placeholder="Nama Lengkap" value={formSiswa.nama_lengkap} onChange={e => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' }} required />
              <input placeholder="Kelas" value={formSiswa.kelas} onChange={e => setFormSiswa({...formSiswa, kelas: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' }} required />
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Simpan Data</button>
              <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>Batal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}