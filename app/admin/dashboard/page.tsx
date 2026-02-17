// Pastikan bagian ini ada di dalam return utama Anda
<main style={{ padding: '40px' }}>
  {/* DASHBOARD VIEW - JAMINAN GAK KOSONG */}
  {activeMenu === 'dashboard' && (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px', color: '#0f172a' }}>
        Ringkasan Data
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {/* Card 1: Total Siswa */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Total Peserta</span>
            <span style={{ fontSize: '1.5rem' }}>🎓</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>
            {students.length} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: '400' }}>Siswa</span>
          </div>
        </div>

        {/* Card 2: Siswa Aktif */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Status Aktif</span>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#22c55e', marginTop: '12px' }}>
            {students.filter(s => s.status).length} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: '400' }}>Online</span>
          </div>
        </div>

        {/* Card 3: Admin */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Administrator</span>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#3b82f6', marginTop: '12px' }}>
            {users.length} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: '400' }}>User</span>
          </div>
        </div>
      </div>

      {/* Info Tambahan */}
      <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px border #bfdbfe', color: '#1e40af' }}>
        <strong>Tips:</strong> Gunakan menu <strong>Data Siswa</strong> untuk mengatur status ujian peserta secara massal atau individu.
      </div>
    </div>
  )}

  {/* Kode Data Siswa & User tetap di bawah sini... */}
</main>