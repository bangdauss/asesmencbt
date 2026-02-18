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
  const [soalList, setSoalList] = useState<any[]>([])

  const [selectedAsesmenId, setSelectedAsesmenId] = useState('')

  const [config, setConfig] = useState({ npsn: '', nama_sekolah: '' })
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [showModalImport, setShowModalImport] = useState(false)
  const [showModalGenNoPes, setShowModalGenNoPes] = useState(false)
  const [showModalUser, setShowModalUser] = useState(false)
  const [showModalMapel, setShowModalMapel] = useState(false)
  const [showModalAsesmen, setShowModalAsesmen] = useState(false)

  const [isEditSiswa, setIsEditSiswa] = useState(false)
  const [isEditUser, setIsEditUser] = useState(false)

  const [kodeSekolah, setKodeSekolah] = useState('')

  const [formSiswa, setFormSiswa] = useState({
    no_peserta: '',
    nama_lengkap: '',
    jk: '',
    kelas: '',
    password: '',
    sesi: '',
    status: false
  })

  const [formUser, setFormUser] = useState({
    id: null,
    username: '',
    nama_lengkap: '',
    password: ''
  })

  const [formMapel, setFormMapel] = useState({
    kode_mapel: '',
    nama_mapel: ''
  })

  const [formAsesmen, setFormAsesmen] = useState({
    id_mapel: '',
    kode_asesmen: '',
    nama_asesmen: '',
    status: false
  })

  // ================= FETCH DATA =================

  const fetchData = async () => {

    const { data: userData, error: userError } =
      await supabase.from('admin_user').select('*').order('id')

    if (!userError && userData) setUsers(userData)

    const { data: studentData, error: studentError } =
      await supabase.from('data_siswa').select('*').order('no_peserta')

    if (!studentError && studentData) setStudents(studentData)

    const { data: configData } =
      await supabase.from('pengaturan').select('*').maybeSingle()

    if (configData) setConfig(configData)

    const { data: mapelData } =
      await supabase.from('data_mapel').select('*').order('nama_mapel')

    if (mapelData) setMapels(mapelData)

    const { data: asesmenData } =
      await supabase
        .from('data_asesmen')
        .select('*, data_mapel(nama_mapel)')
        .order('id', { ascending: false })

    if (asesmenData) setAsesmens(asesmenData)

    setIsLoadingConfig(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ================= PASSWORD =================

  const generateSecurePassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result + '*'
  }
  // ================= CONFIG =================

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase
      .from('pengaturan')
      .upsert({
        npsn: config.npsn,
        nama_sekolah: config.nama_sekolah
      })

    if (error) {
      alert("Gagal: " + error.message)
      return
    }

    alert("Berhasil disimpan")
    fetchData()
  }

  // ================= ADMIN =================

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formUser.username || !formUser.nama_lengkap || !formUser.password) {
      alert("Semua field wajib diisi")
      return
    }

    let error

    if (isEditUser) {
      const res = await supabase
        .from('admin_user')
        .update({
          username: formUser.username,
          nama_lengkap: formUser.nama_lengkap,
          password: formUser.password
        })
        .eq('id', formUser.id)

      error = res.error
    } else {
      const res = await supabase
        .from('admin_user')
        .insert([{
          username: formUser.username,
          nama_lengkap: formUser.nama_lengkap,
          password: formUser.password
        }])

      error = res.error
    }

    if (error) {
      alert("Gagal: " + error.message)
      return
    }

    setShowModalUser(false)
    setFormUser({ id: null, username: '', nama_lengkap: '', password: '' })
    fetchData()
  }

  const deleteUser = async (id: number) => {
    if (!confirm("Hapus admin ini?")) return

    const { error } =
      await supabase.from('admin_user').delete().eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    fetchData()
  }

  // ================= SISWA =================

  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formSiswa.nama_lengkap) {
      alert("Nama wajib diisi")
      return
    }

    const { error } =
      await supabase
        .from('data_siswa')
        .update({
          nama_lengkap: formSiswa.nama_lengkap,
          jk: formSiswa.jk,
          kelas: formSiswa.kelas,
          password: formSiswa.password
        })
        .eq('no_peserta', formSiswa.no_peserta)

    if (error) {
      alert(error.message)
      return
    }

    setShowModalSiswa(false)
    fetchData()
  }

  const deleteSiswa = async (no_peserta: string) => {
    if (!confirm("Hapus siswa ini?")) return

    const { error } =
      await supabase.from('data_siswa').delete().eq('no_peserta', no_peserta)

    if (error) {
      alert(error.message)
      return
    }

    fetchData()
  }

  // ================= MAPEL (FIX TOTAL) =================

  const handleMapelSubmit = async () => {

    if (!formMapel.kode_mapel || !formMapel.nama_mapel) {
      alert("Kode & Nama wajib diisi")
      return
    }

    const { error } =
      await supabase
        .from('data_mapel')
        .insert([{
          kode_mapel: formMapel.kode_mapel,
          nama_mapel: formMapel.nama_mapel
        }])

    if (error) {
      alert("Gagal: " + error.message)
      return
    }

    alert("Mapel berhasil ditambahkan")
    setShowModalMapel(false)
    setFormMapel({ kode_mapel: '', nama_mapel: '' })
    fetchData()
  }

  const deleteMapel = async (id: number) => {
    if (!confirm("Hapus mapel?")) return

    const { error } =
      await supabase.from('data_mapel').delete().eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    fetchData()
  }

  // ================= ASESMEN (FIX TOTAL) =================

  const handleAsesmenSubmit = async () => {

    if (!formAsesmen.id_mapel) {
      alert("Pilih mapel dulu")
      return
    }

    if (!formAsesmen.kode_asesmen || !formAsesmen.nama_asesmen) {
      alert("Kode & Nama wajib diisi")
      return
    }

    const { error } =
      await supabase
        .from('data_asesmen')
        .insert([{
          id_mapel: parseInt(formAsesmen.id_mapel),
          kode_asesmen: formAsesmen.kode_asesmen,
          nama_asesmen: formAsesmen.nama_asesmen,
          status: false
        }])

    if (error) {
      alert("Gagal: " + error.message)
      return
    }

    alert("Asesmen berhasil dibuat")
    setShowModalAsesmen(false)
    setFormAsesmen({
      id_mapel: '',
      kode_asesmen: '',
      nama_asesmen: '',
      status: false
    })

    fetchData()
  }

  const toggleAsesmenStatus = async (id: number, current: boolean) => {

    const { error } =
      await supabase
        .from('data_asesmen')
        .update({ status: !current })
        .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    fetchData()
  }

  // ================= BANK SOAL =================

  const fetchSoal = async (id: string) => {

    const { data, error } =
      await supabase
        .from('bank_soal')
        .select('*')
        .eq('id_asesmen', id)
        .order('id')

    if (!error && data) setSoalList(data)
  }

  const handleImportJSON = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0]
    if (!file || !selectedAsesmenId) {
      alert("Pilih asesmen dulu")
      return
    }

    const reader = new FileReader()

    reader.onload = async (evt) => {
      try {

        const json = JSON.parse(evt.target?.result as string)

        const formatted = json.map((s: any) => ({
          ...s,
          id_asesmen: parseInt(selectedAsesmenId)
        }))

        await supabase
          .from('bank_soal')
          .delete()
          .eq('id_asesmen', selectedAsesmenId)

        const { error } =
          await supabase
            .from('bank_soal')
            .insert(formatted)

        if (error) {
          alert(error.message)
          return
        }

        alert("Soal berhasil diimport")
        fetchSoal(selectedAsesmenId)

      } catch {
        alert("Format JSON tidak valid")
      }
    }

    reader.readAsText(file)
  }
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial', background: '#f1f5f9' }}>

      {/* SIDEBAR */}
      <div style={{ width: 250, background: '#1e293b', color: 'white' }}>
        <div style={{ padding: 20, fontWeight: 'bold', background: '#0f172a' }}>
          🚀 e-Asesmen
        </div>

        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'user', label: '👤 Data Pengguna' },
          { key: 'siswa', label: '🎓 Data Siswa' },
          { key: 'master', label: '📁 Data Master' },
          { key: 'soal', label: '📚 Bank Soal' }
        ].map(menu => (
          <div
            key={menu.key}
            onClick={() => setActiveMenu(menu.key)}
            style={{
              padding: 15,
              cursor: 'pointer',
              background: activeMenu === menu.key ? '#334155' : 'transparent'
            }}
          >
            {menu.label}
          </div>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, padding: 25 }}>

        {/* DASHBOARD */}
        {activeMenu === 'dashboard' && (
          <div>
            <h2>Dashboard</h2>
            <p>Total Admin: {users.length}</p>
            <p>Total Siswa: {students.length}</p>
          </div>
        )}

        {/* USER */}
        {activeMenu === 'user' && (
          <div>
            <h2>Data Admin</h2>
            <button onClick={() => setShowModalUser(true)}>+ Tambah</button>

            <table width="100%" style={{ marginTop: 20 }}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Nama</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.nama_lengkap}</td>
                    <td>
                      <button onClick={() => deleteUser(u.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SISWA */}
        {activeMenu === 'siswa' && (
          <div>
            <h2>Data Siswa</h2>

            <table width="100%" style={{ marginTop: 20 }}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Kelas</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.no_peserta}>
                    <td>{s.no_peserta}</td>
                    <td>{s.nama_lengkap}</td>
                    <td>{s.kelas}</td>
                    <td>
                      <button onClick={() => deleteSiswa(s.no_peserta)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MASTER */}
        {activeMenu === 'master' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>

            {/* MAPEL */}
            <div>
              <h3>Mata Pelajaran</h3>
              <button onClick={() => setShowModalMapel(true)}>+ Mapel</button>

              {mapels.map(m => (
                <div key={m.id} style={{ marginTop: 10 }}>
                  {m.kode_mapel} - {m.nama_mapel}
                  <button onClick={() => deleteMapel(m.id)}>🗑️</button>
                </div>
              ))}
            </div>

            {/* ASESMEN */}
            <div>
              <h3>Asesmen</h3>
              <button onClick={() => setShowModalAsesmen(true)}>+ Asesmen</button>

              <table width="100%" style={{ marginTop: 20 }}>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {asesmens.map(a => (
                    <tr key={a.id}>
                      <td>{a.kode_asesmen}</td>
                      <td>{a.nama_asesmen}</td>
                      <td>
                        <button onClick={() => toggleAsesmenStatus(a.id, a.status)}>
                          {a.status ? 'AKTIF' : 'OFF'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* BANK SOAL */}
        {activeMenu === 'soal' && (
          <div>
            <h2>Bank Soal</h2>

            <select
              onChange={(e) => {
                setSelectedAsesmenId(e.target.value)
                fetchSoal(e.target.value)
              }}
            >
              <option value="">-- Pilih Asesmen --</option>
              {asesmens.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nama_asesmen}
                </option>
              ))}
            </select>

            <table width="100%" style={{ marginTop: 20 }}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Pertanyaan</th>
                </tr>
              </thead>
              <tbody>
                {soalList.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>{s.pertanyaan?.substring(0, 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
