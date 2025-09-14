import { NextResponse } from "next/server";
import { exportConsumableStock } from "@/lib/services/consumableServices"; // Pastikan path ini benar
import XLSX from "xlsx";
import connectToDatabase from "@/database/database"; // Penting untuk koneksi DB

/**
 * Menangani permintaan GET untuk mengekspor data stok barang habis pakai.
 * @param {Request} request Objek request yang masuk.
 */
export async function GET(request) {
  try {
    // Selalu pastikan koneksi database aktif
    await connectToDatabase();

    // Di App Router, parameter query diakses melalui searchParams
    const searchParams = request.nextUrl.searchParams;

    // Ekstrak parameter pencarian dan sorting
    const q = searchParams.get('q');
    const sortBy = searchParams.get('sortBy');
    const order = searchParams.get('order');
    
    // Siapkan objek filter
    const filters = { q };

    // Panggil service backend dengan filter yang sudah disiapkan
    const dataToExport = await exportConsumableStock({ filters, sortBy, order });

    // Handle jika tidak ada data yang cocok untuk diekspor
    if (!dataToExport || dataToExport.length === 0) {
      return NextResponse.json(
        { message: "Tidak ada data stok yang cocok untuk diekspor." },
        { status: 404 }
      );
    }

    // --- Proses Pembuatan File CSV ---
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const csvString = XLSX.utils.sheet_to_csv(worksheet);

    // Tambahkan BOM (Byte Order Mark) untuk memastikan kompatibilitas dengan Excel & UTF-8
    const csvStringWithBOM = "\uFEFF" + csvString;

    // Buat nama file yang dinamis dengan timestamp
    const timestamp = new Date().toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\//g, '-');
    const filename = `Stok_Barang_${timestamp}.csv`;

    // --- Siapkan Header untuk Respons File ---
    const headers = new Headers();
    headers.set("Content-Type", "text/csv;charset=utf-8;");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    // Izinkan frontend untuk membaca header Content-Disposition
    headers.set("Access-Control-Expose-Headers", "Content-Disposition");

    // Kirim file CSV sebagai respons
    return new Response(csvStringWithBOM, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error("Gagal melakukan ekspor stok:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server saat melakukan ekspor." },
      { status: 500 }
    );
  }
}
