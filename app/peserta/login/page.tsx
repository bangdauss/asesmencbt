'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPeserta() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    no_peserta: '',
    password: '',
    token: ''
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          no_peserta: formData.no_peserta.trim(),
          password: formData.password,
          token: formData.token.toUpperCase()
        })
      })

      const result = await res.json()

      if (!res.ok) {
        setErrorMsg(result.error || 'Login gagal')
        setLoading(false)
        return
      }

      router.push(`/peserta/ujian/${result.id_asesmen}`)
    } catch (err) {
      console.error(err)
      setErrorMsg('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-slate-100">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">
            Login Peserta
          </h2>
          <p className="text-slate-500 mt-2">
            Masukkan kredensial ujian Anda
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">

          {/* Nomor Peserta */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nomor Peserta
            </label>
            <input
              required
              type="text"
              value={formData.no_peserta}
              onChange={(e) => handleChange('no_peserta', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <input
              required
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none pr-12"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[42px] text-slate-400 hover:text-amber-500"
            >
              👁
            </button>
          </div>

          {/* Token */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Token Ujian
            </label>
            <input
              required
              type="text"
              maxLength={6}
              value={formData.token}
              onChange={(e) => handleChange('token', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl text-center font-mono font-bold tracking-widest uppercase focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Memverifikasi...' : 'MASUK KE RUANG UJIAN'}
          </button>

        </form>

        <p className="text-center text-slate-400 text-xs mt-8">
          Tahun Pelajaran 2025/2026 © e-Asesmen
        </p>
      </div>
    </div>
  )
}