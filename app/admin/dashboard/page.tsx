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
  
  // STATE MODAL SISWA
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [isEditSiswa, setIsEditSiswa] = useState(false)
  const [formSiswa, setFormSiswa] = useState({
    no_peserta: '', nama_lengkap: '', jk: '', kelas: '', password: '', sesi: '', status: false
  })

  // STATE MODAL USER
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

  // --- LOGIC PENGGUNA ---
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
    if (confirm(`Hapus admin: ${username}?`)) {
      await supabase.from('admin_user').delete().eq('id', id)
      fetchData()
    }
  }

  // --- LOGIC SISWA ---
  const toggleAllStatus = async (targetStatus: boolean) => {
    const msg = targetStatus ? "Aktifkan semua siswa?" : "Nonaktifkan semua siswa?";
    if (confirm(msg)) {
      await supabase.from('data_siswa').update({ status: targetStatus }).neq('no_peserta', 'x')
      fetchData()
    }
  }

  const toggleStatus = async (no_peserta: string, currentStatus: boolean) => {
    await supabase.from('data_siswa').update({ status: !currentStatus }).eq('no_peserta', no_peserta)
    fetchData()
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

  const deleteSiswa = async (no_peserta: string, nama: string) => {
    if (confirm(`Hapus siswa: ${nama}?`)) {
      await supabase.from('data_siswa').delete().eq('no_peserta', no_peserta)
      fetchData()
    }
  }

  // KOMPONEN SWITCH TOGGLE (Sesuai Gambar)
  const SwitchToggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
    <div 
      onClick={onToggle}
      style={{
        width: '44px',
        height: '22px',
        backgroundColor: active ? '#22c55e' : '#cbd5e1',
        borderRadius: '22px',
        padding: '2px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}
    >
      <div style={{
        width: '18px',
        height: '18px',
        backgroundColor: 'white',
        borderRadius: '50%',
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: active ? 'translateX(22px)' : 'translateX(0px)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
      {/* SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#0f172a', color: '#f8fafc' }}>
        <div style={{ padding: '25px', fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #1e293b' }}>🚀 e-Asesmen</div>
        <div style={{ marginTop: '20px' }}>
          <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '15px 25px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#1e293b' : '' }}>📊 Dashboard</div>
          <div onClick={() => setActiveMenu('user')} style={{ padding: '15px 25px', cursor: 'pointer', backgroundColor: activeMenu === 'user' ? '#1e293b' : '' }}>👤 Data Pengguna</div>
          <div onClick={() => setActiveMenu('siswa')} style={{ padding: '15px 25px', cursor: 'pointer', backgroundColor: activeMenu === 'siswa' ? '#1e293b' : '' }}>🎓 Data Siswa</div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ height: '70px', backgroundColor: 'white', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <span style={{ fontWeight: 'bold', color: '#334155' }}>Panel Administrator</span>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Tahun 2025/2026</span>
        </div>

        <div style={{ padding: '30px' }}>
          {activeMenu === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ color: '#64748b', marginBottom: '5px' }}>Total Admin</div>
                <h2 style={{ fontSize: '32px', margin: 0 }}>{users.length}</h2>
              </div>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ color: '#64748b', marginBottom: '5px' }}>Total Siswa</div>
                <h2 style={{ fontSize: '32px', margin: 0 }}>{students.length}</h2>
              </div>
            </div>
          )}

          {activeMenu === 'user' && (
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Data Pengguna</h3>
                <button onClick={() => { setIsEditUser(false); setFormUser({id:null, username:'', nama_lengkap:'', password:''}); setShowModalUser(true); }} style={{ backgroundColor: '#0f172a', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ Tambah Admin</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '15px' }}>Username</th>
                    <th style={{ padding: '15px' }}>Nama Lengkap</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px' }}>{u.username}</td>
                      <td style={{ padding: '15px' }}>{u.nama_lengkap}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button onClick={() => { setIsEditUser(true); setFormUser(u); setShowModalUser(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', marginRight: '10px' }}>📝</button>
                        <button onClick={() => deleteUser(u.id, u.username)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Data Siswa ({students.length})</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => toggleAllStatus(true)} style={{ backgroundColor: '#dcfce7', color: '#166534', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>ON ALL</button>
                  <button onClick={() => toggleAllStatus(false)} style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>OFF ALL</button>
                  <button onClick={() => { setIsEditSiswa(false); setFormSiswa({no_peserta:'', nama_lengkap:'', jk:'', kelas:'', password:'', sesi:'', status:false}); setShowModalSiswa(true); }} style={{ backgroundColor: '#0f172a', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ Tambah</button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '12px' }}>No Peserta</th>
                    <th style={{ padding: '12px' }}>Nama Lengkap</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>L/P</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Kelas</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Sesi</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.no_peserta} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>{s.no_peserta}</td>
                      <td style={{ padding: '12px' }}>{s.nama_lengkap}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{s.jk}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{s.kelas}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{s.sesi}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <SwitchToggle active={s.status} onToggle={() => toggleStatus(s.no_peserta, s.status)} />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => { setIsEditSiswa(true); setFormSiswa(s); setShowModalSiswa(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', marginRight: '5px' }}>📝</button>
                        <button onClick={() => deleteSiswa(s.no_peserta, s.nama_lengkap)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px' }}>
            <h3 style={{ marginTop: 0 }}>{isEditUser ? 'Edit Admin' : 'Tambah Admin'}</h3>
            <form onSubmit={handleUserSubmit}>
              <input placeholder="Username" value={formUser.username} onChange={e => setFormUser({...formUser, username: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd' }} required />
              <input placeholder="Nama Lengkap" value={formUser.nama_lengkap} onChange={e => setFormUser({...formUser, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd' }} required />
              <input placeholder="Password" value={formUser.password} onChange={e => setFormUser({...formUser, password: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' }} required />
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Simpan</button>
              <button type="button" onClick={() => setShowModalUser(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>Batal</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SISWA */}
      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '450px' }}>
            <h3 style={{ marginTop: 0 }}>{isEditSiswa ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
            <form onSubmit={handleSiswaSubmit}>
              <input placeholder="No Peserta" value={formSiswa.no_peserta} disabled={isEditSiswa} onChange={e => setFormSiswa({...formSiswa, no_peserta: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd' }} required />
              <input placeholder="Nama Lengkap" value={formSiswa.nama_lengkap} onChange={e => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd' }} required />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <select value={formSiswa.jk} onChange={e => setFormSiswa({...formSiswa, jk: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} required>
                  <option value="">Pilih L/P</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
                <input placeholder="Kelas" value={formSiswa.kelas} onChange={e => setFormSiswa({...formSiswa, kelas: e.target.value.toUpperCase()})} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} required />
              </div>
              <input placeholder="Password" value={formSiswa.password} onChange={e => setFormSiswa({...formSiswa, password: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd' }} required />
              <input placeholder="Sesi" type="number" value={formSiswa.sesi} onChange={e => setFormSiswa({...formSiswa, sesi: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' }} required />
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Simpan Data</button>
              <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>Batal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}