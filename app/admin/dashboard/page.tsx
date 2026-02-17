'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [users, setUsers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  
  // STATE UNTUK MODAL SISWA (Digunakan untuk Edit saja)
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
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + '*';
  }

  const handleGeneratePassword = () => {
    setFormSiswa({ ...formSiswa, password: generateSecurePassword() });
  }

  const generateAllPasswords = async () => {
    if (confirm("Generate password baru untuk SEMUA siswa?")) {
      const { data: allStudents } = await supabase.from('data_siswa').select('no_peserta');
      if (allStudents) {
        const updates = allStudents.map(siswa => {
          return supabase
            .from('data_siswa')
            .update({ password: generateSecurePassword() })
            .eq('no_peserta', siswa.no_peserta);
        });
        await Promise.all(updates);
        alert("Berhasil memperbarui semua password siswa!");
        fetchData();
      }
    }
  }

  // --- LOGIK IMPORT (HAPUS DATA LAMA & GANTI BARU) ---
  const downloadTemplate = () => {
    const template = [
      { no_peserta: '1001', nama_lengkap: 'Ahmad Siswa', jk: 'L', kelas: '6A', password: 'auto', sesi: '1' },
      { no_peserta: '1002', nama_lengkap: 'Siti Siswi', jk: 'P', kelas: '6B', password: 'auto', sesi: '2' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Siswa");
    XLSX.writeFile(wb, "template_import_siswa.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("PERINGATAN: Seluruh data siswa lama akan DIHAPUS dan diganti dengan data baru. Lanjutkan?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      const formattedData = data.map(item => ({
        no_peserta: String(item.no_peserta),
        nama_lengkap: item.nama_lengkap,
        jk: item.jk,
        kelas: String(item.kelas),
        password: item.password === 'auto' ? generateSecurePassword() : String(item.password),
        sesi: item.sesi,
        status: false
      }));

      try {
        // Hapus semua data lama
        await supabase.from('data_siswa').delete().neq('no_peserta', '0');
        
        // Masukkan data baru
        const { error } = await supabase.from('data_siswa').insert(formattedData);
        
        if (error) throw error;

        alert(`Berhasil! Data lama dihapus dan ${data.length} data baru telah di-import.`);
        fetchData();
      } catch (err: any) {
        alert("Gagal Import: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  // --- LOGIK DATA PENGGUNA (ADMIN) ---
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
    if (confirm(targetStatus ? "Aktifkan SEMUA siswa?" : "Nonaktifkan SEMUA siswa?")) {
      await supabase.from('data_siswa').update({ status: targetStatus }).neq('no_peserta', '0') 
      fetchData();
    }
  }

  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditSiswa) {
      await supabase.from('data_siswa').update(formSiswa).eq('no_peserta', formSiswa.no_peserta)
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
            <span style={{ fontSize: '12px', color: '#64748b' }}>2025/2026</span>
        </div>
        
        <div style={{ padding: '25px' }}>
          {activeMenu === 'dashboard' && (
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ color: '#64748b', margin: '0 0 10px 0' }}>Total Pengguna</h4>
                  <h2 style={{ margin: 0, fontSize: '28px' }}>{users.length}</h2>
                </div>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ color: '#64748b', margin: '0 0 10px 0' }}>Total Siswa</h4>
                  <h2 style={{ margin: 0, fontSize: '28px' }}>{students.length}</h2>
                </div>
             </div>
          )}

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
                                  <button onClick={() => { setIsEditUser(true); setFormUser(u); setShowModalUser(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>📝</button>
                                  <button onClick={() => deleteUser(u.id, u.username)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}

          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Data Siswa ({students.length})</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={downloadTemplate} style={{ backgroundColor: '#64748b', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📥 Template</button>
                    <label style={{ backgroundColor: '#1e293b', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      📁 Import Excel
                      <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} style={{ display: 'none' }} />
                    </label>
                    <button onClick={generateAllPasswords} style={{ backgroundColor: '#f59e0b', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>🎲 Password</button>
                </div>
              </div>
              <div style={{ padding: '0 20px 20px 20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ padding: '12px', textAlign: 'center' }}>No</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>No Peserta</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Nama</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>L/P</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Kelas</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Password</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>
                         <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button onClick={() => toggleAllStatus(true)} style={{ fontSize: '9px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 4px' }}>ON ALL</button>
                            <button onClick={() => toggleAllStatus(false)} style={{ fontSize: '9px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 4px' }}>OFF ALL</button>
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
                        <td style={{ padding: '12px', color: '#3b82f6' }}>{s.password}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button onClick={() => toggleStatus(s.no_peserta, s.status)} style={{ backgroundColor: s.status ? '#22c55e' : '#94a3b8', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '10px' }}>{s.status ? 'ON' : 'OFF'}</button>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{s.sesi}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button onClick={() => { setIsEditSiswa(true); setFormSiswa(s); setShowModalSiswa(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>📝</button>
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

      {/* MODAL EDIT SISWA */}
      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', width: '400px', borderRadius: '12px' }}>
            <h3>Edit Data Siswa</h3>
            <form onSubmit={handleSiswaSubmit}>
              <input value={formSiswa.no_peserta} disabled style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#eee' }} />
              <input placeholder="Nama" value={formSiswa.nama_lengkap} onChange={(e) => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} required />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select value={formSiswa.jk} onChange={(e) => setFormSiswa({...formSiswa, jk: e.target.value})} style={{ flex: 1, padding: '10px' }}>
                    <option value="L">L</option>
                    <option value="P">P</option>
                </select>
                <input placeholder="Kelas" value={formSiswa.kelas} onChange={(e) => setFormSiswa({...formSiswa, kelas: e.target.value})} style={{ flex: 1, padding: '10px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input placeholder="Password" value={formSiswa.password} onChange={(e) => setFormSiswa({...formSiswa, password: e.target.value})} style={{ flex: 1, padding: '10px' }} />
                <button type="button" onClick={handleGeneratePassword} style={{ padding: '10px' }}>🔑</button>
              </div>
              <input type="number" placeholder="Sesi" value={formSiswa.sesi} onChange={(e) => setFormSiswa({...formSiswa, sesi: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '20px' }} />
              <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px' }}>Update</button>
              <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', marginTop: '10px', border: 'none', background: 'none' }}>Batal</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADMIN (Tetap sama) */}
      {showModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', width: '350px', borderRadius: '12px' }}>
            <h3>{isEditUser ? 'Edit Admin' : 'Tambah Admin'}</h3>
            <form onSubmit={handleUserSubmit}>
              <input placeholder="Username" value={formUser.username} onChange={(e) => setFormUser({...formUser, username: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} required />
              <input placeholder="Nama Lengkap" value={formUser.nama_lengkap} onChange={(e) => setFormUser({...formUser, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} required />
              <input placeholder="Password" value={formUser.password} onChange={(e) => setFormUser({...formUser, password: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '20px' }} required />
              <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '6px' }}>Simpan</button>
              <button type="button" onClick={() => setShowModalUser(false)} style={{ width: '100%', marginTop: '10px', border: 'none', background: 'none' }}>Batal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}