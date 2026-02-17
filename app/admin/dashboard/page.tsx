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
  
  // STATE UNTUK MODAL SISWA
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [isEditSiswa, setIsEditSiswa] = useState(false)
  const [formSiswa, setFormSiswa] = useState({
    no_peserta: '', nama_lengkap: '', jk: '', kelas: '', password: '', sesi: '', status: false
  })

  // STATE UNTUK MODAL PENGGUNA (ADMIN)
  const [showModalUser, setShowModalUser] = useState(false)
  const [isEditUser, setIsEditUser] = useState(false)
  const [formUser, setFormUser] = useState({
    id: null, username: '', nama_lengkap: '', password: ''
  })

  const fetchData = async () => {
    const { data: userData } = await supabase.from('admin_user').select('*').order('id', { ascending: true })
    if (userData) setUsers(userData)
    
    const { data: studentData } = await supabase.from('data_siswa').select('*').order('no_peserta', { ascending: true })
    if (studentData) setStudents(studentData)
  }

  useEffect(() => { fetchData() }, [])

  // --- LOGIK GENERATE PASSWORD ---
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormSiswa({ ...formSiswa, password: result });
  }

  // --- LOGIK DATA PENGGUNA ---
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditUser) {
      await supabase.from('admin_user').update({
        username: formUser.username,
        nama_lengkap: formUser.nama_lengkap,
        password: formUser.password
      }).eq('id', formUser.id)
    } else {
      await supabase.from('admin_user').insert([{
        username: formUser.username,
        nama_lengkap: formUser.nama_lengkap,
        password: formUser.password
      }])
    }
    setShowModalUser(false)
    fetchData()
  }

  const deleteUser = async (id: number, username: string) => {
    if (confirm(`Hapus pengguna: ${username}?`)) {
      await supabase.from('admin_user').delete().eq('id', id)
      fetchData()
    }
  }

  // --- LOGIK DATA SISWA ---
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
        <div style={{ padding: '20px', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🚀 e-Asesmen
        </div>
        <nav style={{ marginTop: '10px' }}>
          <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#334155' : 'transparent', color: 'white' }}>📊 Dashboard</div>
          <div onClick={() => setActiveMenu('user')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'user' ? '#334155' : 'transparent', color: 'white' }}>👤 Data Pengguna</div>
          <div onClick={() => setActiveMenu('siswa')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'siswa' ? '#334155' : 'transparent', color: 'white' }}>🎓 Data Siswa</div>
        </nav>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ height: '60px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Panel Administrator</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Tahun Pelajaran 2025/2026</span>
        </div>
        
        <div style={{ padding: '25px' }}>
          {/* DASHBOARD */}
          {activeMenu === 'dashboard' && (
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ color: '#64748b', margin: '0 0 10px 0' }}>Total Pengguna</h4>
                  <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b' }}>{users.length}</h2>
                </div>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ color: '#64748b', margin: '0 0 10px 0' }}>Total Siswa</h4>
                  <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b' }}>{students.length}</h2>
                </div>
             </div>
          )}

          {/* DATA PENGGUNA */}
          {activeMenu === 'user' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Data Pengguna</h3>
                  <button onClick={() => { setIsEditUser(false); setFormUser({id:null, username:'', nama_lengkap:'', password:''}); setShowModalUser(true); }} style={{ backgroundColor: '#1e293b', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>+ Tambah Admin</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                            <th style={{ padding: '12px' }}>Username</th>
                            <th style={{ padding: '12px' }}>Nama Lengkap</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px' }}>{u.username}</td>
                                <td style={{ padding: '12px' }}>{u.nama_lengkap}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                    <button onClick={() => { setIsEditUser(true); setFormUser(u); setShowModalUser(true); }} title="Edit" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>📝</button>
                                    <button onClick={() => deleteUser(u.id, u.username)} title="Hapus" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                                  </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}

          {/* DATA SISWA */}
          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Data Siswa (Total: {students.length})</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setIsEditSiswa(false); setFormSiswa({no_peserta:'', nama_lengkap:'', jk:'', kelas:'', password:'', sesi:'', status:false}); setShowModalSiswa(true); }} style={{ backgroundColor: '#1e293b', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '18px' }}>+ Tambah Siswa</span>
                    </button>
                </div>
              </div>
              <div style={{ padding: '0 20px 20px 20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ padding: '12px', textAlign: 'center' }}>No</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>No Peserta</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Nama Lengkap</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>L/P</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Kelas</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Password</th>
                      <th style={{ padding: '12px', textAlign: 'center', width: '130px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#475569' }}>STATUS</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => toggleAllStatus(true)} style={{ fontSize: '9px', cursor: 'pointer', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', fontWeight: 'bold' }}>ON ALL</button>
                                <button onClick={() => toggleAllStatus(false)} style={{ fontSize: '9px', cursor: 'pointer', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', fontWeight: 'bold' }}>OFF ALL</button>
                            </div>
                        </div>
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Sesi</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, index) => (
                      <tr key={s.no_peserta} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                        <td style={{ padding: '12px' }}>{s.no_peserta}</td>
                        <td style={{ padding: '12px' }}>{s.nama_lengkap}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{s.jk}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{s.kelas}</td>
                        <td style={{ padding: '12px', color: '#3b82f6', fontWeight: '500' }}>{s.password}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button onClick={() => toggleStatus(s.no_peserta, s.status)} style={{ backgroundColor: s.status ? '#22c55e' : '#94a3b8', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
                            {s.status ? 'ON' : 'OFF'}
                          </button>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{s.sesi}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
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

      {/* MODAL FORM PENGGUNA (ADMIN) */}
      {showModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', width: '400px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>{isEditUser ? 'Edit Data Admin' : 'Tambah Admin Baru'}</h3>
            <form onSubmit={handleUserSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Username</label>
                <input placeholder="admin_baru" value={formUser.username} onChange={(e) => setFormUser({...formUser, username: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Nama Lengkap</label>
                <input placeholder="Nama Lengkap" value={formUser.nama_lengkap} onChange={(e) => setFormUser({...formUser, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Password</label>
                <input type="text" placeholder="Password" value={formUser.password} onChange={(e) => setFormUser({...formUser, password: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="submit" style={{ backgroundColor: '#1e293b', color: 'white', width: '100%', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan Admin</button>
                <button type="button" onClick={() => setShowModalUser(false)} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM SISWA */}
      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', width: '450px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>{isEditSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
            <form onSubmit={handleSiswaSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Nomor Peserta</label>
                <input placeholder="Contoh: 123" value={formSiswa.no_peserta} disabled={isEditSiswa} onChange={(e) => setFormSiswa({...formSiswa, no_peserta: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Nama Lengkap</label>
                <input placeholder="Nama Lengkap" value={formSiswa.nama_lengkap} onChange={(e) => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Jenis Kelamin</label>
                    <select value={formSiswa.jk} onChange={(e) => setFormSiswa({...formSiswa, jk: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required>
                        <option value="">Pilih</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Kelas</label>
                    <input placeholder="6A" maxLength={3} value={formSiswa.kelas} onChange={(e) => setFormSiswa({...formSiswa, kelas: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Password</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input placeholder="Password" value={formSiswa.password} onChange={(e) => setFormSiswa({...formSiswa, password: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
                    <button type="button" onClick={handleGeneratePassword} style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '0 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }} title="Acak Password">🔑</button>
                </div>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Sesi</label>
                <input type="number" placeholder="1" value={formSiswa.sesi} onChange={(e) => setFormSiswa({...formSiswa, sesi: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="submit" style={{ backgroundColor: '#3b82f6', color: 'white', width: '100%', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan Data</button>
                <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}