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
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    no_peserta: '',
    password: '',
    token: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1️⃣ Verifikasi Nomor Peserta & Password
      const { data: siswa, error } = await supabase
        .from('data_siswa')
        .select('*')
        .eq('no_peserta', formData.no_peserta)
        .eq('password', formData.password)
        .single()

      if (error || !siswa) {
        alert('Nomor Peserta atau Password salah!')
        setLoading(false)
        return
      }

      // 2️⃣ Ambil Token Aktif dari Database
      const { data: tokenData, error: tokenError } = await supabase
        .from('token_ujian')
        .select('token, id_asesmen')
        .eq('status', true)
        .single()

      if (tokenError || !tokenData) {
        alert('Token belum dirilis oleh Admin!')
        setLoading(false)
        return
      }

      if (formData.token.toUpperCase() !== tokenData.token) {
        alert('Token salah!')
        setLoading(false)
        return
      }

      // 3️⃣ Update Status Siswa (Monitoring)
      await supabase
        .from('data_siswa')
        .update({ status: true })
        .eq('no_peserta', siswa.no_peserta)

      // 4️⃣ Simpan Session & id_asesmen
      localStorage.setItem('siswa_session', JSON.stringify(siswa))
      localStorage.setItem('id_asesmen', tokenData.id_asesmen.toString())

      // 5️⃣ Redirect ke halaman ujian
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
        
        {/* Header */}
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

          {/* Nomor Peserta */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              Nomor Peserta
            </label>
            <input 
              required
              type="text"
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
              onChange={(e) => setFormData({...formData, no_peserta: e.target.value})}
            />
          </div>

          {/* Password + Icon Mata */}
          <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              Password
            </label>

            <input 
              required
              type={showPassword ? "text" : "password"}
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none pr-14"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[46px] text-slate-400 hover:text-amber-500"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7 0-1.5 1-3.2 2.6-4.6m3.2-1.8A9.956 9.956 0 0112 5c5 0 9 4 9 7 0 1.3-.7 2.8-2 4m-3 3L3 3" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Token */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              Token Ujian
            </label>
            <input 
              required
              type="text"
              maxLength={6}
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none text-center font-mono font-bold text-xl uppercase tracking-widest"
              onChange={(e) => setFormData({...formData, token: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-all disabled:opacity-50"
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