// Ganti semua isi di file ini dengan datamu sendiri.
// Field opsional yang dikosongkan ('') otomatis disembunyikan di halaman.

export const profile = {
  name: 'Aris Yuda Pratama',
  brand: 'logsfx',
  tagline: 'Membangun web yang cepat, rapi, dan enak dipakai.',
  roles: ['Frontend Developer', 'Creative Coder', 'UI Engineer'],
  intro:
    'Saya membuat antarmuka web yang cepat dan mudah dipakai, dari landing page sampai dashboard dan eksperimen grafis 3D di browser.',
  about: [
    'Saya mulai ngoding dari mengutak-atik tampilan blog sekolah. Sekarang saya fokus di frontend: komponen yang rapi, animasi yang terasa wajar, dan halaman yang tetap ringan di HP kelas bawah.',
    'Di luar proyek klien, saya bereksperimen dengan shader WebGL dan menulis catatan belajar supaya orang lain tidak mengulang kesalahan yang sama.',
  ],
  location: 'Surabaya, Indonesia',
  available: true,
  photo: '', // mis. '/foto.webp' (taruh file di folder public/)
  email: 'arisyudapratama1@gmail.com',
  whatsapp: '', // nomor dengan kode negara, mis. '+62 812-3456-7890'; kosong = tombol disembunyikan
  now: [
    { label: 'Sedang belajar', value: 'Shader GLSL dan animasi berbasis scroll' },
    { label: 'Sedang membangun', value: 'Aplikasi kasir untuk UMKM' },
    { label: 'Sedang didengar', value: 'Playlist lo-fi untuk fokus' },
  ],
}

// Label boleh diganti; id harus sama dengan id section di komponen.
export const nav = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'tentang', label: 'Tentang' },
  { id: 'portofolio', label: 'Portofolio' },
  { id: 'kontak', label: 'Kontak' },
]

