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
  
  // State untuk Modal & Form
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [isEditSiswa, setIsEditSiswa] = useState(false)
  const [formSiswa, setFormSiswa] = useState({
    no_peserta: '', nama_lengkap: '', jk: '', kelas: '', password: '', sesi: '', status: false
  })

  // Fungsi Fetch Data dari Supabase
  const fetchData = async () => {
    const { data: userData } = await supabase.from('admin_user').select('*').order('id', { ascending: true })
    if (userData) setUsers(userData)
    
    const { data: studentData } = await supabase.from('data_siswa').select('*').order('no_peserta', { ascending: true })
    if (studentData) setStudents(studentData)
  }

  useEffect(() => { fetchData() }, [])

  // Fungsi Simpan/Update Siswa
  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditSiswa) {
      const { error } = await supabase.from('data_siswa').update(formSiswa).eq('no_peserta', formSiswa.no_peserta)
      if (!error) alert('Data Siswa Berhasil Diperbarui!')
    } else {
      const { error } = await supabase.from('data_siswa').insert([formSiswa])
      if (!error) alert('Siswa Berhasil Ditambahkan!')
    }
    setShowModalSiswa(false)
    fetchData()
  }

  // Fungsi Toggle ON/OFF Status Asesmen
  const toggleStatus = async (no_peserta: string, currentStatus: boolean) => {
    await supabase.from('data_siswa').update({ status: !currentStatus }).eq('no_peserta', no_peserta)
    fetchData()
  }

  // Fungsi Hapus Siswa
  const deleteSiswa = async (no_peserta: string, nama: string) => {
    if (confirm(`Hapus siswa: ${nama}?`)) {
      await supabase.from('data_siswa').delete().eq('no_peserta', no_peserta)
      fetchData()
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#e2e8f0' }}>
      
      {/* SIDEBAR BACKEND */}
      <div style={{ width: '260px', backgroundColor: '#1e293b', color: '#cbd5e1' }}>
        <div style={{ padding: '20px', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold' }}>📖 e-Asesmen SMA</div>
        <nav style={{ marginTop: '10px' }}>
          <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#334155' : 'transparent', color: 'white' }}>📊 Dashboard</div>
          <div onClick={() => setActiveMenu('user')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'user' ? '#334155' : 'transparent', color: 'white' }}>👤 Data Pengguna</div>
          <div onClick={() => setActiveMenu('siswa')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'siswa' ? '#334155' : 'transparent', color: 'white' }}>🎓 Data Siswa</div>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1 }}>
        <div style={{ height: '60px', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', padding: '0 25px' }}>Administrator (Admin)</div>
        
        <div style={{ padding: '25px' }}>
          
          {/* MENU 1: DASHBOARD STATISTIK */}
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

          {/* MENU 2: DATA PENGGUNA (ADMIN) */}
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

          {/* MENU 3: DATA SISWA */}
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