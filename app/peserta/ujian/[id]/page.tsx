"use client"

export const runtime = "edge"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HalamanUjian() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [sisaWaktu, setSisaWaktu] = useState(0)
  const [soalList, setSoalList] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    const initUjian = async () => {
      try {
        const siswaSession = localStorage.getItem('siswa_session')
        const idAsesmenRaw = localStorage.getItem('id_asesmen')

        if (!siswaSession || !idAsesmenRaw) {
          router.push('/login')
          return
        }

        const siswa = JSON.parse(siswaSession)
        const idAsesmen = Number(idAsesmenRaw)

        console.log('ID ASESMEN:', idAsesmen)

        // =============================
        // AMBIL / BUAT LAPORAN
        // =============================
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

        if (laporanFinal.status === 'selesai') {
          router.push('/peserta/hasil')
          return
        }

        // =============================
        // TIMER
        // =============================
        const mulai = new Date(laporanFinal.mulai_pada).getTime()
        const durasiMenit =
          laporanFinal.data_asesmen?.durasi_menit ?? 60

        const selesai = mulai + durasiMenit * 60 * 1000

        interval = setInterval(() => {
          const sisa = Math.floor((selesai - Date.now()) / 1000)

          if (sisa <= 0) {
            clearInterval(interval)
            handleAutoSubmit(siswa.no_peserta, idAsesmen)
          } else {
            setSisaWaktu(sisa)
          }
        }, 1000)

        // =============================
        // 🔥 AMBIL SOAL (FIX FINAL)
        // =============================
        const { data: soalData, error: soalError } =
          await supabase
            .from('bank_soal')
            .select('*')
            .eq('id_asesmen', idAsesmen)
            .order('id', { ascending: true })

        if (soalError) {
          console.error('Error ambil soal:', soalError)
        }

        console.log('SOAL DATA:', soalData)

        if (soalData && soalData.length > 0) {
          setSoalList(soalData)
          setCurrentIndex(0)
        } else {
          console.warn('Soal kosong!')
        }

        setLoading(false)
      } catch (err) {
        console.error(err)
        alert('Terjadi kesalahan.')
        router.push('/login')
      }
    }

    initUjian()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [router])

  const handleAutoSubmit = async (
    noPeserta: string,
    idAsesmen: number
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

  const handleNext = () => {
    if (currentIndex < soalList.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
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

  if (!soalList || soalList.length === 0) {
    return (
      <div className="p-10 text-center text-red-500">
        Tidak ada soal ditemukan.
      </div>
    )
  }

  const soal = soalList[currentIndex]

  return (
    <div className="min-h-screen bg-white p-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Ujian Berlangsung</h1>

        <div className="bg-red-100 text-red-600 px-6 py-3 rounded-xl font-mono font-bold text-lg">
          ⏳ {formatTime(sisaWaktu)}
        </div>
      </div>

      {/* PERTANYAAN */}
      <div className="bg-slate-50 p-6 rounded-xl mb-6">
        <h2 className="font-bold mb-4">
          Soal {currentIndex + 1} dari {soalList.length}
        </h2>
        <p>{soal.pertanyaan}</p>
      </div>

      {/* 🔥 OPSI (FIX JSON) */}
      <div className="space-y-3">
        {soal.pilihan &&
          Object.entries(soal.pilihan).map(([key, value]) => (
            <button
              key={key}
              className="w-full text-left p-4 border rounded-xl hover:bg-amber-50"
            >
              {key}. {value as string}
            </button>
          ))}
      </div>

      {/* NAVIGASI NOMOR */}
      <div className="flex flex-wrap gap-2 mt-8">
        {soalList.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-10 h-10 rounded-lg font-bold ${
              currentIndex === index
                ? 'bg-amber-500 text-white'
                : 'bg-slate-200'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* NEXT PREV */}
      <div className="flex justify-between mt-6">
        <button
          disabled={currentIndex === 0}
          onClick={handlePrev}
          className="px-4 py-2 bg-slate-300 rounded-lg disabled:opacity-50"
        >
          Sebelumnya
        </button>

        <button
          disabled={currentIndex === soalList.length - 1}
          onClick={handleNext}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg disabled:opacity-50"
        >
          Berikutnya
        </button>
      </div>

    </div>
  )
}