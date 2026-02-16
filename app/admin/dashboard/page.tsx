'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState('user')
  const [users, setUsers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState({ username: '', nama_lengkap: '', password: '' })

  const fetchUsers = async () => {
    const { data } = await supabase.from('admin_user').select('*').order('id', { ascending: true })
    if (data) setUsers(data)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit && selectedId) {
      const { error } = await supabase.from('admin_user').update(form).eq('id', selectedId)
      if (!error) alert('Data Berhasil Diperbarui!')
    } else {
      const { error } = await supabase.from('admin_user').insert([form])
      if (!error) alert('User Berhasil Ditambahkan!')
    }
    setShowModal(false)
    fetchUsers()
  }

  const openEdit = (user: any) => {
    setIsEdit(true)
    setSelectedId(user.id)
    setForm({ username: user.username, nama_lengkap: user.nama_lengkap, password: user.password })
    setShowModal(true)
  }

  const handleDelete = async (id: number, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user: ${nama}?`)) {
      const { error } = await supabase.from('admin_user').delete().eq('id', id)
      if (error) {
        alert('Gagal menghapus: ' + error.message)
      } else {
        alert('User berhasil dihapus!')
        fetchUsers()
      }
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#e2e8f0' }}>
      {/* SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#1e293b', color: '#cbd5e1' }}>
        <div style={{ padding: '20px', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold' }}>📖Asesmen CBT</div>
        <nav style={{ marginTop: '10px' }}>
          <div onClick={() => setActiveMenu('dashboard')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'dashboard' ? '#334155' : 'transparent' }}>📊 Dashboard</div>
          <div onClick={() => setActiveMenu('user')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeMenu === 'user' ? '#334155' : 'transparent' }}>👤 Data Pengguna</div>
        </nav>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ height: '60px', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', padding: '0 25px' }}>Administrator (Admin)</div>
        <div style={{ padding: '25px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0 }}>DATA PENGGUNA</h3>
              <button onClick={() => { setIsEdit(false); setForm({username:'', nama_lengkap:'', password:''}); setShowModal(true); }} style={{ backgroundColor: '#1e293b', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Tambah User</button>
            </div>
            <div style={{ padding: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#475569', color: 'white' }}>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', width: '50px' }}>No</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Username</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Nama Lengkap</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', width: '150px' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => (
                    <tr key={u.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{index + 1}</td>
                      <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{u.username}</td>
                      <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{u.nama_lengkap}</td>
                      <td style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                        <button onClick={() => openEdit(u)} title="Edit User" style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>✏️</button>
                        <button onClick={() => handleDelete(u.id, u.nama_lengkap)} title="Hapus User" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EDIT / TAMBAH */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', width: '400px', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>{isEdit ? '✏️ Edit User' : '➕ Tambah User Baru'}</h3>
            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Username</label>
              <input value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} style={{ width: '100%', marginBottom: '15px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} required />
              
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nama Lengkap</label>
              <input value={form.nama_lengkap} onChange={(e) => setForm({...form, nama_lengkap: e.target.value})} style={{ width: '100%', marginBottom: '15px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} required />
              
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Password</label>
              <input type="text" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} style={{ width: '100%', marginBottom: '20px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} required />
              
              <button type="submit" style={{ backgroundColor: '#3b82f6', color: 'white', width: '100%', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{isEdit ? 'Update Data' : 'Simpan User'}</button>
              <button type="button" onClick={() => setShowModal(false)} style={{ width: '100%', marginTop: '10px', padding: '10px', background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Batal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}