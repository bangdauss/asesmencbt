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
  const [mapels, setMapels] = useState<any[]>([])
  const [asesmens, setAsesmens] = useState<any[]>([])
  
  // --- STATE LAMA BOS (JANGAN SAMPAI HILANG) ---
  const [config, setConfig] = useState({ npsn: '', nama_sekolah: '' })
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [showModalImport, setShowModalImport] = useState(false) 
  const [isEditSiswa, setIsEditSiswa] = useState(false)
  const [formSiswa, setFormSiswa] = useState({
    no_peserta: '', nama_lengkap: '', jk: 'L', kelas: '', password: '', sesi: '1', status: false
  })
  const [showModalGenNoPes, setShowModalGenNoPes] = useState(false)
  const [kodeSekolah, setKodeSekolah] = useState('')
  const [showModalUser, setShowModalUser] = useState(false)
  const [isEditUser, setIsEditUser] = useState(false)
  const [formUser, setFormUser] = useState({ id: null, username: '', nama_lengkap: '', password: '' })

  // --- STATE FITUR BARU ---
  const [showModalMapel, setShowModalMapel] = useState(false)
  const [formMapel, setFormMapel] = useState({ id: null, nama_mapel: '', kode_mapel: '' })
  const [showModalAsesmen, setShowModalAsesmen] = useState(false)
  const [formAsesmen, setFormAsesmen] = useState({ id: null, id_mapel: '', kode_asesmen: '', nama_asesmen: '', status: false })
  const [selectedAsesmenId, setSelectedAsesmenId] = useState('')

  const fetchData = async () => {
    const { data: userData } = await supabase.from('admin_user').select('*').order('id', { ascending: true })
    if (userData) setUsers(userData)
    const { data: studentData } = await supabase.from('data_siswa').select('*').order('no_peserta', { ascending: true })
    if (studentData) setStudents(studentData)
    const { data: configData } = await supabase.from('pengaturan').select('*').maybeSingle()
    if (configData) setConfig(configData)
    const { data: mapelData } = await supabase.from('data_mapel').select('*').order('id', { ascending: true })
    if (mapelData) setMapels(mapelData)
    const { data: asesmenData } = await supabase.from('data_asesmen').select('*, data_mapel(nama_mapel)').order('id', { ascending: false })
    if (asesmenData) setAsesmens(asesmenData)
    setIsLoadingConfig(false)
  }

  useEffect(() => { fetchData() }, [])

  // --- FUNGSI MAPEL (FIXED) ---
  const handleMapelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('data_mapel').insert([{ 
      nama_mapel: formMapel.nama_mapel, 
      kode_mapel: formMapel.kode_mapel 
    }]);
    if (error) alert(error.message);
    else { alert("Mapel Tersimpan!"); setShowModalMapel(false); setFormMapel({id:null, nama_mapel:'', kode_mapel:''}); fetchData(); }
  }

  // --- FUNGSI ASESMEN ---
  const handleAsesmenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('data_asesmen').insert([{ 
      id_mapel: parseInt(formAsesmen.id_mapel), 
      kode_asesmen: formAsesmen.kode_asesmen, 
      nama_asesmen: formAsesmen.nama_asesmen, 
      status: false 
    }]);
    if (error) alert(error.message);
    else { alert("Asesmen Berhasil!"); setShowModalAsesmen(false); setFormAsesmen({id:null, id_mapel:'', kode_asesmen:'', nama_asesmen:'', status:false}); fetchData(); }
  }

  const toggleAsesmenStatus = async (id: number, current: boolean) => {
    await supabase.from('data_asesmen').update({ status: !current }).eq('id', id); fetchData();
  }

  // --- FUNGSI CETAK KARTU (FITUR LAMA) ---
  const cetakKartu = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const cardWidth = 90; const cardHeight = 60;
    const marginLeft = 10; const marginTop = 10;
    const gapX = 10; const gapY = 10;
    students.forEach((siswa, index) => {
      const pageIndex = index % 8;
      if (index !== 0 && pageIndex === 0) doc.addPage();
      const col = pageIndex % 2; const row = Math.floor(pageIndex / 2);
      const x = marginLeft + (col * (cardWidth + gapX)); const y = marginTop + (row * (cardHeight + gapY));
      doc.setDrawColor(0); doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text("KARTU PESERTA ASESMEN CBT", x + cardWidth / 2, y + 7, { align: 'center' });
      doc.setFontSize(9); doc.text((config.nama_sekolah || "NAMA SEKOLAH").toUpperCase(), x + cardWidth / 2, y + 12, { align: 'center' });
      doc.line(x + 5, y + 15, x + cardWidth - 5, y + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nama : ${siswa.nama_lengkap}`, x + 5, y + 25);
      doc.text(`User : ${siswa.no_peserta}`, x + 5, y + 32);
      doc.text(`Pass : ${siswa.password}`, x + 5, y + 39);
      doc.rect(x + cardWidth - 25, y + 20, 20, 25, 'S');
      doc.setFontSize(6); doc.text("FOTO 2x3", x + cardWidth - 15, y + 33, { align: 'center' });
    });
    doc.save(`Kartu_Ujian.pdf`);
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('pengaturan').upsert({ npsn: config.npsn, nama_sekolah: config.nama_sekolah });
    alert("Konfigurasi Disimpan!"); fetchData();
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Arial' }}>
      {/* SIDEBAR LENGKAP */}
      <div style={{ width: '260px', backgroundColor: '#1e293b', color: 'white' }}>
        <div style={{ padding: '25px', fontSize: '1.2rem', fontWeight: 'bold' }}>🚀 e-Asesmen</div>
        <nav style={{ marginTop: '10px' }}>
          <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#334155' : '' }}>📊 Dashboard</div>
          <div onClick={() => setActiveMenu('user')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'user' ? '#334155' : '' }}>👤 Data Pengguna</div>
          <div onClick={() => setActiveMenu('siswa')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'siswa' ? '#334155' : '' }}>🎓 Data Siswa</div>
          <div onClick={() => setActiveMenu('master')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'master' ? '#334155' : '' }}>📁 Data Master</div>
          <div onClick={() => setActiveMenu('soal')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'soal' ? '#334155' : '' }}>📚 Bank Soal</div>
        </nav>
      </div>

      <div style={{ flex: 1 }}>
        <header style={{ height: '70px', backgroundColor: 'white', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.1rem' }}>{config.nama_sekolah || "Administrator"}</h2>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>NPSN: {config.npsn}</div>
        </header>

        <main style={{ padding: '30px' }}>
          {/* DASHBOARD */}
          {activeMenu === 'dashboard' && (
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px' }}>
              <h3>⚙️ Pengaturan Sekolah</h3>
              <form onSubmit={handleUpdateConfig} style={{ display: 'grid', gap: '15px', marginTop: '20px', maxWidth: '500px' }}>
                <input placeholder="NPSN" value={config.npsn} onChange={(e) => setConfig({...config, npsn: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <input placeholder="Nama Sekolah" value={config.nama_sekolah} onChange={(e) => setConfig({...config, nama_sekolah: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <button type="submit" style={{ padding: '12px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Simpan</button>
              </form>
            </div>
          )}

          {/* DATA MASTER (MAPEL & ASESMEN) */}
          {activeMenu === 'master' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h4>📚 Mata Pelajaran</h4>
                  <button onClick={() => setShowModalMapel(true)} style={{ padding: '5px 12px', backgroundColor: '#1e293b', color: 'white', borderRadius: '6px', border:'none' }}>+ Mapel</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}><th style={{ padding: '10px' }}>Kode</th><th>Mapel</th></tr></thead>
                  <tbody>{mapels.map(m => <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '10px' }}>{m.kode_mapel}</td><td>{m.nama_mapel}</td></tr>)}</tbody>
                </table>
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h4>📝 Wadah Asesmen</h4>
                  <button onClick={() => setShowModalAsesmen(true)} style={{ padding: '5px 12px', backgroundColor: '#8b5cf6', color: 'white', borderRadius: '6px', border:'none' }}>+ Asesmen</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}><th style={{ padding: '10px' }}>Asesmen</th><th>Status</th></tr></thead>
                  <tbody>{asesmens.map(a => <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '10px' }}>{a.nama_asesmen}</td><td><button onClick={() => toggleAsesmenStatus(a.id, a.status)} style={{ background: a.status ? '#22c55e' : '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px' }}>{a.status ? 'ON' : 'OFF'}</button></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* DATA SISWA (HANYA CONTOH TOMBOL SUPAYA TIDAK HILANG) */}
          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={cetakKartu} style={{ padding: '10px 20px', backgroundColor: '#1e293b', color: 'white', borderRadius: '6px', border:'none' }}>🖨️ Cetak Kartu Peserta</button>
                <button onClick={() => setShowModalImport(true)} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border:'none' }}>📥 Import Excel</button>
              </div>
              <p>Total Siswa: {students.length}</p>
            </div>
          )}
        </main>
      </div>

      {/* MODAL MAPEL */}
      {showModalMapel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '350px' }}>
            <h3>Tambah Mapel</h3>
            <input placeholder="Kode" value={formMapel.kode_mapel} onChange={e => setFormMapel({...formMapel, kode_mapel: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }} />
            <input placeholder="Nama" value={formMapel.nama_mapel} onChange={e => setFormMapel({...formMapel, nama_mapel: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ddd' }} />
            <button onClick={handleMapelSubmit} style={{ width: '100%', padding: '12px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '6px' }}>Simpan</button>
            <button onClick={() => setShowModalMapel(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none' }}>Batal</button>
          </div>
        </div>
      )}

      {/* MODAL ASESMEN */}
      {showModalAsesmen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h3>Buat Wadah Asesmen</h3>
            <select value={formAsesmen.id_mapel} onChange={e => setFormAsesmen({...formAsesmen, id_mapel: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }}>
              <option value="">-- Pilih Mapel --</option>
              {mapels.map(m => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
            </select>
            <input placeholder="Kode Asesmen" value={formAsesmen.kode_asesmen} onChange={e => setFormAsesmen({...formAsesmen, kode_asesmen: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }} />
            <input placeholder="Nama Asesmen" value={formAsesmen.nama_asesmen} onChange={e => setFormAsesmen({...formAsesmen, nama_asesmen: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ddd' }} />
            <button onClick={handleAsesmenSubmit} style={{ width: '100%', padding: '12px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px' }}>Simpan</button>
            <button onClick={() => setShowModalAsesmen(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none' }}>Batal</button>
          </div>
        </div>
      )}
    </div>
  )
}