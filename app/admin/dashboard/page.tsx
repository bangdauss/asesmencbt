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
  const [isEditSiswa, setIsEditSiswa] = useState(false)
  const [formSiswa, setFormSiswa] = useState({
    no_peserta: '', nama_lengkap: '', jk: 'L', kelas: '', password: '', sesi: '1', status: false
  })

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
      alert("Password baru berhasil di-generate!");
    }
  }

  const toggleStatus = async (no: string, stat: boolean) => {
    await supabase.from('data_siswa').update({ status: !stat }).eq('no_peserta', no)
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

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>🔄 Menyiapkan Dashboard...</div>

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
          {activeMenu === 'dashboard' && (
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: 0, color: '#64748b' }}>Total Admin</p>
                <h2 style={{ margin: '5px 0 0' }}>{users.length}</h2>
              </div>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: 0, color: '#64748b' }}>Total Siswa</p>
                <h2 style={{ margin: '5px 0 0' }}>{students.length}</h2>
              </div>
            </div>
          )}

          {activeMenu === 'user' && (
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
              <h3>USER</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}><th style={{ padding: '10px' }}>Username</th><th style={{ padding: '10px' }}>Nama Lengkap</th></tr></thead>
                <tbody>{users.map(u => (<tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '10px' }}>{u.username}</td><td style={{ padding: '10px' }}>{u.nama_lengkap}</td></tr>))}</tbody>
              </table>
            </div>
          )}

          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Daftar Murid</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={generateAllPasswords} style={{ padding: '8px 15px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🔑 Generate</button>
                  <button onClick={() => { setIsEditSiswa(false); setShowModalSiswa(true); }} style={{ padding: '8px 15px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🎓 Tambah</button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>No Peserta</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Nama</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Password</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.no_peserta} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>{s.no_peserta}</td>
                      <td style={{ padding: '12px' }}>{s.nama_lengkap}</td>
                      <td style={{ padding: '12px', color: '#2563eb', fontWeight: 'bold', fontFamily: 'monospace' }}>{s.password}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => toggleStatus(s.no_peserta, s.status)} style={{ backgroundColor: s.status ? '#22c55e' : '#94a3b8', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '15px', fontSize: '11px', cursor: 'pointer' }}>{s.status ? 'Aktif' : 'Off'}</button>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => { setFormSiswa(s); setIsEditSiswa(true); setShowModalSiswa(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '400px' }}>
            <h3 style={{ marginTop: 0 }}>{isEditSiswa ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
            <form onSubmit={handleSiswaSubmit}>
              <input placeholder="No Peserta" value={formSiswa.no_peserta} disabled={isEditSiswa} onChange={e => setFormSiswa({...formSiswa, no_peserta: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }} required />
              <input placeholder="Nama Lengkap" value={formSiswa.nama_lengkap} onChange={e => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }} required />
              <input placeholder="Password" value={formSiswa.password} onChange={e => setFormSiswa({...formSiswa, password: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px' }} required />
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan Data</button>
              <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>Batal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}