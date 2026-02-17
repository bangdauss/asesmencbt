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
  
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [showModalUser, setShowModalUser] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  const [formSiswa, setFormSiswa] = useState({ no_peserta: '', nama_lengkap: '', jk: 'L', kelas: '', password: '', sesi: '1', status: false })
  const [formUser, setFormUser] = useState({ id: '', username: '', nama_lengkap: '', password: '' })

  const fetchData = useCallback(async () => {
    try {
      const { data: userData } = await supabase.from('admin_user').select('*').order('id', { ascending: true })
      if (userData) setUsers(userData)
      const { data: studentData } = await supabase.from('data_siswa').select('*').order('no_peserta', { ascending: true })
      if (studentData) setStudents(studentData)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // FUNGSI MASS TOGGLE (ON/OFF ALL)
  const toggleAllStatus = async (targetStatus: boolean) => {
    if (confirm(`Set semua siswa menjadi ${targetStatus ? 'AKTIF' : 'OFF'}?`)) {
      await supabase.from('data_siswa').update({ status: targetStatus }).neq('no_peserta', '0')
      fetchData()
    }
  }

  const generateAllPasswords = async () => {
    if (confirm("Generate password kompleks untuk SEMUA siswa?")) {
      const charSet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
      const updates = students.map(async (s) => {
        let res = Array.from({length: 5}, () => charSet[Math.floor(Math.random() * charSet.length)]).join('') + "*";
        return supabase.from('data_siswa').update({ password: res }).eq('no_peserta', s.no_peserta);
      });
      await Promise.all(updates);
      fetchData();
    }
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    isEdit ? await supabase.from('admin_user').update(formUser).eq('id', formUser.id) : await supabase.from('admin_user').insert([formUser])
    setShowModalUser(false); fetchData()
  }

  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    isEdit ? await supabase.from('data_siswa').update(formSiswa).eq('no_peserta', formSiswa.no_peserta) : await supabase.from('data_siswa').insert([formSiswa])
    setShowModalSiswa(false); fetchData()
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>⚙️ Loading System...</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5' }}>
      {/* SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#1e293b', color: 'white' }}>
        <div style={{ padding: '30px 20px', fontSize: '1.3rem', fontWeight: 'bold', borderBottom: '1px solid #334155' }}>🚀 e-Asesmen</div>
        <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '15px 25px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#334155' : '' }}>📊 Dashboard</div>
        <div onClick={() => setActiveMenu('user')} style={{ padding: '15px 25px', cursor: 'pointer', backgroundColor: activeMenu === 'user' ? '#334155' : '' }}>👤 Data Pengguna</div>
        <div onClick={() => setActiveMenu('siswa')} style={{ padding: '15px 25px', cursor: 'pointer', backgroundColor: activeMenu === 'siswa' ? '#334155' : '' }}>🎓 Data Siswa</div>
      </div>

      <div style={{ flex: 1 }}>
        <header style={{ padding: '20px 40px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontWeight: 'bold' }}>Panel Administrator</header>
        
        <div style={{ padding: '40px' }}>
          {/* USER VIEW DENGAN AKSI */}
          {activeMenu === 'user' && (
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                <h2 style={{ margin: 0 }}>Data Pengguna</h2>
                <button onClick={() => { setIsEdit(false); setFormUser({id:'', username:'', nama_lengkap:'', password:''}); setShowModalUser(true); }} style={{ padding: '10px 20px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>➕ Tambah Admin</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '2px solid #edf2f7', textAlign: 'left', color: '#64748b' }}><th style={{ padding: '15px' }}>Username</th><th style={{ padding: '15px' }}>Nama Lengkap</th><th style={{ padding: '15px', textAlign: 'center' }}>Aksi</th></tr></thead>
                <tbody>{users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px' }}>{u.username}</td>
                    <td style={{ padding: '15px' }}>{u.nama_lengkap}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button onClick={() => { setFormUser(u); setIsEdit(true); setShowModalUser(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>📝</button>
                      <button onClick={async () => { if(confirm('Hapus?')) { await supabase.from('admin_user').delete().eq('id', u.id); fetchData(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', marginLeft: '10px' }}>🗑️</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* SISWA VIEW LENGKAP */}
          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                <h2 style={{ margin: 0 }}>Data Siswa (Total: {students.length})</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => toggleAllStatus(true)} style={{ padding: '8px 15px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>ON ALL</button>
                  <button onClick={() => toggleAllStatus(false)} style={{ padding: '8px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>OFF ALL</button>
                  <button onClick={generateAllPasswords} title="Generate Password" style={{ padding: '10px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🔑</button>
                  <button onClick={() => { setIsEdit(false); setFormSiswa({no_peserta:'', nama_lengkap:'', jk:'L', kelas:'', password:'', sesi:'1', status:false}); setShowModalSiswa(true); }} title="Tambah Siswa" style={{ padding: '10px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>➕</button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>No</th>
                    <th style={{ padding: '12px' }}>No Peserta</th>
                    <th style={{ padding: '12px' }}>Nama Lengkap</th>
                    <th style={{ padding: '12px' }}>L/P</th>
                    <th style={{ padding: '12px' }}>Kelas</th>
                    <th style={{ padding: '12px' }}>Password</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Sesi</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>{students.map((s, idx) => (
                  <tr key={s.no_peserta} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>{idx + 1}</td>
                    <td style={{ padding: '12px' }}>{s.no_peserta}</td>
                    <td style={{ padding: '12px' }}>{s.nama_lengkap}</td>
                    <td style={{ padding: '12px' }}>{s.jk}</td>
                    <td style={{ padding: '12px' }}>{s.kelas}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>{s.password}</td>
                    <td style={{ padding: '12px' }}>
                      <button onClick={async () => { await supabase.from('data_siswa').update({status: !s.status}).eq('no_peserta', s.no_peserta); fetchData(); }} style={{ backgroundColor: s.status ? '#22c55e' : '#cbd5e1', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', cursor: 'pointer' }}>{s.status ? 'ON' : 'OFF'}</button>
                    </td>
                    <td style={{ padding: '12px' }}>{s.sesi}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => { setFormSiswa(s); setIsEdit(true); setShowModalSiswa(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>📝</button>
                      <button onClick={async () => { if(confirm('Hapus?')) { await supabase.from('data_siswa').delete().eq('no_peserta', s.no_peserta); fetchData(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>🗑️</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL USER */}
      {showModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h3>{isEdit ? 'Edit Admin' : 'Tambah Admin'}</h3>
            <form onSubmit={handleUserSubmit}>
              <input placeholder="Username" value={formUser.username} onChange={e => setFormUser({...formUser, username: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd' }} required />
              <input placeholder="Nama Lengkap" value={formUser.nama_lengkap} onChange={e => setFormUser({...formUser, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd' }} required />
              <input type="password" placeholder="Password" value={formUser.password} onChange={e => setFormUser({...formUser, password: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd' }} required />
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Simpan</button>
              <button type="button" onClick={() => setShowModalUser(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>Batal</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SISWA LENGKAP */}
      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '450px' }}>
            <h3>{isEdit ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
            <form onSubmit={handleSiswaSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input placeholder="No Peserta" value={formSiswa.no_peserta} disabled={isEdit} onChange={e => setFormSiswa({...formSiswa, no_peserta: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} required />
              <input placeholder="Nama Lengkap" value={formSiswa.nama_lengkap} onChange={e => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} required />
              <select value={formSiswa.jk} onChange={e => setFormSiswa({...formSiswa, jk: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
              <input placeholder="Kelas" value={formSiswa.kelas} onChange={e => setFormSiswa({...formSiswa, kelas: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} required />
              <input placeholder="Password" value={formSiswa.password} onChange={e => setFormSiswa({...formSiswa, password: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} required />
              <input placeholder="Sesi" value={formSiswa.sesi} onChange={e => setFormSiswa({...formSiswa, sesi: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} required />
              <div style={{ gridColumn: 'span 2' }}>
                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Simpan Data</button>
                <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}