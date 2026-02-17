'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [users, setUsers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal States
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [showModalUser, setShowModalUser] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  // Form States
  const [formSiswa, setFormSiswa] = useState({ no_peserta: '', nama_lengkap: '', jk: 'L', kelas: '', password: '', sesi: '1', status: false })
  const [formUser, setFormUser] = useState({ id: '', username: '', nama_lengkap: '', password: '' })

  const fetchData = useCallback(async () => {
    try {
      const { data: userData } = await supabase.from('admin_user').select('*').order('id', { ascending: true })
      if (userData) setUsers(userData)
      const { data: studentData } = await supabase.from('data_siswa').select('*').order('no_peserta', { ascending: true })
      if (studentData) setStudents(studentData)
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // LOGIKA PASSWORD KOMPLEKS + *
  const generateAllPasswords = async () => {
    if (confirm("Generate password (Besar, Kecil, Angka, *) untuk SEMUA siswa?")) {
      const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
      const lower = "abcdefghijkmnopqrstuvwxyz";
      const nums = "23456789";
      const all = upper + lower + nums;
      
      const updates = students.map(async (s) => {
        let res = "";
        res += upper[Math.floor(Math.random() * upper.length)];
        res += lower[Math.floor(Math.random() * lower.length)];
        res += nums[Math.floor(Math.random() * nums.length)];
        for(let i=0; i<2; i++) res += all[Math.floor(Math.random() * all.length)];
        const finalPass = res.split('').sort(() => 0.5 - Math.random()).join('') + "*";
        return supabase.from('data_siswa').update({ password: finalPass }).eq('no_peserta', s.no_peserta);
      });
      await Promise.all(updates);
      fetchData();
      alert("Password kompleks berhasil dibuat!");
    }
  }

  // HANDLERS USER
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      await supabase.from('admin_user').update({ username: formUser.username, nama_lengkap: formUser.nama_lengkap, password: formUser.password }).eq('id', formUser.id)
    } else {
      await supabase.from('admin_user').insert([{ username: formUser.username, nama_lengkap: formUser.nama_lengkap, password: formUser.password }])
    }
    setShowModalUser(false)
    fetchData()
  }

  const deleteUser = async (id: any, nama: string) => {
    if (confirm(`Hapus admin ${nama}?`)) {
      await supabase.from('admin_user').delete().eq('id', id)
      fetchData()
    }
  }

  // HANDLERS SISWA
  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      await supabase.from('data_siswa').update(formSiswa).eq('no_peserta', formSiswa.no_peserta)
    } else {
      await supabase.from('data_siswa').insert([formSiswa])
    }
    setShowModalSiswa(false)
    fetchData()
  }

  const deleteSiswa = async (no: string, nama: string) => {
    if (confirm(`Hapus siswa ${nama}?`)) {
      await supabase.from('data_siswa').delete().eq('no_peserta', no)
      fetchData()
    }
  }

  const toggleStatus = async (no: string, stat: boolean) => {
    await supabase.from('data_siswa').update({ status: !stat }).eq('no_peserta', no)
    fetchData()
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>🔄 Sinkronisasi Data...</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f9' }}>
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: '#0f172a', color: 'white' }}>
        <div style={{ padding: '25px', fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '1px solid #1e293b' }}>📖 e-Asesmen</div>
        <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '15px 25px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#1e293b' : '' }}>📊 Dashboard</div>
        <div onClick={() => setActiveMenu('user')} style={{ padding: '15px 25px', cursor: 'pointer', backgroundColor: activeMenu === 'user' ? '#1e293b' : '' }}>👤 Data Pengguna</div>
        <div onClick={() => setActiveMenu('siswa')} style={{ padding: '15px 25px', cursor: 'pointer', backgroundColor: activeMenu === 'siswa' ? '#1e293b' : '' }}>🎓 Data Siswa</div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1 }}>
        <header style={{ padding: '20px 30px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>Administrator (Admin)</header>
        
        <div style={{ padding: '30px' }}>
          {/* DASHBOARD VIEW */}
          {activeMenu === 'dashboard' && (
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #3b82f6' }}>
                <p style={{ margin: 0, color: '#64748b' }}>Total Pengguna</p>
                <h2 style={{ margin: '5px 0 0' }}>{users.length}</h2>
              </div>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #10b981' }}>
                <p style={{ margin: 0, color: '#64748b' }}>Total Siswa</p>
                <h2 style={{ margin: '5px 0 0' }}>{students.length}</h2>
              </div>
            </div>
          )}

          {/* USER VIEW */}
          {activeMenu === 'user' && (
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Pengaturan Pengguna</h3>
                <button onClick={() => { setIsEdit(false); setFormUser({id:'', username:'', nama_lengkap:'', password:''}); setShowModalUser(true); }} style={{ padding: '8px 15px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>👤 Tambah User</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
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
                        <button onClick={() => { setFormUser(u); setIsEdit(true); setShowModalUser(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>✏️</button>
                        <button onClick={() => deleteUser(u.id, u.nama_lengkap)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SISWA VIEW */}
          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Daftar Murid</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={generateAllPasswords} style={{ padding: '8px 15px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🔑 Generate</button>
                  <button onClick={() => { setIsEdit(false); setShowModalSiswa(true); }} style={{ padding: '8px 15px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🎓 Tambah</button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>No Peserta</th>
                    <th style={{ padding: '12px' }}>Nama</th>
                    <th style={{ padding: '12px' }}>Password</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.no_peserta} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>{s.no_peserta}</td>
                      <td style={{ padding: '12px' }}>{s.nama_lengkap}</td>
                      <td style={{ padding: '12px', color: '#2563eb', fontWeight: 'bold' }}>{s.password}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => toggleStatus(s.no_peserta, s.status)} style={{ backgroundColor: s.status ? '#22c55e' : '#94a3b8', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '15px', fontSize: '11px', cursor: 'pointer' }}>{s.status ? 'Aktif' : 'Off'}</button>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => { setFormSiswa(s); setIsEdit(true); setShowModalSiswa(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>✏️</button>
                        <button onClick={() => deleteSiswa(s.no_peserta, s.nama_lengkap)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL USER */}
      {showModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '400px' }}>
            <h3>{isEdit ? 'Edit Admin' : 'Tambah Admin'}</h3>
            <form onSubmit={handleUserSubmit}>
              <input placeholder="Username" value={formUser.username} onChange={e => setFormUser({...formUser, username: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }} required />
              <input placeholder="Nama Lengkap" value={formUser.nama_lengkap} onChange={e => setFormUser({...formUser, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }} required />
              <input type="password" placeholder="Password" value={formUser.password} onChange={e => setFormUser({...formUser, password: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px' }} required />
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan</button>
              <button type="button" onClick={() => setShowModalUser(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>Batal</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SISWA (Tetap Sama) */}
      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '400px' }}>
            <h3>{isEdit ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
            <form onSubmit={handleSiswaSubmit}>
              <input placeholder="No Peserta" value={formSiswa.no_peserta} disabled={isEdit} onChange={e => setFormSiswa({...formSiswa, no_peserta: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }} required />
              <input placeholder="Nama Lengkap" value={formSiswa.nama_lengkap} onChange={e => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }} required />
              <input placeholder="Password" value={formSiswa.password} onChange={e => setFormSiswa({...formSiswa, password: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px' }} required />
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>Simpan</button>
              <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>Batal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}