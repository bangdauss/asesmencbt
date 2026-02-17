'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [nama, setNama] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase.from('data_siswa').select('*')
        if (data) setStudents(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div style={{ padding: '20px' }}>Menghubungkan ke Database...</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
      {/* SIDEBAR SIMPLE */}
      <div style={{ width: '220px', backgroundColor: '#1e293b', color: 'white', padding: '20px' }}>
        <h3 style={{ marginBottom: '30px' }}>E-Asesmen</h3>
        <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '10px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#334155' : '' }}>📊 Dashboard</div>
        <div onClick={() => setActiveMenu('siswa')} style={{ padding: '10px', cursor: 'pointer', backgroundColor: activeMenu === 'siswa' ? '#334155' : '', marginTop: '5px' }}>🎓 Data Siswa</div>
      </div>

      <div style={{ flex: 1, padding: '30px' }}>
        {/* DASHBOARD - DIJAMIN MUNCUL */}
        {activeMenu === 'dashboard' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Ringkasan Data</h2>
            <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block', minWidth: '200px' }}>
              <p style={{ color: '#64748b', margin: 0 }}>Total Siswa Terdaftar</p>
              <h3 style={{ fontSize: '2.5rem', margin: '10px 0' }}>{students ? students.length : 0}</h3>
            </div>
          </div>
        )}

        {/* DATA SISWA - TOGGLE STATUS CAKEP */}
        {activeMenu === 'siswa' && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Daftar Peserta</h3>
              <button onClick={() => setShowModal(true)} style={{ backgroundColor: '#1e293b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>+ Tambah</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '10px' }}>Nama Siswa</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px' }}>{s.nama_lengkap}</td>
                    <td style={{ padding: '10px' }}>
                      {/* TOGGLE STATUS ON/OFF */}
                      <button 
                        onClick={async () => {
                          await supabase.from('data_siswa').update({ status: !s.status }).eq('no_peserta', s.no_peserta)
                          window.location.reload() // Cara paling aman buat refresh data
                        }}
                        style={{ 
                          padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                          backgroundColor: s.status ? '#22c55e' : '#cbd5e1', color: 'white'
                        }}
                      >
                        {s.status ? 'AKTIF' : 'OFF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL POP-UP