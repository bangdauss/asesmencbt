'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Inisialisasi Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPeserta() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    no_peserta: '',
    password: '',
    token: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Verifikasi Nomor Peserta & Password di tabel 'data_siswa'
      const { data: siswa, error } = await supabase
        .from('data_siswa')
        .select('*')
        .eq('no_peserta', formData.no_peserta)
        .eq('password', formData.password)
        .single()

      if (error || !siswa) {
        alert('Nomor Peserta atau Password salah!')
        return
      }

      // 2. Verifikasi Token (Logika: Ambil token aktif dari localStorage atau DB)
      // Catatan: Admin menyimpan token di sistem saat klik "Mulai"
      const tokenAktif = localStorage.getItem('token_ujian') 
      if (formData.token.toUpperCase() !== tokenAktif) {
        alert('Token Ujian tidak valid atau belum dirilis oleh Admin!')
        return
      }

      // 3. Update Status Siswa jadi TRUE agar muncul di Monitoring Admin
      await supabase
        .from('data_siswa')
        .update({ status: true })
        .eq('no_peserta', siswa.no_peserta)

      // 4. Simpan Sesi & Masuk ke Ruang Ujian
      localStorage.setItem('siswa_session', JSON.stringify(siswa))
      router.push('/peserta/ujian')

    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100">
        
        {/* Header Login */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Login Peserta</h2>
          <p className="text-slate-500 mt-2">Masukkan kredensial ujian Anda</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Input No Peserta */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Nomor Peserta</label>
            <input 
              required
              type="text"
              placeholder="Contoh: 50658001"
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all outline-none"
              onChange={(e) => setFormData({...formData, no_peserta: e.target.value})}
            />
          </div>

          {/* Input Password */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password</label>
            <input 
              required
              type="password"
              placeholder="••••••••"
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all outline-none"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {/* Input Token */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Token Ujian</label>
            <input 
              required
              type="text"
              maxLength={6}
              placeholder="6 DIGIT"
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all outline-none text-center font-mono font-bold text-xl uppercase tracking-widest"
              onChange={(e) => setFormData({...formData, token: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-200 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Memverifikasi...' : 'MASUK KE RUANG UJIAN'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-8">
          Tahun Pelajaran 2025/2026 © e-Asesmen
        </p>
      </div>
    </div>
  )
}