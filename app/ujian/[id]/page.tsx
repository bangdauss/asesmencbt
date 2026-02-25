"use client"

export const runtime = 'edge'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PageUjian() {
  const params = useParams()
  const idAsesmen = Number(params.id)

  const [soalList, setSoalList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSoal = async () => {
      const { data, error } = await supabase
        .from("bank_soal")
        .select("*")
        .eq("id_asesmen", idAsesmen)
        .order("id", { ascending: true })

      if (error) {
        console.error("Error ambil soal:", error.message)
      } else {
        console.log("DATA SOAL:", data)
        setSoalList(data || [])
      }

      setLoading(false)
    }

    if (idAsesmen) {
      fetchSoal()
    }
  }, [idAsesmen])

  if (loading) {
    return <div className="p-6">Loading soal...</div>
  }

  if (!soalList || soalList.length === 0) {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Tidak ada soal ditemukan untuk asesmen ini.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {soalList.map((soal, index) => (
        <div key={soal.id} className="border p-6 rounded-xl shadow">
          <h2 className="font-bold mb-4">
            {index + 1}. {soal.pertanyaan}
          </h2>

          {/* OPSI DARI JSON */}
          {soal.pilihan &&
            Object.entries(soal.pilihan).map(([key, value]) => (
              <button
                key={key}
                className="block w-full text-left p-3 mb-2 border rounded-lg hover:bg-amber-50"
              >
                {key}. {value as string}
              </button>
            ))}
        </div>
      ))}
    </div>
  )
}