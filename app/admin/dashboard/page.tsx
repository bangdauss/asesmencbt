'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [users, setUsers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [isEditSiswa, setIsEditSiswa] = useState(false)
  const [formSiswa, setFormSiswa] = useState({
    no_peserta: '', nama_lengkap: '', jk: '', kelas: '', password: '', sesi: '', status: false
  })

  const fetchData = async () => {
    try {
      const { data: userData } = await supabase.from('admin_user').select('*').order('id', { ascending: true })
      if (userData) setUsers(userData)
      
      const { data: studentData } = await supabase.from('data_siswa').select('*').order('no_peserta', { ascending: true })
      if (studentData) setStudents(studentData)
    } catch (err) {
      console.error("Gagal mengambil data:", err)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditSiswa) {
      const { error } = await supabase.from('data_siswa').update(formSiswa).eq('no_peserta', formSiswa.no_peserta)
      if (!error) alert('Data Siswa Diperbarui!')
    } else {
      const { error } = await supabase.from('data_siswa').insert([formSiswa])
      if (!error) alert('Siswa Berhasil Ditambahkan!')
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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#e2e8f0' }}>
      <div style={{ width: '260px', backgroundColor: '#1e293b', color: '#cbd5e1' }}>
        <div style={{ padding: '20px', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold' }}>📖 e-Asesmen SMA</div>
        <nav style={{ marginTop: '10px' }}>
          <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#334155' : 'transparent', color: 'white' }}>📊 Dashboard</div>
          <div onClick={() => setActiveMenu('user')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'user' ? '#334155' : 'transparent', color: 'white' }}>👤 Data Pengguna</div>
          <div onClick={() => setActiveMenu('siswa')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'siswa' ? '#334155' : 'transparent', color: 'white' }}>🎓 Data Siswa</div>
        </nav>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ height: '60px', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', padding: '0 25px' }}>Administrator (Admin)</div>
        <div style={{ padding: '25px' }}>
          {activeMenu === 'dashboard' && (
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #3b82f6' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#64748b' }}>Total Pengguna</h4>
                  <h2 style={{ margin: 0 }}>{users.length}</h2>
                </div>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #22c55e' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#64748b' }}>Total Siswa</h4>
                  <h2 style={{ margin: 0 }}>{students.length}</h2>
                </div>
             </div>
          )}

          {activeMenu === 'user' && (
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px' }}>
              <h3>DATA PENGGUNA ADMIN</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#475569', color: 'white' }}>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>No</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Username</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Nama Lengkap</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id}>
                      <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{u.username}</td>
                      <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{u.nama_lengkap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0 }}>DATA SISWA (Total: {students.length})</h3>
                <button onClick={() => { setIsEditSiswa(false); setFormSiswa({no_peserta:'', nama_lengkap:'', jk:'', kelas:'', password:'', sesi:'', status:false}); setShowModalSiswa(true); }} style={{ backgroundColor: '#1e293b', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Tambah Siswa</button>
              </div>
              <div style={{ padding: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#475569', color: 'white' }}>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>No</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>No Peserta</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Nama Lengkap</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>L/P</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Kelas</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Status</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, index) => (
                      <tr key={s.no_peserta} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{index + 1}</td>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{s.no_peserta}</td>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{s.nama_lengkap}</td>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{s.jk}</td>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{s.kelas}</td>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                          <button onClick={() => toggleStatus(s.no_peserta, s.status)} style={{ backgroundColor: s.status ? '#22c55e' : '#94a3b8', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer', fontSize: '11px' }}>
                            {s.status ? 'ON' : 'OFF'}
                          </button>
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                          <button onClick={() => { setIsEditSiswa(true); setFormSiswa(s); setShowModalSiswa(true); }} style={{ marginRight: '8px', border: 'none', background: 'none', cursor: 'pointer' }}>✏️</button>
                          <button onClick={() => deleteSiswa(s.no_peserta, s.nama_lengkap)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
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

      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', width: '450px', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>{isEditSiswa ? '✏️ Edit Siswa' : '➕ Tambah Siswa Baru'}</h3>
            <form onSubmit={handleSiswaSubmit}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>No Peserta</label>
              <input value={formSiswa.no_peserta} disabled={isEditSiswa} onChange={(e) => setFormSiswa({...formSiswa, no_peserta: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px', backgroundColor: isEditSiswa ? '#f3f4f6' : 'white', border: '1px solid #ccc' }} required />
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nama Lengkap</label>
              <input value={formSiswa.nama_lengkap} onChange={(e) => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px', border: '1px solid #ccc' }} required />
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>L/P</label>
                  <input maxLength={1} value={formSiswa.jk} onChange={(e) => setFormSiswa({...formSiswa, jk: e.target.value.toUpperCase()})} style={{ width: '100%', marginBottom: '10px', padding: '8px', border: '1px solid #ccc' }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Kelas</label>
                  <input maxLength={2} value={formSiswa.kelas} onChange={(e) => setFormSiswa({...formSiswa, kelas: e.target.value.toUpperCase()})} style={{ width: '100%', marginBottom: '10px', padding: '8px', border: '1px solid #ccc' }} required />
                </div>
              </div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Password</label>
              <input value={formSiswa.password} onChange={(e) => setFormSiswa({...formSiswa, password: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px', border: '1px solid #ccc' }} required />
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Sesi</label>
              <input value={formSiswa.sesi} onChange={(e) => setFormSiswa({...formSiswa, sesi: e.target.value})} style={{ width: '100%', marginBottom: '20px', padding: '8px', border: '1px solid #ccc' }} required />
              <button type="submit" style={{ backgroundColor: '#3b82f6', color: 'white', width: '100%', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Simpan Data Siswa</button>
              <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', marginTop: '10px', padding: '10px', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Batal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}