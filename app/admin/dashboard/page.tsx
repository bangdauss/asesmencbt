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
    no_peserta: '',
    nama_lengkap: '',
    jk: '',
    kelas: '',
    password: '',
    sesi: '',
    status: false
  })

  const [showModalUser, setShowModalUser] = useState(false)
  const [isEditUser, setIsEditUser] = useState(false)
  const [formUser, setFormUser] = useState({
    id: null,
    username: '',
    nama_lengkap: '',
    password: ''
  })

  // ✅ STATUS GLOBAL (cek apakah semua siswa aktif)
  const allActive =
    students.length > 0 &&
    students.every((s) => s.status === true)

  const fetchData = async () => {
    const { data: userData } = await supabase
      .from('admin_user')
      .select('*')
      .order('id', { ascending: true })

    if (userData) setUsers(userData)

    const { data: studentData } = await supabase
      .from('data_siswa')
      .select('*')
      .order('no_peserta', { ascending: true })

    if (studentData) setStudents(studentData)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ===============================
  // USER LOGIC
  // ===============================

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditUser) {
      await supabase
        .from('admin_user')
        .update({
          username: formUser.username,
          nama_lengkap: formUser.nama_lengkap,
          password: formUser.password
        })
        .eq('id', formUser.id)
    } else {
      await supabase.from('admin_user').insert([
        {
          username: formUser.username,
          nama_lengkap: formUser.nama_lengkap,
          password: formUser.password
        }
      ])
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

  // ===============================
  // SISWA LOGIC
  // ===============================

  const toggleAllStatus = async (targetStatus: boolean) => {
    if (
      confirm(
        targetStatus
          ? 'Aktifkan SEMUA siswa?'
          : 'Nonaktifkan SEMUA siswa?'
      )
    ) {
      await supabase
        .from('data_siswa')
        .update({ status: targetStatus })
        .neq('no_peserta', '0')

      fetchData()
    }
  }

  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditSiswa) {
      await supabase
        .from('data_siswa')
        .update(formSiswa)
        .eq('no_peserta', formSiswa.no_peserta)
    } else {
      await supabase.from('data_siswa').insert([formSiswa])
    }

    setShowModalSiswa(false)
    fetchData()
  }

  const toggleStatus = async (
    no_peserta: string,
    currentStatus: boolean
  ) => {
    await supabase
      .from('data_siswa')
      .update({ status: !currentStatus })
      .eq('no_peserta', no_peserta)

    fetchData()
  }

  const deleteSiswa = async (
    no_peserta: string,
    nama: string
  ) => {
    if (confirm(`Hapus siswa: ${nama}?`)) {
      await supabase
        .from('data_siswa')
        .delete()
        .eq('no_peserta', no_peserta)

      fetchData()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f1f5f9'
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          width: '260px',
          backgroundColor: '#1e293b',
          color: '#cbd5e1'
        }}
      >
        <div
          style={{
            padding: '20px',
            backgroundColor: '#0f172a',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          🚀 e-Asesmen
        </div>

        <nav style={{ marginTop: '10px' }}>
          <div
            onClick={() => setActiveMenu('dashboard')}
            style={{
              padding: '15px 20px',
              cursor: 'pointer',
              backgroundColor:
                activeMenu === 'dashboard'
                  ? '#334155'
                  : 'transparent',
              color: 'white'
            }}
          >
            📊 Dashboard
          </div>

          <div
            onClick={() => setActiveMenu('siswa')}
            style={{
              padding: '15px 20px',
              cursor: 'pointer',
              backgroundColor:
                activeMenu === 'siswa'
                  ? '#334155'
                  : 'transparent',
              color: 'white'
            }}
          >
            🎓 Data Siswa
          </div>
        </nav>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ padding: '25px' }}>
          {activeMenu === 'siswa' && (
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow:
                  '0 4px 6px -1px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '20px' }}>
                <h3>
                  Data Siswa (Total: {students.length})
                </h3>
              </div>

              <div style={{ padding: '0 20px 20px' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px'
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#f8fafc',
                        borderBottom:
                          '2px solid #f1f5f9'
                      }}
                    >
                      <th style={{ padding: '12px' }}>
                        No
                      </th>
                      <th style={{ padding: '12px' }}>
                        Nama
                      </th>

                      {/* ✅ TOGGLE ALL */}
                      <th
                        style={{
                          padding: '12px',
                          textAlign: 'center'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 'bold',
                              fontSize: '11px'
                            }}
                          >
                            STATUS
                          </span>

                          <button
                            onClick={() =>
                              toggleAllStatus(
                                !allActive
                              )
                            }
                            style={{
                              width: '42px',
                              height: '22px',
                              borderRadius: '999px',
                              border: 'none',
                              cursor: 'pointer',
                              position:
                                'relative',
                              backgroundColor:
                                allActive
                                  ? '#22c55e'
                                  : '#94a3b8',
                              transition: '0.2s'
                            }}
                          >
                            <div
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius:
                                  '50%',
                                backgroundColor:
                                  'white',
                                position:
                                  'absolute',
                                top: '2px',
                                left:
                                  allActive
                                    ? '22px'
                                    : '2px',
                                transition: '0.2s'
                              }}
                            />
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map(
                      (s, index) => (
                        <tr key={s.no_peserta}>
                          <td
                            style={{
                              padding:
                                '12px'
                            }}
                          >
                            {index + 1}
                          </td>

                          <td
                            style={{
                              padding:
                                '12px'
                            }}
                          >
                            {s.nama_lengkap}
                          </td>

                          <td
                            style={{
                              padding:
                                '12px',
                              textAlign:
                                'center'
                            }}
                          >
                            <button
                              onClick={() =>
                                toggleStatus(
                                  s.no_peserta,
                                  s.status
                                )
                              }
                              style={{
                                backgroundColor:
                                  s.status
                                    ? '#22c55e'
                                    : '#94a3b8',
                                color: 'white',
                                border:
                                  'none',
                                padding:
                                  '4px 10px',
                                borderRadius:
                                  '8px',
                                cursor:
                                  'pointer',
                                fontSize:
                                  '10px',
                                fontWeight:
                                  'bold'
                              }}
                            >
                              {s.status
                                ? 'ON'
                                : 'OFF'}
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
