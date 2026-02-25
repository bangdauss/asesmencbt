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
  const [sisaWaktu, setSisaWaktu] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    const initUjian = async () => {
      const siswaSession = localStorage.getItem('siswa_session')
      const idAsesmen = localStorage.getItem('id_asesmen')

      if (!siswaSession || !idAsesmen) {
        router.push('/login')
        return
      }

      const siswa = JSON.parse(siswaSession)

      // 🔥 Ambil laporan + durasi dari data_asesmen
      const { data: laporan, error } = await supabase
        .from('laporan_ujian')
        .select(`
          *,
          data_asesmen (
            durasi_menit
          )
        `)
        .eq('no_peserta', siswa.no_peserta)
        .eq('id_asesmen', idAsesmen)
        .single()

      let laporanFinal = laporan

      // ✅ Jika belum ada laporan → buat baru
      if (error || !laporan) {
        const { data: newLaporan } = await supabase
          .from('laporan_ujian')
          .insert({
            no_peserta: siswa.no_peserta,
            id_asesmen: idAsesmen,
            mulai_pada: new Date().toISOString(),
            status: 'sedang'
          })
          .select(`
            *,
            data_asesmen (
              durasi_menit
            )
          `)
          .single()

        laporanFinal = newLaporan
      }

      if (!laporanFinal) {
        alert('Gagal memuat data ujian.')
        router.push('/login')
        return
      }

      // 🚨 Jika sudah selesai
      if (laporanFinal.status === 'selesai') {
        router.push('/peserta/hasil')
        return
      }

      // 🎯 HITUNG TIMER
      const mulai = new Date(laporanFinal.mulai_pada).getTime()
      const durasiMs =
        laporanFinal.data_asesmen.durasi_menit * 60 * 1000
      const selesai = mulai + durasiMs

      interval = setInterval(() => {
        const sekarang = Date.now()
        const sisa = Math.floor((selesai - sekarang) / 1000)

        if (sisa <= 0) {
          clearInterval(interval)
          handleAutoSubmit(siswa.no_peserta, idAsesmen)
        } else {
          setSisaWaktu(sisa)
        }
      }, 1000)

      setLoading(false)
    }

    initUjian()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [router])

  const handleAutoSubmit = async (
    noPeserta: string,
    idAsesmen: string
  ) => {
    await supabase
      .from('laporan_ujian')
      .update({
        status: 'auto_submit',
        selesai_pada: new Date().toISOString()
      })
      .eq('no_peserta', noPeserta)
      .eq('id_asesmen', idAsesmen)

    router.push('/peserta/hasil')
  }

  const formatTime = (totalSeconds: number) => {
    const jam = Math.floor(totalSeconds / 3600)
    const menit = Math.floor((totalSeconds % 3600) / 60)
    const detik = totalSeconds % 60

    return `${jam.toString().padStart(2, '0')}:${menit
      .toString()
      .padStart(2, '0')}:${detik.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <div className="p-10 text-center">Menyiapkan ujian...</div>
  }

  return (
    <div className="min-h-screen bg-white p-8">
      
      {/* HEADER + TIMER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Ujian Berlangsung</h1>

        <div className="bg-red-100 text-red-600 px-6 py-3 rounded-xl font-mono font-bold text-lg">
          ⏳ {formatTime(sisaWaktu)}
        </div>
      </div>

      <div>
        <p>Soal akan tampil di sini...</p>
      </div>
    </div>
  )
}