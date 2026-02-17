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
      console.error("Gagal ambil data:", err)
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
      
      for (const s of students) {
        let res = "";
        res += upper[Math.floor(Math.random() * upper.length)];
        res += lower[Math.floor(Math.random() * lower.length)];
        res += nums[Math.floor(Math.random() * nums.length)];
        for(let i=0; i<2; i++) res += all[Math.floor(Math.random() * all.length)];
        
        const finalPass = res.split('').sort(() => 0.5 - Math.random()).join('') + "*";
        await supabase.from('data_siswa').update({ password: finalPass }).eq('no_peserta', s.no_peserta);
      }
      fetchData();
      alert("Password berhasil di-generate dengan tanda * di akhir!");
    }
  }

  const toggleStatus = async (no: string, stat: boolean) => {
    await supabase.from('data_siswa').update({ status: !stat }).eq('no_peserta', no)
    fetchData()
  }

  const deleteSiswa = async (no: string, nama: string) => {
    if (confirm(`Hapus siswa ${nama}?`)) {
      await supabase.from('data_siswa').delete().eq('no_peserta', no)
      fetchData()
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

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat Sistem...</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc' }}>
      {/* SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#1e293b', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '25px 20px', fontSize: '1.2rem', fontWeight: 'bold', background: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>📖</span> e-Asesmen SMA
        </div>
        <nav style={{ flex: 1, paddingTop: '10px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'user', label: 'Data Pengguna', icon: '👤' },
            { id: 'siswa', label: 'Data Siswa', icon: '🎓' }
          ].map((menu) => (
            <div 
              key={menu.id}
              onClick={() => setActiveMenu(menu.id)} 
              style={{ 
                padding: '15px 20px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                transition: '0.3s',
                backgroundColor: activeMenu === menu.id ? '#334155' : 'transparent',
                borderLeft: activeMenu === menu.id ? '4px solid #3b82f6' : '4px solid transparent'
              }}
            >
              <span>{menu.icon}</span> {menu.label}
            </div>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '70px', backgroundColor: 'white', display: 'flex', alignItems: 'center', padding: '0 30px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '600', color: '#64748b' }}>Administrator (Admin)</span>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date().toLocaleDateString('id-ID')}</span>
        </header>

        <main style={{ padding: '30px' }}>
          {activeMenu === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: '6px solid #3b82f6' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '5px' }}>Total Admin</p>
                <h1 style={{ margin: 0, fontSize: '2rem' }}>{users.length}</h1>
              </div>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: '6px solid #10b981' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '5px' }}>Total Siswa Terdaftar</p>
                <h1 style={{ margin: 0, fontSize: '2rem' }}>{students.length}</h1>
              </div>
            </div>
          )}

          {activeMenu === 'user' && (
            <div style={{ backgroundColor: 'white', padding: '0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold' }}>DAFTAR PENGGUNA SISTEM</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                    <th style={{ padding: '15px 20px', color: '#64748b' }}>Username</th>
                    <th style={{ padding: '15px 20px', color: '#64748b' }}>Nama Lengkap</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px 20px' }}>{u.username}</td>
                      <td style={{ padding: '15px 20px' }}>{u.nama_lengkap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', padding: '0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ margin: 0, color: '#1e293b' }}>MANAJEMEN DATA SISWA</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button title="Generate Password (*)" onClick={generateAllPasswords} style={{ padding: '10px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2rem' }}>🔑</button>
                  <button title="Tambah Siswa" onClick={() => { setIsEditSiswa(false); setFormSiswa({no_peserta:'', nama_lengkap:'', jk:'L', kelas:'', password:'', sesi:'1', status:false}); setShowModalSiswa(true); }} style={{ padding: '10px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2rem' }}>👨‍🎓</button>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ padding: '15px 20px' }}>No Peserta</th>
                      <th style={{ padding: '15px 20px' }}>Nama</th>
                      <th style={{ padding: '15px 20px' }}>Password</th>
                      <th style={{ padding: '15px 20px', textAlign: 'center' }}>L/P</th>
                      <th style={{ padding: '15px 20px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '15px 20px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.no_peserta} style={{ borderBottom: '1px solid #f1f5f9', hover: {backgroundColor: '#f8fafc'} }}>
                        <td style={{ padding: '15px 20px', fontWeight: '600' }}>{s.no_peserta}</td>
                        <td style={{ padding: '15px 20px' }}>{s.nama_lengkap}</td>
                        <td style={{ padding: '15px 20px', color: '#2563eb', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.1rem' }}>{s.password}</td>
                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>{s.jk}</td>
                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                          <button 
                            onClick={() => toggleStatus(s.no_peserta, s.status)} 
                            style={{ 
                              backgroundColor: s.status ? '#10b981' : '#94a3b8', 
                              color: 'white', border: 'none', padding: '6px 15px', 
                              borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' 
                            }}
                          >
                            {s.status ? 'AKTIF' : 'NONAKTIF'}
                          </button>
                        </td>
                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                          <button onClick={() => { setFormSiswa(s); setIsEditSiswa(true); setShowModalSiswa(true); }} style={{ cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.1rem', marginRight: '10px' }}>✏️</button>
                          <button onClick={() => deleteSiswa(s.no_peserta, s.nama_lengkap)} style={{ cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.1rem' }}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL FORM */}
      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zMount: 999 }}>
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '16px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isEditSiswa ? '✏️ Edit Data Siswa' : '➕ Tambah Siswa Baru'}
            </h3>
            <form onSubmit={handleSiswaSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>NO PESERTA</label>
                <input disabled={isEditSiswa} value={formSiswa.no_peserta} onChange={e => setFormSiswa({...formSiswa, no_peserta: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>NAMA LENGKAP</label>
                <input value={formSiswa.nama_lengkap} onChange={e => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>JK (L/P)</label>
                  <input maxLength={1} value={formSiswa.jk} onChange={e => setFormSiswa({...formSiswa, jk: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>KELAS</label>
                  <input value={formSiswa.kelas} onChange={e => setFormSiswa({...formSiswa, kelas: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>PASSWORD</label>
                <input value={formSiswa.password} onChange={e => setFormSiswa({...formSiswa, password: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }} required />
              </div>
              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>SIMPAN DATA</button>
              <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }}>BATAL</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}