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
      // 1. Verifikasi Nomor Peserta & Password di tabel 'data_siswa'
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

      // 2. Verifikasi Token (Bisa disesuaikan dengan logika token dari Admin)
      // Untuk sementara validasi panjang token minimal 5 karakter
      if (formData.token.length < 5) {
        alert('Token Ujian tidak valid!')
        setLoading(false)
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
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100 text-center">
        
        {/* Header Login */}
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify