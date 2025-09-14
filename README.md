# Aplikasi Sistem Informasi Sarana & Prasarana (SISPRAS)

Aplikasi ini adalah sistem informasi berbasis web yang dirancang untuk mengelola dan melacak aset inventaris, baik aset tetap maupun barang habis pakai. Aplikasi ini dibangun menggunakan Next.js dengan App Router dan dilengkapi dengan sistem otentikasi pengguna.

## Fitur Utama

- **Manajemen Aset Tetap**  
    CRUD (Create, Read, Update, Delete) untuk aset individual dengan nomor seri, lokasi, merek, dan lainnya.

- **Manajemen Inventaris Habis Pakai**  
    - Katalog produk habis pakai  
    - Pencatatan stok masuk (penambahan) dan stok keluar (pengambilan)  
    - Riwayat (log) transaksi untuk setiap item

- **Sistem Otentikasi**  
    Login aman menggunakan email dan password dengan NextAuth.js.

- **Rute Terlindungi**  
    Halaman dasbor dan manajemen hanya bisa diakses oleh pengguna yang sudah login.

- **Pencarian & Filter**  
    Fungsionalitas pencarian dan filter di semua tabel data.

- **Ekspor Data**  
    Kemampuan untuk mengekspor laporan aset dan riwayat transaksi ke format CSV.

- **Antarmuka Responsif**  
    Dibangun dengan Material-UI (MUI) untuk pengalaman pengguna yang konsisten di berbagai perangkat.

## Teknologi yang Digunakan

- **Framework:** Next.js (dengan App Router)
- **Library UI:** Material-UI (MUI) & Toolpad Core
- **Otentikasi:** NextAuth.js
- **Database:** MongoDB dengan Mongoose
- **Validasi:** Zod
- **Styling:** Emotion
- **Pembuatan Form:** React Hook Form (diasumsikan untuk form yang kompleks)