// icon: 'github' | 'instagram' | 'whatsapp'; nama lain memakai ikon tautan umum.
export const socials = [
  { name: 'GitHub', url: 'https://github.com/arisyudapratama', icon: 'github' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/arisyudapratama', icon: 'linkedin' },
  { name: 'Instagram', url: 'https://www.instagram.com/arysuda1', icon: 'instagram' },
]

export const education = [
  { place: 'SMK Contoh Nusantara', detail: 'Rekayasa Perangkat Lunak', period: '2024 – 2027' },
  { place: 'SMP Contoh Bangsa', detail: 'Sekolah Menengah Pertama', period: '2021 – 2024' },
]

export const experience = [
  { place: 'Freelance', detail: 'Web developer untuk UMKM lokal', period: '2025 – sekarang' },
  { place: 'Studio Contoh', detail: 'Magang frontend developer', period: '2026' },
]

// image: path gambar di public/ (mis. '/projects/kasir.webp'); kosong = cover ilustrasi otomatis.
export const projects = [
  {
    title: 'Kasir Kilat',
    category: 'Web App',
    year: 2026,
    summary: 'Aplikasi kasir untuk UMKM: transaksi, stok, dan laporan harian di satu layar.',
    description:
      'Kasir Kilat dibuat untuk warung dan toko kecil yang butuh kasir sederhana di tablet. Fokusnya kecepatan: produk dicari dengan beberapa huruf, stok berkurang sendiri, dan rekap harian siap dikirim ke pemilik.',
    features: [
      'Pencarian produk instan saat transaksi',
      'Stok berkurang otomatis di setiap penjualan',
      'Laporan harian bisa diekspor ke CSV',
    ],
    tech: ['React', 'Supabase', 'Vite', 'CSS'],
    accent: '#2c67ed',
    image: '',
    demo: 'https://example.com',
    repo: 'https://github.com/username/kasir-kilat',
    featured: true,
  },
  {
    title: 'Langit Hari Ini',
    category: 'Dashboard',
    year: 2026,
    summary: 'Dashboard cuaca dengan grafik suhu dan peringatan hujan per jam.',
    description:
      'Dashboard yang menarik data cuaca dari API publik dan menampilkannya sebagai grafik suhu, peluang hujan, dan kualitas udara untuk kota pilihan.',
    features: ['Grafik suhu 24 jam', 'Peringatan hujan per jam', 'Simpan kota favorit di browser'],
    tech: ['JavaScript', 'Chart.js', 'Open-Meteo API'],
    accent: '#00c2d1',
    image: '',
    demo: 'https://example.com',
    repo: '',
  },
  {
    title: 'Ringkas Bot',
    category: 'Bot',
    year: 2025,
    summary: 'Bot Telegram yang meringkas berita pilihan setiap pagi.',
    description:
      'Bot yang mengumpulkan berita dari beberapa sumber RSS, meringkasnya jadi tiga poin, lalu mengirimkannya ke grup Telegram setiap jam 6 pagi.',
    features: ['Jadwal kirim otomatis', 'Pilih topik lewat perintah /topik', 'Riwayat ringkasan 30 hari'],
    tech: ['Python', 'Telegram Bot API', 'SQLite'],
    accent: '#7c5cff',
    image: '',
    demo: '',
    repo: 'https://github.com/username/ringkas-bot',
  },
  {
    title: 'Galeri Cahaya',
    category: 'Kreatif',
    year: 2025,
    summary: 'Galeri karya interaktif dengan efek cahaya WebGL yang mengikuti kursor.',
    description:
      'Eksperimen galeri: setiap karya diterangi lampu sorot virtual yang bergerak mengikuti kursor, dibuat dengan shader fragment tanpa library 3D.',
    features: ['Shader cahaya real-time', 'Tetap mulus di 60 fps', 'Mode statis untuk reduced motion'],
    tech: ['WebGL', 'GLSL', 'JavaScript'],
    accent: '#00f0ff',
    image: '',
    demo: 'https://example.com',
    repo: 'https://github.com/username/galeri-cahaya',
  },
  {
    title: 'Absensi Sekolah',
    category: 'Web App',
    year: 2025,
    summary: 'Sistem absensi siswa dengan rekap otomatis per kelas dan per bulan.',
    description:
      'Aplikasi absensi untuk wali kelas: centang kehadiran dari HP, lalu rekap bulanan per siswa langsung tersedia untuk dicetak.',
    features: ['Input kehadiran sekali ketuk', 'Rekap bulanan per siswa', 'Cetak laporan ke PDF'],
    tech: ['PHP', 'MySQL', 'Bootstrap'],
    accent: '#3b82f6',
    image: '',
    demo: '',
    repo: '',
  },
  {
    title: 'Kopi Senja',
    category: 'Website',
    year: 2024,
    summary: 'Landing page kedai kopi dengan menu, lokasi, dan pesan via WhatsApp.',
    description:
      'Landing page satu halaman untuk kedai kopi lokal: menu dengan foto, jam buka, peta lokasi, dan tombol pesan yang langsung membuka WhatsApp.',
    features: ['Menu dengan filter minuman', 'Peta lokasi tersemat', 'Skor Lighthouse 98'],
    tech: ['HTML', 'CSS', 'JavaScript'],
    accent: '#f59e0b',
    image: '',
    demo: 'https://example.com',
    repo: '',
  },
]

export const certificates = [
  { title: 'Dasar Pemrograman Web', issuer: 'Platform Kursus Online', year: 2025, url: '' },
  { title: 'JavaScript Lanjutan', issuer: 'Platform Kursus Online', year: 2025, url: '' },
  { title: 'Pengembangan Aplikasi React', issuer: 'Bootcamp Contoh', year: 2026, url: '' },
  { title: 'Praktik Kerja Lapangan', issuer: 'Studio Contoh', year: 2026, url: '' },
]

export const awards = [
  { title: 'Juara 2 Lomba Desain Web', event: 'Tingkat kota', year: 2025 },
  { title: 'Finalis Hackathon Pelajar', event: 'Tingkat provinsi', year: 2026 },
]

export const skills = [
  { group: 'Frontend', items: ['HTML', 'CSS', 'JavaScript', 'React', 'Vite', 'WebGL'] },
  { group: 'Backend & Database', items: ['Node.js', 'PHP', 'Python', 'MySQL', 'Supabase'] },
  { group: 'Tools', items: ['Git', 'GitHub', 'Figma', 'VS Code', 'Vercel'] },
]
