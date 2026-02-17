'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [users, setUsers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [formSiswa, setFormSiswa] = useState({ no_peserta: '', nama_lengkap: '', jk: 'L', kelas: '', password: '', sesi: '1', status: false })

  const fetchData = useCallback(async () => {
    try {
      const { data: u } = await supabase.from('admin_user').select('*')
      const { data: s } = await supabase.from('data_siswa').select('*')
      if (u) setUsers(u)
      if (s) setStudents(s)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div style={{ padding: '20px' }}>Loading data...</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      {/* SIDEBAR RAPI */}
      <div style={{ width: '240px', backgroundColor: '#0f172a', color: 'white', padding: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '30px' }}>E-Asesmen</h2>
        <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '12px', cursor: 'pointer', borderRadius: '8px', backgroundColor: activeMenu === 'dashboard' ? '#1e293b' : '' }}>📊 Dashboard</div>
        <div onClick={() => setActiveMenu('siswa')} style={{ padding: '12px', cursor: 'pointer', borderRadius: '8px', backgroundColor: activeMenu === 'siswa' ? '#1e293b' : '', marginTop: '5px' }}>🎓 Data Siswa</div>
      </div>

      <div style={{ flex: 1 }}>
        <header style={{ padding: '20px 40px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <h1 style={{ fontSize: '1rem', color: '#64748b' }}>Administrator Panel</h1>
        </header>

        <main style={{ padding: '40px' }}>
          {/* DASHBOARD - JAMIN GAK BLANK */}
          {activeMenu === 'dashboard' && (
            <div>
              <h2 style={{ marginBottom: '20px' }}>Ringkasan Sistem</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', margin: 0 }}>Total Siswa</p>
                  <h3 style={{ fontSize: '2rem', margin: '10px 0' }}>{students?.length || 0}</h3>
                </div>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', margin: 0 }}>Total Admin</p>
                  <h3 style={{ fontSize: '2rem', margin: '10px 0' }}>{users?.length || 0}</h3>
                </div>
              </div>
            </div>
          )}

          {/* DATA SISWA - DENGAN TOGGLE STATUS */}
          {activeMenu === 'siswa' && (
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Daftar Peserta</h3>
                <button onClick={() => setShowModalSiswa(true)} style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>+ Siswa</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '12px' }}>No Peserta</th>
                    <th style={{ padding: '12px' }}>Nama</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.no_peserta} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>{s.no_peserta}</td>
                      <td style={{ padding: '12px' }}>{s.nama_lengkap}</td>
                      <td style={{ padding: '12px' }}>
                        {/* TOGGLE STATUS ON/OFF */}
                        <button 
                          onClick={async () => {
                            await supabase.from('data_siswa').update({ status: !s.status }).eq('no_peserta', s.no_peserta)
                            fetchData()
                          }}
                          style={{ 
                            padding: '5px 15px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            backgroundColor: s.status ? '#22c55e' : '#cbd5e1', color: 'white', fontWeight: 'bold'
                          }}
                        >
                          {s.status ? 'ON' : 'OFF'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* MODAL TAMBAH SISWA - UI BERSIH */}
      {showModalSiswa && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zSelf: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>Tambah Siswa Baru</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              await supabase.from('data_siswa').insert([formSiswa])
              setShowModalSiswa(false)
              fetchData()
            }}>
              <input placeholder="No Peserta" onChange={e => setFormSiswa({...formSiswa, no_peserta: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
              <input placeholder="Nama Lengkap" onChange={e => setFormSiswa({...formSiswa, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
              <input placeholder="Kelas" onChange={e => setFormSiswa({...formSiswa, kelas: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan Data</button>
              <button onClick={() => setShowModalSiswa(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>Batal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}