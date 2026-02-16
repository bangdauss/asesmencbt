'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Inisialisasi koneksi ke Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Mengecek data ke tabel admin_user di Supabase
    const { data, error } = await supabase
      .from('admin_user')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()

    if (error || !data) {
      alert('Username atau Password salah!')
    } else {
      alert(`Selamat Datang, ${data.nama_lengkap}!`)
      // Nanti di sini kita arahkan ke dashboard
    }
    setLoading(false)
  }

  return (
    <div style={{ backgroundColor: '#334155', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ color: '#1e293b', marginBottom: '10px', fontSize: '28px' }}>Admin User</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Asesmen CBT by Dausain Edu</p>
        
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username Admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '25px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'MENGECEK...' : 'MASUK →'}
          </button>
        </form>
      </div>
    </div>
  )
}