'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState('siswa')
  const [users, setUsers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [isEditSiswa, setIsEditSiswa] = useState(false)
  const [formSiswa, setFormSiswa] = useState({
    no_peserta: '', nama_lengkap: '', jk: '', kelas: '', password: '', sesi: '', status: false
  })

  const fetchData = async () => {
    const { data: userData } = await supabase.from('admin_user').select('*').order('id', { ascending: true })
    if (userData) setUsers(userData)
    
    const { data: studentData } = await supabase.from('data_siswa').select('*').order('no_peserta', { ascending: true })
    if (studentData) setStudents(studentData)
  }

  useEffect(() => { fetchData() }, [])

  const toggleAllStatus = async (targetStatus: boolean) => {
    const confirmMsg = targetStatus ? "Aktifkan SEMUA siswa?" : "Nonaktifkan SEMUA siswa?";
    if (confirm(confirmMsg)) {
      const { error } = await supabase.from('data_siswa').update({ status: targetStatus }).neq('no_peserta', '0') 
      if (!error) fetchData();
    }
  }

  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditSiswa) {
      await supabase.from('data_siswa').update(formSiswa).eq('no_peserta', formSiswa.no_peserta)
    } else {
      await supabase.from('data_siswa').insert([formSiswa])
    }
    setShowModalSiswa(false)
    fetchData()
  }

  const toggleStatus = async (no_peserta: string, currentStatus: boolean) => {
    await supabase.from('data_siswa').update({ status: !currentStatus }).eq('no_peserta', no_peserta)
    fetchData()
  }

  const deleteSiswa = async (no_peserta: string, nama: string) => {
    if (confirm(`Hapus siswa: ${nama}?`)) {
      await supabase.from('data_siswa').delete().eq('no_peserta', no_peserta)
      fetchData()
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f1f5f9' }}>
      {/* SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#1e293b', color: '#cbd5e1' }}>
        <div style={{ padding: '25px 20px', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🚀 e-Asesmen
        </div>
        <nav style={{ marginTop: '10px' }}>
          <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#334155' : 'transparent', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>📊 Dashboard</div>
          <div onClick={() => setActiveMenu('user')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'user' ? '#334155' : 'transparent', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>👤 Data Pengguna</div>
          <div onClick={() => setActiveMenu('siswa')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'siswa' ? '#334155' : 'transparent', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>🎓 Data Siswa</div>
        </nav>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ height: '60px', backgroundColor: 'white', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontWeight: 'bold' }}>Panel Administrator</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Tahun Pelajaran 2025/2026</span>
        </div>
        
        <div style={{ padding: '30px' }}>
          {activeMenu === 'dashboard' && (
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                  <h4 style={{ margin: 0, color: '#64748b' }}>Total Pengguna</h4>
                  <h2 style={{ fontSize: '32px', margin: '10px 0 0 0' }}>{users.length}</h2>
                </div>
                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                  <h4 style={{ margin: 0, color: '#64748b' }}>Total Siswa</h4>
                  <h2 style={{ fontSize: '32px', margin: '10px 0 0 0' }}>{students.length}</h2>
                </div>
             </div>
          )}

          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Data Siswa (Total: {students.length})</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => toggleAllStatus(true)} style={{ backgroundColor: '#22c55e', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>ON ALL</button>
                  <button onClick={() => toggleAllStatus(false)} style={{ backgroundColor: '#ef4444', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>OFF ALL</button>
                  <button style={{ backgroundColor: '#f59e0b', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🔑</button>
                  <button onClick={() => { setIsEditSiswa(false); setFormSiswa({no_peserta:'', nama_lengkap:'', jk:'', kelas:'', password:'', sesi:'', status:false}); setShowModalSiswa(true); }} style={{ backgroundColor: '#1e293b', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}>+</button>
                </div>
              </div>

              <div style={{ padding: '0 25px 25px 25px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ padding: '12px', textAlign: 'center' }}>No</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>No Peserta</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Nama Lengkap</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Password</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>L/P</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Kelas</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Sesi</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, index) => (
                      <tr key={s.no_peserta} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>{index + 1}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#475569' }}>{s.no_peserta}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#475569' }}>{s.nama_lengkap}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>{s.password}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ backgroundColor: '#f8fafc', padding: '8px 5px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', width: '30px', margin: '0 auto' }}>{s.jk}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ backgroundColor: '#f8fafc', padding: '8px 5px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', width: '45px', margin: '0 auto' }}>{s.kelas}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ backgroundColor: '#f8fafc', padding: '8px 5px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', width: '35px', margin: '0 auto' }}>{s.sesi}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {/* TOGGLE SAKELAR LONJONG */}
                          <div 
                            onClick={() => toggleStatus(s.no_peserta, s.status)}
                            style={{
                              width: '44px',
                              height: '22px',
                              backgroundColor: s.status ? '#22c55e' : '#cbd5e1',
                              borderRadius: '20px',
                              padding: '2px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              transition: 'all 0.3s ease',
                              position: 'relative'
                            }}
                          >
                            <div style={{
                              width: '18px',
                              height: '18px',
                              backgroundColor: 'white',
                              borderRadius: '50%',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              transform: s.status ? 'translateX(22px)' : 'translateX(0px)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => { setIsEditSiswa(true); setFormSiswa(s); setShowModalSiswa(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>📝</button>
                            <button onClick={() => deleteSiswa(s.no_peserta, s.nama_lengkap)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORM SISWA */}
      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', width: '450px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>{isEditSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
            <form onSubmit={handleSiswaSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px' }}>No Peserta</label>
                <input placeholder="Contoh: 050658001" value={formSiswa.no_peserta} disabled={isEditSiswa} onChange={(e) => setFormSiswa({...formSiswa, no_peserta: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} required />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Nama Lengkap</label>
                <input placeholder="Masukkan nama lengkap" value={formSiswa.nama_lengkap} onChange={(e) => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px' }}>L/P</label>
                  <input placeholder="L / P" maxLength={1} value={formSiswa.jk} onChange={(e) => setFormSiswa({...formSiswa, jk: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Kelas</label>
                  <input placeholder="6A" maxLength={3} value={formSiswa.kelas} onChange={(e) => setFormSiswa({...formSiswa, kelas: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} required />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Password</label>
                <input placeholder="Password akses" value={formSiswa.password} onChange={(e) => setFormSiswa({...formSiswa, password: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} required />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Sesi</label>
                <input placeholder="Sesi ujian (1/2/3)" value={formSiswa.sesi} onChange={(e) => setFormSiswa({...formSiswa, sesi: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} required />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowModalSiswa(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '600' }}>Batal</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '600' }}>Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}