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

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#64748b' }}>⌛ Sinkronisasi Data...</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc' }}>
      {/* SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#0f172a', color: 'white', position: 'fixed', height: '100vh' }}>
        <div style={{ padding: '30px 24px', fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ backgroundColor: '#3b82f6', padding: '4px 8px', borderRadius: '8px' }}>E</span> e-Asesmen
        </div>
        <nav style={{ padding: '0 12px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'user', label: 'Data Pengguna', icon: '👤' },
            { id: 'siswa', label: 'Data Siswa', icon: '🎓' },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              style={{
                padding: '12px 16px',
                margin: '4px 0',
                cursor: 'pointer',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                backgroundColor: activeMenu === item.id ? '#1e293b' : 'transparent',
                color: activeMenu === item.id ? '#3b82f6' : '#94a3b8',
                fontWeight: activeMenu === item.id ? '600' : '400'
              }}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, marginLeft: '260px' }}>
        <header style={{ padding: '20px 40px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>Panel Administrator</h1>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Tahun Pelajaran 2025/2026</div>
        </header>
        
        <main style={{ padding: '40px' }}>
          {/* DASHBOARD VIEW - TIDAK KOSONG LAGI */}
          {activeMenu === 'dashboard' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Statistik Sistem</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Total Admin</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>{users.length}</div>
                </div>
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Total Siswa</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>{students.length}</div>
                </div>
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Siswa Aktif</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#22c55e', marginTop: '8px' }}>{students.filter(s => s.status).length}</div>
                </div>
              </div>
            </div>
          )}

          {/* SISWA VIEW */}
          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Daftar Murid</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => toggleAllStatus(true)} style={{ padding: '8px 16px', backgroundColor: '#dcfce7', color: '#166534', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>ON ALL</button>
                  <button onClick={() => toggleAllStatus(false)} style={{ padding: '8px 16px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>OFF ALL</button>
                  <button onClick={generateAllPasswords} title="Generate Password" style={{ padding: '8px 12px', backgroundColor: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🔑</button>
                  <button onClick={() => { setIsEdit(false); setFormSiswa({no_peserta:'', nama_lengkap:'', jk:'L', kelas:'', password:'', sesi:'1', status:false}); setShowModalSiswa(true); }} style={{ padding: '8px 12px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>➕</button>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700' }}>
                      <th style={{ padding: '16px 24px' }}>No</th>
                      <th style={{ padding: '16px 24px' }}>No Peserta</th>
                      <th style={{ padding: '16px 24px' }}>Nama Lengkap</th>
                      <th style={{ padding: '16px 24px' }}>Status</th>
                      <th style={{ padding: '16px 24px' }}>Sesi</th>
                      <th style={{ padding: '16px 24px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>{students.map((s, idx) => (
                    <tr key={s.no_peserta} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem', color: '#334155' }}>
                      <td style={{ padding: '16px 24px' }}>{idx + 1}</td>
                      <td style={{ padding: '16px 24px', fontWeight: '600' }}>{s.no_peserta}</td>
                      <td style={{ padding: '16px 24px' }}>{s.nama_lengkap}</td>
                      <td style={{ padding: '16px 24px' }}>
                        {/* TOGGLE ON/OFF DI KOLOM STATUS */}
                        <div 
                          onClick={async () => { await supabase.from('data_siswa').update({status: !s.status}).eq('no_peserta', s.no_peserta); fetchData(); }}
                          style={{ 
                            width: '44px', height: '22px', backgroundColor: s.status ? '#22c55e' : '#cbd5e1', 
                            borderRadius: '100px', cursor: 'pointer', position: 'relative', transition: '0.3s' 
                          }}
                        >
                          <div style={{ 
                            width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', 
                            position: 'absolute', top: '2px', left: s.status ? '24px' : '2px', transition: '0.3s' 
                          }} />
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>{s.sesi}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <button onClick={() => { setFormSiswa(s); setIsEdit(true); setShowModalSiswa(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer', marginRight: '12px' }}>📝</button>
                        <button onClick={async () => { if(confirm('Hapus?')) { await supabase.from('data_siswa').delete().eq('no_peserta', s.no_peserta); fetchData(); } }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL SISWA - JAUH LEBIH CAKEP */}
      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '24px', color: '#0f172a' }}>{isEdit ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
            <form onSubmit={handleSiswaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '6px', display: 'block' }}>No Peserta</label>
                  <input placeholder="Ex: 001" value={formSiswa.no_peserta} disabled={isEdit} onChange={e => setFormSiswa({...formSiswa, no_peserta: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '6px', display: 'block' }}>Kelas</label>
                  <input placeholder="Ex: 6A" value={formSiswa.kelas} onChange={e => setFormSiswa({...formSiswa, kelas: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '6px', display: 'block' }}>Nama Lengkap</label>
                <input placeholder="Nama Lengkap Siswa" value={formSiswa.nama_lengkap} onChange={e => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '6px', display: 'block' }}>Jenis Kelamin</label>
                  <select value={formSiswa.jk} onChange={e => setFormSiswa({...formSiswa, jk: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '6px', display: 'block' }}>Sesi Ujian</label>
                  <input type="number" value={formSiswa.sesi} onChange={e => setFormSiswa({...formSiswa, sesi: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '6px', display: 'block' }}>Password</label>
                <input placeholder="Password Akses" value={formSiswa.password} onChange={e => setFormSiswa({...formSiswa, password: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }} required />
              </div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}>Simpan Data Siswa</button>
                <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}