import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function Page({
  params,
}: {
  params: { id: string }
}) {
  const { data, error } = await supabase
    .from("bank_soal")
    .select("*")
    .eq("id_asesmen", params.id)

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Ujian ID: {params.id}</h1>

      {data?.map((soal: any, index: number) => (
        <div key={soal.id} style={{ marginBottom: 20 }}>
          <h3>
            {index + 1}. {soal.pertanyaan}
          </h3>

          {soal.pilihan && (
            <ul>
              {Object.entries(soal.pilihan).map(([key, value]) => (
                <li key={key}>
                  {key}. {value as string}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}