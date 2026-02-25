'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HalamanUjian() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initUjian = async () => {
      const siswaSession = localStorage.getItem('siswa_session')
      const idAsesmen = localStorage.getItem('id_asesmen')

      if (!siswaSession || !idAsesmen) {
        router.push('/login')
        return
      }

      const siswa = JSON.parse(siswaSession)

      // 1️⃣ Cek laporan_ujian
      const { data: laporan } = await supabase
        .from('laporan_ujian')
        .select('*')
        .eq('no_peserta', siswa.no_peserta)
        .eq('id_asesmen', idAsesmen)
        .single()

      if (!laporan) {
        // 2️⃣ Jika belum ada → insert baru
        await supabase.from('laporan_ujian').insert({
          no_peserta: siswa.no_peserta,
          id_asesmen: idAsesmen,
          mulai_pada: new Date().toISOString(),
          status: 'sedang'
        })
      } else {
        // 3️⃣ Kalau sudah selesai → redirect
        if (laporan.status === 'selesai') {
          router.push('/peserta/hasil')
          return
        }
      }

      setLoading(false)
    }

    initUjian()
  }, [router])

  if (loading) {
    return <div className="p-10 text-center">Menyiapkan ujian...</div>
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Halaman Ujian</h1>
      <p>Ujian sedang berlangsung...</p>
    </div>
  )
}