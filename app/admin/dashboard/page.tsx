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
    no_peserta: '', nama_lengkap: '', jk: '', kelas: '', password: '', sesi: '1', status: false
  })

  const fetchData = async () => {
    const { data: userData } = await supabase.from('admin_user').select('*').order('id', { ascending: true })
    if (userData) setUsers(userData)
    const { data: studentData } = await supabase.from('data_siswa').select('*').order('no_peserta', { ascending: true })
    if (studentData) setStudents(studentData)
  }

  useEffect(() => { fetchData() }, [])

  // FUNGSI GENERATE PASSWORD: Huruf Besar, Kecil, Angka + * di akhir
  const generateAllPasswords = async () => {
    if (confirm("Generate password (Besar, Kecil, Angka, *) untuk SEMUA siswa?")) {
      const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
      const lower = "abcdefghijkmnopqrstuvwxyz";
      const nums = "23456789";
      const allChars = upper + lower + nums;
      
      const newStudents = await Promise.all(students.map(async (s) => {
        let randomPart = "";
        
        // Pastikan minimal ada 1 Huruf Besar, 1 Huruf Kecil, dan 1 Angka agar variatif
        randomPart += upper.charAt(Math.floor(Math.random() * upper.length));
        randomPart += lower.charAt(Math.floor(Math.random() * lower.length));
        randomPart += nums.charAt(Math.floor(Math.random() * nums.length));
        
        // Sisa 2 karakter diambil acak dari semua kumpulan
        for (let i = 0; i < 2; i++) {
          randomPart += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }

        // Acak urutan 5 karakter pertama supaya posisinya tidak selalu sama
        const shuffled = randomPart.split('').sort(() => 0.5 - Math.random()).join('');
        const newPass = shuffled + "*"; // Bintang tetap di urutan ke-6

        await supabase.from('data_siswa').update({ password: newPass }).eq('no_peserta', s.no_peserta);
        return { ...s, password: newPass };
      }));
      
      setStudents(newStudents);
      alert("Password kompleks dengan bintang di akhir berhasil dibuat!");
    }
  }

  const toggleAllStatus = async (targetStatus: boolean) => {
    const confirmMsg = targetStatus ? "Aktifkan SEMUA siswa?" : "Nonaktifkan SEMUA siswa?";
    if (confirm(confirmMsg)) {
      await supabase.from('data_siswa').update({ status: targetStatus }).neq('no_peserta', 'x') 
      fetchData();
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
                  <h4 style={{ margin: 0, color: '#64748b' }}>Total Admin</h4>
                  <h2 style={{ margin: '10px 0 0 0' }}>{users.length}</h2>
                </div>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #22c55e' }}>
                  <h4 style={{ margin: 0, color: '#64748b' }}>Total Siswa</h4>
                  <h2 style={{ margin: '10px 0 0 0' }}>{students.length}</h2>
                </div>
             </div>
          )}

          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>MANAJEMEN SISWA</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button title="Generate Password Kompleks" onClick={generateAllPasswords} style={{ backgroundColor: '#f59e0b', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '18px' }}>🔑</button>
                  <button title="Tambah Siswa" onClick={() => { setIsEditSiswa(false); setFormSiswa({no_peserta:'', nama_lengkap:'', jk:'', kelas:'', password:'', sesi:'1', status:false}); setShowModalSiswa(true); }} style={{ backgroundColor: '#1e293b', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '18px' }}>👨‍🎓</button>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#475569', color: 'white' }}>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>No</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>No Peserta</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Nama</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Password</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Sesi</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>L/P</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Kelas</th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>
                        STATUS <br/>
                        <div style={{ marginTop: '5px', display: 'flex', gap: '2px', justifyContent: 'center' }}>
                          <button onClick={() => toggleAllStatus(true)} style={{ fontSize: '8px', cursor: 'pointer', backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '2px 5px' }}>ON</button>
                          <button onClick={() => toggleAllStatus(false)} style={{ fontSize: '8px', cursor: 'pointer', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '2px 5px' }}>OFF</button>
                        </div>
                      </th>
                      <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, index) => (
                      <tr key={s.no_peserta} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{index + 1}</td>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{s.no_peserta}</td>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{s.nama_lengkap}</td>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1', color: '#2563eb', fontWeight: 'bold' }}>{s.password}</td>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{s.sesi}</td>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{s.jk}</td>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{s.kelas}</td>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                          <button onClick={() => toggleStatus(s.no_peserta, s.status)} style={{ backgroundColor: s.status ? '#22c55e' : '#94a3b8', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '10px', cursor: 'pointer', fontSize: '10px' }}>
                            {s.status ? 'ON' : 'OFF'}
                          </button>
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                          <button onClick={() => { setIsEditSiswa(true); setFormSiswa(s); setShowModalSiswa(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✏️</button>
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
            <h3 style={{ marginTop: 0 }}>{isEditSiswa ? '✏️ Edit Siswa' : '➕ Tambah Siswa'}</h3>
            <form onSubmit={handleSiswaSubmit}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>No Peserta</label>
              <input value={formSiswa.no_peserta} disabled={isEditSiswa} onChange={(e) => setFormSiswa({...formSiswa, no_peserta: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px', border: '1px solid #ccc' }} required />
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
              <input value={formSiswa.password} onChange={(e) => setFormSiswa({...formSiswa, password: e.target.value})} style={{ width: '100%', marginBottom: isEditSiswa ? '10px' : '20px', padding: '8px', border: '1px solid #ccc' }} required />
              {isEditSiswa && (
                <>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Sesi</label>
                  <input value={formSiswa.sesi} onChange={(e) => setFormSiswa({...formSiswa, sesi: e.target.value})} style={{ width: '100%', marginBottom: '20px', padding: '8px', border: '1px solid #ccc' }} required />
                </>
              )}
              <button type="submit" style={{ backgroundColor: '#3b82f6', color: 'white', width: '100%', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Simpan Data</button>
              <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', marginTop: '10px', padding: '10px', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Batal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}