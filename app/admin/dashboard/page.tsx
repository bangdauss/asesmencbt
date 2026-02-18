'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [users, setUsers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  
  // --- STATE ASLI BOS (UTUH) ---
  const [config, setConfig] = useState({ npsn: '', nama_sekolah: '' })
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [showModalImport, setShowModalImport] = useState(false) 
  const [isEditSiswa, setIsEditSiswa] = useState(false)
  const [formSiswa, setFormSiswa] = useState({
    no_peserta: '', nama_lengkap: '', jk: '', kelas: '', password: '', sesi: '', status: false
  })
  const [showModalGenNoPes, setShowModalGenNoPes] = useState(false)
  const [kodeSekolah, setKodeSekolah] = useState('')
  const [showModalUser, setShowModalUser] = useState(false)
  const [isEditUser, setIsEditUser] = useState(false)
  const [formUser, setFormUser] = useState({
    id: null, username: '', nama_lengkap: '', password: ''
  })

  // --- STATE FITUR BARU (MAPEL & SOAL) ---
  const [mapels, setMapels] = useState<any[]>([])
  const [asesmens, setAsesmens] = useState<any[]>([])
  const [soalList, setSoalList] = useState<any[]>([])
  const [selectedAsesmenId, setSelectedAsesmenId] = useState('')
  const [showModalMapel, setShowModalMapel] = useState(false)
  const [showModalAsesmen, setShowModalAsesmen] = useState(false)
  const [formMapel, setFormMapel] = useState({ id: null, nama_mapel: '', kode_mapel: '' })
  const [formAsesmen, setFormAsesmen] = useState({ id: null, id_mapel: '', kode_asesmen: '', nama_asesmen: '', status: false })

  // --- FETCH DATA (UTUH + DATA BARU) ---
  const fetchData = async () => {
    const { data: userData } = await supabase.from('admin_user').select('*').order('id', { ascending: true })
    if (userData) setUsers(userData)
    
    const { data: studentData } = await supabase.from('data_siswa').select('*').order('no_peserta', { ascending: true })
    if (studentData) setStudents(studentData)

    const { data: configData } = await supabase.from('pengaturan').select('*').maybeSingle()
    if (configData) setConfig(configData)

    const { data: mapelData } = await supabase.from('data_mapel').select('*').order('nama_mapel', { ascending: true })
    if (mapelData) setMapels(mapelData)

    const { data: asesmenData } = await supabase.from('data_asesmen').select('*, data_mapel(nama_mapel)').order('id', { ascending: false })
    if (asesmenData) setAsesmens(asesmenData)

    setIsLoadingConfig(false)
  }

  useEffect(() => { fetchData() }, [])

  // --- FITUR ASLI: CETAK KARTU (100% SAMA DENGAN KODE BOS) ---
  const cetakKartu = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const cardWidth = 90; const cardHeight = 60;
    const marginLeft = 10; const marginTop = 10;
    const gapX = 10; const gapY = 10;

    students.forEach((siswa, index) => {
      const pageIndex = index % 8;
      if (index !== 0 && pageIndex === 0) doc.addPage();
      const col = pageIndex % 2;
      const row = Math.floor(pageIndex / 2);
      const x = marginLeft + (col * (cardWidth + gapX));
      const y = marginTop + (row * (cardHeight + gapY));
      doc.setDrawColor(0);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text("KARTU PESERTA ASESMEN CBT", x + cardWidth / 2, y + 7, { align: 'center' });
      doc.setFontSize(9);
      doc.text((config.nama_sekolah || "NAMA SEKOLAH").toUpperCase(), x + cardWidth / 2, y + 12, { align: 'center' });
      doc.line(x + 5, y + 15, x + cardWidth - 5, y + 15);
      doc.setFont('helvetica', 'normal');
      doc.text("Nama", x + 5, y + 23);
      doc.text(": " + siswa.nama_lengkap, x + 25, y + 23);
      doc.text("User", x + 5, y + 29);
      doc.text(": " + siswa.no_peserta, x + 25, y + 29);
      doc.text("Password", x + 5, y + 35);
      doc.setFont('helvetica', 'bold');
      doc.text(": " + siswa.password, x + 25, y + 35);
      doc.rect(x + cardWidth - 22, y + 20, 16, 22, 'S');
      doc.setFontSize(6); doc.setFont('helvetica', 'normal');
      doc.text("FOTO 2x3", x + cardWidth - 14, y + 31, { align: 'center' });
      doc.setFontSize(7); doc.setFont('helvetica', 'italic');
      doc.text("*bawa kartu saat asesmen berlangsung", x + 5, y + cardHeight - 5);
    });
    doc.save(`Kartu_Peserta_${config.nama_sekolah || 'CBT'}.pdf`);
  };

  // --- FITUR ASLI: PENGATURAN & TOGGLE GLOBAL ---
  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('pengaturan').upsert({ npsn: config.npsn, nama_sekolah: config.nama_sekolah })
    if (error) alert("Gagal: " + error.message); else { alert("Berhasil!"); fetchData(); }
  }

  const toggleAllStatus = async (targetStatus: boolean) => {
    const pesan = targetStatus ? "Aktifkan akses ujian untuk SEMUA peserta?" : "Nonaktifkan akses ujian untuk SEMUA peserta?";
    if (confirm(pesan)) {
      try {
        const { error } = await supabase.from('data_siswa').update({ status: targetStatus }).neq('no_peserta', '0'); 
        if (error) throw error;
        alert("Status berhasil diperbarui!"); fetchData();
      } catch (err: any) { alert("Gagal: " + err.message); }
    }
  }

  const isAnyStudentActive = students.some(s => s.status === true);

  // --- FITUR ASLI: PASSWORD & NO PESERTA (PROMISE.ALL) ---
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); }
    return result + '*';
  }

  const handleGeneratePassword = () => { setFormSiswa({ ...formSiswa, password: generateSecurePassword() }); }

  const generateAllPasswords = async () => {
    if (confirm("Generate password baru untuk SEMUA siswa?")) {
      const { data: allStudents } = await supabase.from('data_siswa').select('no_peserta');
      if (allStudents) {
        const updates = allStudents.map(siswa => supabase.from('data_siswa').update({ password: generateSecurePassword() }).eq('no_peserta', siswa.no_peserta));
        await Promise.all(updates);
        alert("Semua password diperbarui!"); fetchData();
      }
    }
  }

  const handleGenerateNoPeserta = async () => {
    if (!kodeSekolah) { alert("Input Kode Sekolah!"); return; }
    if (confirm(`Generate No Peserta otomatis?`)) {
      try {
        const updates = students.map((siswa, index) => {
          const noPesertaBaru = `${kodeSekolah}${String(index + 1).padStart(3, '0')}`;
          return supabase.from('data_siswa').update({ no_peserta: noPesertaBaru }).eq('no_peserta', siswa.no_peserta);
        });
        await Promise.all(updates);
        alert("Nomor Peserta diperbarui!"); setShowModalGenNoPes(false); setKodeSekolah(''); fetchData();
      } catch (err: any) { alert("Gagal: " + err.message); }
    }
  }

  // --- FITUR ASLI: IMPORT & DOWNLOAD TEMPLATE ---
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ no_peserta: '1001', nama_lengkap: 'Nama', jk: 'L', kelas: '6A', password: 'auto', sesi: '1' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Siswa");
    XLSX.writeFile(wb, "template_siswa.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !confirm("Hapus data lama dan import baru?")) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data: any[] = XLSX.utils.sheet_to_json(XLSX.read(evt.target?.result, { type: 'binary' }).Sheets[XLSX.read(evt.target?.result, { type: 'binary' }).SheetNames[0]]);
      const formattedData = data.map(item => ({
        no_peserta: String(item.no_peserta), nama_lengkap: item.nama_lengkap, jk: item.jk, kelas: String(item.kelas),
        password: item.password === 'auto' ? generateSecurePassword() : String(item.password), sesi: item.sesi, status: false
      }));
      await supabase.from('data_siswa').delete().neq('no_peserta', '0');
      await supabase.from('data_siswa').insert(formattedData);
      alert("Import Selesai!"); setShowModalImport(false); fetchData();
    };
    reader.readAsBinaryString(file);
  };

  // --- FITUR ASLI: CRUD ADMIN & SISWA ---
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (isEditUser) { await supabase.from('admin_user').update(formUser).eq('id', formUser.id) } 
    else { await supabase.from('admin_user').insert([formUser]) }
    setShowModalUser(false); fetchData();
  }

  const deleteUser = async (id: number, username: string) => { 
    if (confirm(`Hapus admin: ${username}?`)) { await supabase.from('admin_user').delete().eq('id', id); fetchData(); } 
  }

  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (isEditSiswa) { await supabase.from('data_siswa').update(formSiswa).eq('no_peserta', formSiswa.no_peserta) }
    setShowModalSiswa(false); fetchData();
  }

  const toggleStatus = async (no_peserta: string, currentStatus: boolean) => {
    await supabase.from('data_siswa').update({ status: !currentStatus }).eq('no_peserta', no_peserta); fetchData();
  }

  const deleteSiswa = async (no_peserta: string, nama: string) => { 
    if (confirm(`Hapus siswa: ${nama}?`)) { await supabase.from('data_siswa').delete().eq('no_peserta', no_peserta); fetchData(); } 
  }

  // --- LOGIKA FITUR BARU: MASTER & BANK SOAL ---
  const handleMapelSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    await supabase.from('data_mapel').insert([{ nama_mapel: formMapel.nama_mapel, kode_mapel: formMapel.kode_mapel.toUpperCase() }]);
    setShowModalMapel(false); setFormMapel({id:null, nama_mapel:'', kode_mapel:''}); fetchData();
  }

 const handleAsesmenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Kita kirim kolomnya saja, JANGAN kirim ID
    const { error } = await supabase.from('data_asesmen').insert([{ 
      id_mapel: parseInt(formAsesmen.id_mapel), 
      kode_asesmen: formAsesmen.kode_asesmen.toUpperCase(), 
      nama_asesmen: formAsesmen.nama_asesmen, 
      status: false 
    }]);

    if (error) {
      alert("Gagal Simpan: " + error.message);
    } else {
      alert("Asesmen Berhasil Dibuat!");
      setShowModalAsesmen(false); 
      setFormAsesmen({id:null, id_mapel:'', kode_asesmen:'', nama_asesmen:'', status:false}); 
      fetchData();
    }
  }

  const toggleAsesmenStatus = async (id: number, current: boolean) => {
    await supabase.from('data_asesmen').update({ status: !current }).eq('id', id); fetchData();
  }

  const fetchSoal = async (id: string) => {
    const { data } = await supabase.from('bank_soal').select('*').eq('id_asesmen', id).order('id', { ascending: true });
    if (data) setSoalList(data);
  }

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !selectedAsesmenId) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        const formatted = json.map((s: any) => ({ ...s, id_asesmen: parseInt(selectedAsesmenId) }));
        await supabase.from('bank_soal').delete().eq('id_asesmen', selectedAsesmenId);
        await supabase.from('bank_soal').insert(formatted);
        alert("Soal berhasil diimport!"); fetchSoal(selectedAsesmenId);
      } catch (err) { alert("Format JSON tidak valid!"); }
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f1f5f9' }}>
      {/* SIDEBAR (UTUH + MENU BARU) */}
      <div style={{ width: '260px', backgroundColor: '#1e293b', color: '#cbd5e1' }}>
        <div style={{ padding: '20px', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold' }}>🚀 e-Asesmen</div>
        <nav style={{ marginTop: '10px' }}>
          <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#334155' : 'transparent', color: 'white' }}>📊 Dashboard</div>
          <div onClick={() => setActiveMenu('user')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'user' ? '#334155' : 'transparent', color: 'white' }}>👤 Data Pengguna</div>
          <div onClick={() => setActiveMenu('siswa')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'siswa' ? '#334155' : 'transparent', color: 'white' }}>🎓 Data Siswa</div>
          <div onClick={() => setActiveMenu('master')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'master' ? '#334155' : 'transparent', color: 'white' }}>📁 Data Master</div>
          <div onClick={() => setActiveMenu('soal')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'soal' ? '#334155' : 'transparent', color: 'white' }}>📚 Bank Soal</div>
        </nav>
      </div>

      <div style={{ flex: 1 }}>
        {/* HEADER */}
        <div style={{ height: '60px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{config.nama_sekolah || "Panel Administrator"}</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{config.npsn ? `NPSN: ${config.npsn}` : "V.2026.1"}</span>
        </div>
        
        <div style={{ padding: '25px' }}>
          {/* DASHBOARD (UTUH) */}
          {activeMenu === 'dashboard' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                      <h4 style={{ color: '#64748b', margin: '0 0 10px 0' }}>Total Admin</h4>
                      <h2 style={{ margin: 0, fontSize: '28px' }}>{users.length}</h2>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                      <h4 style={{ color: '#64748b', margin: '0 0 10px 0' }}>Total Siswa</h4>
                      <h2 style={{ margin: 0, fontSize: '28px' }}>{students.length}</h2>
                    </div>
                </div>
                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '20px' }}>⚙️ Pengaturan Sekolah</h3>
                  <form onSubmit={handleUpdateConfig} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
                    <input value={config.npsn} onChange={(e) => setConfig({...config, npsn: e.target.value})} placeholder="NPSN" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                    <input value={config.nama_sekolah} onChange={(e) => setConfig({...config, nama_sekolah: e.target.value})} placeholder="Nama Sekolah" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                    <button type="submit" style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>💾 Simpan Perubahan</button>
                  </form>
                </div>
              </div>
          )}

          {/* MANAJEMEN USER (UTUH) */}
          {activeMenu === 'user' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Data Pengguna Admin</h3>
                <button onClick={() => { setIsEditUser(false); setFormUser({id:null, username:'', nama_lengkap:'', password:''}); setShowModalUser(true); }} style={{ backgroundColor: '#1e293b', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px' }}>+ Tambah Admin</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}><th style={{ padding: '12px' }}>No</th><th style={{ padding: '12px' }}>Username</th><th style={{ padding: '12px' }}>Nama</th><th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th></tr></thead>
                <tbody>{users.map((u, i) => (<tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '12px' }}>{i+1}</td><td style={{ padding: '12px' }}>{u.username}</td><td style={{ padding: '12px' }}>{u.nama_lengkap}</td><td style={{ padding: '12px', textAlign: 'center' }}><button onClick={() => { setIsEditUser(true); setFormUser(u); setShowModalUser(true); }} style={{ border: 'none', background: 'none' }}>📝</button><button onClick={() => deleteUser(u.id, u.username)} style={{ border: 'none', background: 'none' }}>🗑️</button></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {/* DATA SISWA (UTUH) */}
          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Data Siswa ({students.length})</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={cetakKartu} style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>🖨️ Cetak Kartu</button>
                  <button onClick={() => setShowModalGenNoPes(true)} style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>🆔 Gen NoPes</button>
                  <button onClick={() => setShowModalImport(true)} style={{ backgroundColor: '#1e293b', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px' }}>📁 Import Siswa</button>
                  <button onClick={generateAllPasswords} style={{ backgroundColor: '#f59e0b', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>🎲 Password</button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>No Peserta</th><th style={{ padding: '12px' }}>Nama</th><th style={{ padding: '12px', textAlign: 'center' }}>L/P</th><th style={{ padding: '12px', textAlign: 'center' }}>Kelas</th><th style={{ padding: '12px' }}>Password</th><th style={{ padding: '12px', textAlign: 'center' }}><button onClick={() => toggleAllStatus(!isAnyStudentActive)} style={{ backgroundColor: isAnyStudentActive ? '#22c55e' : '#94a3b8', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '20px', fontSize: '10px' }}>{isAnyStudentActive ? 'ALL ON' : 'ALL OFF'}</button></th><th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>{students.map((s) => (<tr key={s.no_peserta} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '12px' }}>{s.no_peserta}</td><td style={{ padding: '12px' }}>{s.nama_lengkap}</td><td style={{ padding: '12px', textAlign: 'center' }}>{s.jk}</td><td style={{ padding: '12px', textAlign: 'center' }}>{s.kelas}</td><td style={{ padding: '12px', color: '#3b82f6', fontWeight: 'bold' }}>{s.password}</td><td style={{ padding: '12px', textAlign: 'center' }}><button onClick={() => toggleStatus(s.no_peserta, s.status)} style={{ backgroundColor: s.status ? '#22c55e' : '#94a3b8', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px' }}>{s.status ? 'ON' : 'OFF'}</button></td><td style={{ padding: '12px', textAlign: 'center' }}><button onClick={() => { setIsEditSiswa(true); setFormSiswa(s); setShowModalSiswa(true); }} style={{ border: 'none', background: 'none' }}>📝</button><button onClick={() => deleteSiswa(s.no_peserta, s.nama_lengkap)} style={{ border: 'none', background: 'none' }}>🗑️</button></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {/* MENU BARU: DATA MASTER */}
          {activeMenu === 'master' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0 }}>📚 Mata Pelajaran</h4>
                  <button onClick={() => setShowModalMapel(true)} style={{ backgroundColor: '#1e293b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>+ Mapel</button>
                </div>
                {mapels.map(m => <div key={m.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee', fontSize: '13px' }}><b>{m.kode_mapel}</b> - {m.nama_mapel}</div>)}
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0 }}>📝 Wadah Asesmen</h4>
                  <button onClick={() => setShowModalAsesmen(true)} style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>+ Asesmen</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ backgroundColor: '#f8fafc' }}><tr style={{ textAlign: 'left' }}><th style={{ padding: '10px' }}>Kode</th><th style={{ padding: '10px' }}>Asesmen</th><th style={{ padding: '10px' }}>Status</th></tr></thead>
                  <tbody>{asesmens.map(a => (<tr key={a.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}><code>{a.kode_asesmen}</code></td><td style={{ padding: '10px' }}>{a.nama_asesmen}</td><td style={{ padding: '10px' }}><button onClick={() => toggleAsesmenStatus(a.id, a.status)} style={{ backgroundColor: a.status ? '#22c55e' : '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px' }}>{a.status ? 'AKTIF' : 'OFF'}</button></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* MENU BARU: BANK SOAL */}
          {activeMenu === 'soal' && (
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <select onChange={(e) => {setSelectedAsesmenId(e.target.value); fetchSoal(e.target.value);}} style={{ padding: '10px', borderRadius: '6px', flex: 1, border: '1px solid #cbd5e1' }}>
                  <option value="">-- Pilih Asesmen Tujuan --</option>
                  {asesmens.map(a => <option key={a.id} value={a.id}>[{a.kode_asesmen}] {a.nama_asesmen}</option>)}
                </select>
                <label style={{ backgroundColor: '#1e293b', color: 'white', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>📥 Import JSON <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} /></label>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}><tr style={{ textAlign: 'left' }}><th style={{ padding: '10px' }}>No</th><th style={{ padding: '10px' }}>Pertanyaan</th><th style={{ padding: '10px' }}>Aksi</th></tr></thead>
                <tbody>{soalList.map((s, i) => (<tr key={s.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}>{i + 1}</td><td style={{ padding: '10px' }}>{s.pertanyaan.substring(0, 100)}...</td><td style={{ padding: '10px' }}><button onClick={async () => { if(confirm("Hapus soal ini?")){ await supabase.from('bank_soal').delete().eq('id', s.id); fetchSoal(selectedAsesmenId); } }} style={{ border: 'none', background: 'none' }}>🗑️</button></td></tr>))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- SEMUA MODAL ASLI BOS (UTUH) --- */}
      {showModalImport && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '400px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Import Data Siswa</h3>
            <button onClick={downloadTemplate} style={{ backgroundColor: '#64748b', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginBottom: '10px' }}>📥 Download Template</button>
            <label style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'block' }}>📁 Pilih File & Import <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} style={{ display: 'none' }} /></label>
            <button onClick={() => setShowModalImport(false)} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Batal</button>
          </div>
        </div>
      )}

      {showModalGenNoPes && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '350px' }}>
            <h3 style={{ marginTop: 0 }}>Auto-Generate No Peserta</h3>
            <input placeholder="Kode Sekolah" value={kodeSekolah} onChange={(e) => setKodeSekolah(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px' }} />
            <button onClick={handleGenerateNoPeserta} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 'bold' }}>Generate</button>
            <button onClick={() => setShowModalGenNoPes(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none' }}>Batal</button>
          </div>
        </div>
      )}

      {showModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', width: '350px', borderRadius: '12px' }}>
            <h3>{isEditUser ? 'Edit Admin' : 'Tambah Admin'}</h3>
            <form onSubmit={handleUserSubmit}>
              <input placeholder="Username" value={formUser.username} onChange={(e) => setFormUser({...formUser, username: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }} required />
              <input placeholder="Nama Lengkap" value={formUser.nama_lengkap} onChange={(e) => setFormUser({...formUser, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }} required />
              <input placeholder="Password" value={formUser.password} onChange={(e) => setFormUser({...formUser, password: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ddd' }} required />
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Simpan Admin</button>
              <button type="button" onClick={() => setShowModalUser(false)} style={{ width: '100%', marginTop: '10px', border: 'none', background: 'none' }}>Batal</button>
            </form>
          </div>
        </div>
      )}

      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', width: '400px', borderRadius: '12px' }}>
            <h3>Edit Data Siswa</h3>
            <form onSubmit={handleSiswaSubmit}>
              <input value={formSiswa.no_peserta} disabled style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#f1f5f9', border: '1px solid #ddd' }} />
              <input placeholder="Nama" value={formSiswa.nama_lengkap} onChange={(e) => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }} required />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select value={formSiswa.jk} onChange={(e) => setFormSiswa({...formSiswa, jk: e.target.value})} style={{ flex: 1, padding: '10px', border: '1px solid #ddd' }}><option value="L">L</option><option value="P">P</option></select>
                <input placeholder="Kelas" value={formSiswa.kelas} onChange={(e) => setFormSiswa({...formSiswa, kelas: e.target.value})} style={{ flex: 1, padding: '10px', border: '1px solid #ddd' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input placeholder="Password" value={formSiswa.password} onChange={(e) => setFormSiswa({...formSiswa, password: e.target.value})} style={{ flex: 1, padding: '10px', border: '1px solid #ddd' }} />
                <button type="button" onClick={handleGeneratePassword} style={{ padding: '10px' }}>🔑</button>
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Update Data</button>
              <button type="button" onClick={() => setShowModalSiswa(false)} style={{ width: '100%', marginTop: '10px', border: 'none', background: 'none' }}>Batal</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL BARU (MAPEL & ASESMEN) --- */}
      {showModalMapel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '350px' }}>
            <h3>Tambah Mata Pelajaran</h3>
            <input placeholder="Kode (Contoh: MTK)" value={formMapel.kode_mapel} onChange={(e) => setFormMapel({...formMapel, kode_mapel: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }} />
            <input placeholder="Nama Mapel" value={formMapel.nama_mapel} onChange={(e) => setFormMapel({...formMapel, nama_mapel: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ddd' }} />
            <button onClick={handleMapelSubmit} style={{ width: '100%', padding: '12px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '6px' }}>Simpan</button>
            <button onClick={() => setShowModalMapel(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none' }}>Batal</button>
          </div>
        </div>
      )}

      {showModalAsesmen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h3>Buat Wadah Asesmen</h3>
            <select value={formAsesmen.id_mapel} onChange={(e) => setFormAsesmen({...formAsesmen, id_mapel: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }}>
              <option value="">-- Pilih Mata Pelajaran --</option>
              {mapels.map(m => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
            </select>
            <input placeholder="Kode Asesmen" value={formAsesmen.kode_asesmen} onChange={(e) => setFormAsesmen({...formAsesmen, kode_asesmen: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }} />
            <input placeholder="Nama Asesmen" value={formAsesmen.nama_asesmen} onChange={(e) => setFormAsesmen({...formAsesmen, nama_asesmen: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ddd' }} />
            <button onClick={handleAsesmenSubmit} style={{ width: '100%', padding: '12px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px' }}>Buat</button>
            <button onClick={() => setShowModalAsesmen(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none' }}>Batal</button>
          </div>
        </div>
      )}
    </div>
  )
}