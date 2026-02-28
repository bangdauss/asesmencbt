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
  const [flagMap, setFlagMap] = useState<Record<number, boolean>>({})

  /* ============================= */
  /* SECURITY LAYER */
  /* ============================= */
  useEffect(() => {
    // Disable klik kanan
    const disableContext = (e: any) => e.preventDefault()
    document.addEventListener("contextmenu", disableContext)

    // Disable copy paste
    const disableCopy = (e: any) => e.preventDefault()
    document.addEventListener("copy", disableCopy)
    document.addEventListener("paste", disableCopy)

    // Disable F12 / DevTools
    const disableDev = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault()
      }
    }
    document.addEventListener("keydown", disableDev)

    // Force fullscreen (PC only)
    const enterFullscreen = async () => {
      if (window.innerWidth > 768 && document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen()
        } catch {}
      }
    }

    enterFullscreen()

    return () => {
      document.removeEventListener("contextmenu", disableContext)
      document.removeEventListener("copy", disableCopy)
      document.removeEventListener("paste", disableCopy)
      document.removeEventListener("keydown", disableDev)
    }
  }, [])

  /* ============================= */
  /* INIT UJIAN */
  /* ============================= */
  useEffect(() => {
    let interval: NodeJS.Timeout

    const init = async () => {
      const siswaSession = localStorage.getItem("siswa_session")
      const idAsesmenRaw = localStorage.getItem("id_asesmen")

      if (!siswaSession || !idAsesmenRaw) {
        router.push("/login")
        return
      }

      const siswa = JSON.parse(siswaSession)
      const idAsesmen = Number(idAsesmenRaw)

      const { data: laporan } = await supabase
        .from("laporan_ujian")
        .select(`*, data_asesmen(durasi_menit)`)
        .eq("no_peserta", siswa.no_peserta)
        .eq("id_asesmen", idAsesmen)
        .single()

      if (!laporan) {
        router.push("/login")
        return
      }

      if (laporan.status === "selesai") {
        router.push("/peserta/hasil")
        return
      }

      const mulai = new Date(laporan.mulai_pada).getTime()
      const durasi = laporan.data_asesmen?.durasi_menit ?? 60
      const selesai = mulai + durasi * 60 * 1000

      interval = setInterval(() => {
        const sisa = Math.floor((selesai - Date.now()) / 1000)
        if (sisa <= 0) {
          clearInterval(interval)
          handleSubmit("auto_submit")
        } else {
          setSisaWaktu(sisa)
        }
      }, 1000)

      const { data: soalData } = await supabase
        .from("bank_soal")
        .select("*")
        .eq("id_asesmen", idAsesmen)

      if (soalData) {
        // RANDOM SOAL
        const shuffled = soalData.sort(() => Math.random() - 0.5)

        // RANDOM OPSI
        shuffled.forEach((s: any) => {
          if (s.pilihan) {
            const entries = Object.entries(s.pilihan)
            const randomEntries = entries.sort(() => Math.random() - 0.5)
            s.pilihan = Object.fromEntries(randomEntries)
          }
        })

        setSoalList(shuffled)
      }

      setLoading(false)
    }

    init()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [router])

  const handleJawab = async (opsi: string) => {
    const soal = soalList[currentIndex]
    setJawabanMap(prev => ({ ...prev, [soal.id]: opsi }))
  }

  const handleSubmit = async (status = "selesai") => {
    const siswaSession = localStorage.getItem("siswa_session")
    const idAsesmenRaw = localStorage.getItem("id_asesmen")
    if (!siswaSession || !idAsesmenRaw) return

    const siswa = JSON.parse(siswaSession)
    const idAsesmen = Number(idAsesmenRaw)

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

  const formatTime = (s: number) => {
    const jam = Math.floor(s / 3600)
    const menit = Math.floor((s % 3600) / 60)
    const detik = s % 60
    return `${jam.toString().padStart(2, "0")}:${menit
      .toString()
      .padStart(2, "0")}:${detik.toString().padStart(2, "0")}`
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!soalList.length) return <div className="p-10">Tidak ada soal</div>

  const soal = soalList[currentIndex]

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white shadow px-6 py-4">
        <h1 className="font-bold">Ujian Berlangsung</h1>
        <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-mono font-bold">
          ⏳ {formatTime(sisaWaktu)}
        </div>
      </div>

      <div className="flex flex-col md:flex-row">

        {/* SOAL */}
        <div className="flex-1 p-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold mb-4">
              Soal {currentIndex + 1} dari {soalList.length}
            </h2>

            <p className="mb-4 whitespace-pre-line">
              {soal.pertanyaan}
            </p>

            {soal.gambar && (
              <img
                src={soal.gambar}
                className="max-h-72 object-contain mb-4 rounded border"
              />
            )}

            <div className="space-y-3">
              {Object.entries(soal.pilihan || {}).map(([key, value]) => {
                const selected = jawabanMap[soal.id] === key
                return (
                  <button
                    key={key}
                    onClick={() => handleJawab(key)}
                    className={`w-full text-left p-3 border rounded-lg transition ${
                      selected
                        ? "bg-green-200 border-green-500"
                        : "hover:bg-amber-50"
                    }`}
                  >
                    <b>{key}.</b> {value as string}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* PANEL NOMOR */}
        <div className="md:w-72 bg-white border-l p-6">
          <h3 className="font-bold mb-4">Daftar Soal</h3>

          <div className="grid grid-cols-5 md:grid-cols-4 gap-2">
            {soalList.map((item, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-10 rounded font-bold ${
                  currentIndex === i
                    ? "bg-amber-500 text-white"
                    : jawabanMap[item.id]
                    ? "bg-green-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleSubmit()}
            className="mt-6 w-full bg-red-600 text-white py-3 rounded-lg font-bold"
          >
            Selesai Ujian
          </button>
        </div>
      </div>
    </div>
  )
}