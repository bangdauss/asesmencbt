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
  
  // STATE MODAL SISWA
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [isEditSiswa, setIsEditSiswa] = useState(false)
  const [formSiswa, setFormSiswa] = useState({
    no_peserta: '', nama_lengkap: '', jk: '', kelas: '', password: '', sesi: '', status: false
  })

  // STATE GENERATE NO PESERTA (BARU)
  const [showModalGenNoPes, setShowModalGenNoPes] = useState(false)
  const [kodeSekolah, setKodeSekolah] = useState('')

  // STATE MODAL ADMIN
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

  // --- LOGIK GENERATE NO PESERTA (NEW) ---
  const handleGenerateNoPeserta = async () => {
    if (!kodeSekolah || kodeSekolah.trim() === "") {
      alert("Silakan input Kode Sekolah terlebih dahulu!");
      return;
    }

    if (confirm(`Generate No Peserta otomatis untuk ${students.length} siswa dengan awalan ${kodeSekolah}?`)) {
      try {
        // Kita gunakan data students yang sudah ter-order dari state
        const updates = students.map((siswa, index) => {
          const noUrut = String(index + 1).padStart(3, '0'); // Format 001, 002, dst
          const noPesertaBaru = `${kodeSekolah}${noUrut}`;
          
          return supabase
            .from('data_siswa')
            .update({ no_peserta: noPesertaBaru })
            .eq('no_peserta', siswa.no_peserta);
        });

        await Promise.all(updates);
        alert("Sukses! Nomor peserta telah diperbarui.");
        setShowModalGenNoPes(false);
        setKodeSekolah('');
        fetchData();
      } catch (err: any) {
        alert("Gagal update No Peserta: " + err.message);
      }
    }
  }

  // --- LOGIK IMPORT ---
  const downloadTemplate = () => {
    const template = [
      { no_peserta: '1001', nama_lengkap: 'Contoh Nama', jk: 'L', kelas: '6A', password: 'auto', sesi: '1' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Siswa");
    XLSX.writeFile(wb, "template_siswa.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("PERINGATAN: Seluruh data siswa LAMA akan DIHAPUS. Ganti dengan data baru?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data: any[] = XLSX.utils.sheet_to_json(XLSX.read(evt.target?.result, { type: 'binary' }).Sheets[XLSX.read(evt.target?.result, { type: 'binary' }).SheetNames[0]]);
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
        await supabase.from('data_siswa').delete().neq('no_peserta', '0');
        const { error } = await supabase.from('data_siswa').insert(formattedData);
        if (error) throw error;
        alert(`Sukses Import ${data.length} data.`);
        fetchData();
      } catch (err: any) {
        alert("Gagal Import: Pastikan No Peserta tidak ada yang ganda di database.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  // --- LOGIK ADMIN & SISWA ---
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditUser) {
      await supabase.from('admin_user').update(formUser).eq('id', formUser.id)
    } else {
      await supabase.from('admin_user').insert([formUser])
    }
    setShowModalUser(false); fetchData();
  }

  const deleteUser = async (id: number, username: string) => {
    if (confirm(`Hapus admin: ${username}?`)) {
      await supabase.from('admin_user').delete().eq('id', id); fetchData();
    }
  }

  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditSiswa) {
      await supabase.from('data_siswa').update(formSiswa).eq('no_peserta', formSiswa.no_peserta)
    }
    setShowModalSiswa(false); fetchData();
  }

  const toggleStatus = async (no_peserta: string, currentStatus: boolean) => {
    await supabase.from('data_siswa').update({ status: !currentStatus }).eq('no_peserta', no_peserta)
    fetchData()
  }

  const deleteSiswa = async (no_peserta: string, nama: string) => {
    if (confirm(`Hapus siswa: ${nama}?`)) {
      await supabase.from('data_siswa').delete().eq('no_peserta', no_peserta); fetchData();
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f1f5f9' }}>
      {/* SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#1e293b', color: '#cbd5e1' }}>
        <div style={{ padding: '20px', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold' }}>🚀 e-Asesmen</div>
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
                  <h4 style={{ color: '#64748b', margin: '0 0 10px 0' }}>Total Admin</h4>
                  <h2 style={{ margin: 0, fontSize: '28px' }}>{users.length}</h2>
                </div>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ color: '#64748b', margin: '0 0 10px 0' }}>Total Siswa</h4>
                  <h2 style={{ margin: 0, fontSize: '28px' }}>{students.length}</h2>
                </div>
             </div>
          )}

          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Data Siswa ({students.length})</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowModalGenNoPes(true)} style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>🆔 Gen NoPes</button>
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
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                      <th style={{ padding: '12px', textAlign: 'center' }}>No</th>
                      <th style={{ padding: '12px' }}>No Peserta</th>
                      <th style={{ padding: '12px' }}>Nama</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>L/P</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Kelas</th>
                      <th style={{ padding: '12px' }}>Password</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, index) => (
                      <tr key={s.no_peserta} 
                          style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} 
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')} 
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                        <td style={{ padding: '12px' }}>{s.no_peserta}</td>
                        <td style={{ padding: '12px' }}>{s.nama_lengkap}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{s.jk}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{s.kelas}</td>
                        <td style={{ padding: '12px', color: '#3b82f6', fontWeight: 'bold' }}>{s.password}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button onClick={() => toggleStatus(s.no_peserta, s.status)} style={{ backgroundColor: s.status ? '#22c55e' : '#94a3b8', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>{s.status ? 'ON' : 'OFF'}</button>
                        </td>
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

      {/* MODAL GENERATE NO PESERTA (NEW) */}
      {showModalGenNoPes && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '350px' }}>
            <h3 style={{ marginTop: 0 }}>Auto-Generate No Peserta</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>No Peserta akan diatur ulang menjadi: <br/> <b>Kode Sekolah + No Urut (001...)</b></p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Kode Sekolah</label>
              <input 
                placeholder="Masukkan Kode (misal: 050658)" 
                value={kodeSekolah} 
                onChange={(e) => setKodeSekolah(e.target.value)} 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowModalGenNoPes(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#f1f5f9', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleGenerateNoPeserta} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Generate</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT SISWA */}
      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', width: '400px', borderRadius: '12px' }}>
            <h3>Edit Data Siswa</h3>
            <form onSubmit={handleSiswaSubmit}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>No Peserta</label>
                <input value={formSiswa.no_peserta} disabled style={{ width: '100%', padding: '10px', backgroundColor: '#f1f5f9' }} />
              </div>
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
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Update Data</button>
              <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', marginTop: '10px', border: 'none', background: 'none', cursor: 'pointer' }}>Batal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}