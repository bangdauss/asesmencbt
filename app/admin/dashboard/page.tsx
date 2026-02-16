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
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ username: '', nama_lengkap: '', password: '' })

  const fetchUsers = async () => {
    const { data } = await supabase.from('admin_user').select('*').order('id', { ascending: true })
    if (data) setUsers(data)
  }

  useEffect(() => {
    if (activeMenu === 'user') fetchUsers()
  }, [activeMenu])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('admin_user').insert([form])
    if (error) {
      alert('Gagal: ' + error.message)
    } else {
      alert('User Berhasil Ditambahkan!')
      setShowModal(false)
      setForm({ username: '', nama_lengkap: '', password: '' })
      fetchUsers()
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#e2e8f0' }}>
      {/* SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#1e293b', color: '#cbd5e1' }}>
        <div style={{ padding: '20px', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>📖 e-Asesmen SMA</div>
        <nav style={{ marginTop: '10px' }}>
          <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#334155' : 'transparent', color: activeMenu === 'dashboard' ? 'white' : '#cbd5e1' }}>📊 Dashboard</div>
          <div onClick={() => setActiveMenu('user')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'user' ? '#334155' : 'transparent', color: activeMenu === 'user' ? 'white' : '#cbd5e1' }}>👤 Data Pengguna</div>
        </nav>
      </div>
      {/* CONTENT */}
      <div style={{ flex: 1 }}>
        <div style={{ height: '60px', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', padding: '0 25px' }}>Administrator (Admin)</div>
        <div style={{ padding: '25px' }}>
          {activeMenu === 'dashboard' ? (
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '4px', borderTop: '4px solid #3b82f6' }}>
              <h2>Selamat datang di halaman dashboard</h2>
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '4px' }}>
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0 }}>DATA PENGGUNA</h3>
                <button onClick={() => setShowModal(true)} style={{ backgroundColor: '#1e293b', color: 'white', padding: '8px 15px', border: 'none', cursor: 'pointer' }}>+ Tambah User</button>
              </div>
              <div style={{ padding: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#475569', color: 'white' }}>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>No</th>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Username</th>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Nama Lengkap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, index) => (
                      <tr key={u.id}>
                        <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{index + 1}</td>
                        <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{u.username}</td>
                        <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{u.nama_lengkap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '25px', width: '400px', borderRadius: '8px' }}>
            <h3>Tambah User Baru</h3>
            <form onSubmit={handleAddUser}>
              <input placeholder="Username" onChange={(e) => setForm({...form, username: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '10px' }} required />
              <input placeholder="Nama Lengkap" onChange={(e) => setForm({...form, nama_lengkap: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '10px' }} required />
              <input placeholder="Password" type="password" onChange={(e) => setForm({...form, password: e.target.value})} style={{ width: '100%', marginBottom: '20px', padding: '10px' }} required />
              <button type="submit" style={{ backgroundColor: '#3b82f6', color: 'white', width: '100%', padding: '10px' }}>Simpan</button>
              <button type="button" onClick={() => setShowModal(false)} style={{ width: '100%', marginTop: '10px' }}>Batal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}