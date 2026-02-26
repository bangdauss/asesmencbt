"use client"

export const runtime = "edge"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  const [jawabanMap, setJawabanMap] = useState<Record<number, string>>({})
  const [laporanId, setLaporanId] = useState<number | null>(null)

  const getDeviceId = () => {
    let deviceId = localStorage.getItem("device_id")
    if (!deviceId) {
      deviceId = crypto.randomUUID()
      localStorage.setItem("device_id", deviceId)
    }
    return deviceId
  }

  useEffect(() => {
    let interval: any

    const initUjian = async () => {
      const siswaSession = localStorage.getItem("siswa_session")
      const idAsesmenRaw = localStorage.getItem("id_asesmen")

      if (!siswaSession || !idAsesmenRaw) {
        router.push("/login")
        return
      }

      const siswa = JSON.parse(siswaSession)
      const idAsesmen = Number(idAsesmenRaw)
      const deviceId = getDeviceId()

      const { data: laporan } = await supabase
        .from("laporan_ujian")
        .select(`*, data_asesmen ( durasi_menit )`)
        .eq("no_peserta", siswa.no_peserta)
        .eq("id_asesmen", idAsesmen)
        .single()

      let laporanFinal = laporan

      if (!laporan) {
        const { data: newLaporan } = await supabase
          .from("laporan_ujian")
          .insert({
            no_peserta: siswa.no_peserta,
            id_asesmen: idAsesmen,
            mulai_pada: new Date().toISOString(),
            status: "sedang",
            device_id: deviceId
          })
          .select(`*, data_asesmen ( durasi_menit )`)
          .single()

        laporanFinal = newLaporan
      }

      if (!laporanFinal) {
        router.push("/login")
        return
      }

      // 🔒 DEVICE LOCK
      if (laporanFinal.device_id && laporanFinal.device_id !== deviceId) {
        alert("Ujian sudah dibuka di perangkat lain!")
        router.push("/login")
        return
      }

      // 🔒 STATUS VALIDATION
      if (laporanFinal.status !== "sedang") {
        router.push("/login")
        return
      }

      setLaporanId(laporanFinal.id)

      // ⏳ TIMER
      const mulai = new Date(laporanFinal.mulai_pada).getTime()
      const durasiMenit = laporanFinal.data_asesmen?.durasi_menit ?? 60
      const selesai = mulai + durasiMenit * 60 * 1000

      interval = setInterval(async () => {
        const sisa = Math.floor((selesai - Date.now()) / 1000)

        if (sisa <= 0) {
          clearInterval(interval)
          handleSubmit("auto_submit")
        } else {
          setSisaWaktu(sisa)

          // 🔄 HEARTBEAT
          await supabase
            .from("laporan_ujian")
            .update({ last_seen: new Date().toISOString() })
            .eq("id", laporanFinal.id)
        }
      }, 1000)

      // 📚 AMBIL SOAL
      const { data: soalData } = await supabase
        .from("bank_soal")
        .select("*")
        .eq("id_asesmen", idAsesmen)
        .order("id", { ascending: true })

      if (soalData) setSoalList(soalData)

      // LOAD JAWABAN
      const { data: jawabanData } = await supabase
        .from("jawaban_peserta")
        .select("*")
        .eq("no_peserta", siswa.no_peserta)
        .eq("id_asesmen", idAsesmen)

      if (jawabanData) {
        const map: Record<number, string> = {}
        jawabanData.forEach((j: any) => {
          map[j.id_soal] = j.jawaban
        })
        setJawabanMap(map)
      }

      setLoading(false)
    }

    initUjian()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [router])

  // 🚫 Disable klik kanan
  useEffect(() => {
    const disableRightClick = (e: any) => e.preventDefault()
    document.addEventListener("contextmenu", disableRightClick)
    return () => document.removeEventListener("contextmenu", disableRightClick)
  }, [])

  // 👀 Detect pindah tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        alert("Dilarang pindah tab selama ujian!")
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  const handleJawab = async (opsi: string) => {
    const siswa = JSON.parse(localStorage.getItem("siswa_session")!)
    const idAsesmen = Number(localStorage.getItem("id_asesmen"))
    const soal = soalList[currentIndex]

    setJawabanMap(prev => ({ ...prev, [soal.id]: opsi }))

    await supabase.from("jawaban_peserta").upsert({
      no_peserta: siswa.no_peserta,
      id_asesmen: idAsesmen,
      id_soal: soal.id,
      jawaban: opsi
    })
  }

  const handleSubmit = async (status = "selesai") => {
    const siswa = JSON.parse(localStorage.getItem("siswa_session")!)
    const idAsesmen = Number(localStorage.getItem("id_asesmen"))

    await supabase
      .from("laporan_ujian")
      .update({
        status,
        selesai_pada: new Date().toISOString()
      })
      .eq("no_peserta", siswa.no_peserta)
      .eq("id_asesmen", idAsesmen)

    router.push("/peserta/hasil")
  }

  const formatTime = (t: number) => {
    const jam = Math.floor(t / 3600)
    const menit = Math.floor((t % 3600) / 60)
    const detik = t % 60
    return `${jam.toString().padStart(2, "0")}:${menit
      .toString()
      .padStart(2, "0")}:${detik.toString().padStart(2, "0")}`
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!soalList.length)
    return <div className="p-10 text-center">Tidak ada soal</div>

  const soal = soalList[currentIndex]

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="flex justify-between mb-6">
        <h1 className="font-bold text-xl">Ujian Berlangsung</h1>
        <div className="bg-red-100 text-red-600 px-6 py-3 rounded-xl font-mono font-bold">
          ⏳ {formatTime(sisaWaktu)}
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl mb-6">
        <h2 className="font-bold mb-4">
          Soal {currentIndex + 1} dari {soalList.length}
        </h2>

        <p className="mb-4">{soal.pertanyaan}</p>

        {soal.gambar && (
          <img
            src={soal.gambar.trim()}
            className="max-h-72 object-contain rounded-lg border"
          />
        )}
      </div>

      <div className="space-y-3">
        {Object.entries(soal.pilihan || {}).map(([key, value]) => {
          const isSelected = jawabanMap[soal.id] === key
          return (
            <button
              key={key}
              onClick={() => handleJawab(key)}
              className={`w-full text-left p-4 border rounded-xl ${
                isSelected
                  ? "bg-green-200 border-green-500"
                  : "hover:bg-amber-50"
              }`}
            >
              {key}. {value as string}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => handleSubmit()}
        className="mt-8 w-full bg-red-600 text-white py-3 rounded-xl font-bold"
      >
        Selesai Ujian
      </button>
    </div>
  )
}