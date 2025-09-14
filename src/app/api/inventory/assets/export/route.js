import { NextResponse } from "next/server";
import {
  exportAssetSummary,
  exportAllIndividualAssets,
} from "@/lib/services/assetServices"; // Pastikan path ini benar
import XLSX from "xlsx";
import connectToDatabase from "@/database/database"; // Penting: Pastikan koneksi DB aktif
/**
 * Handles GET requests to export asset data.
 * @param {Request} request The incoming request object.
 */
export async function GET(request) {
  try {
    await connectToDatabase(); // Jalankan koneksi database

    // Di App Router, query parameter diakses melalui searchParams
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'summary';
    const sortBy = searchParams.get('sortBy');
    const order = searchParams.get('order');

    // Kumpulkan sisa parameter sebagai filter
    const filters = {};
    for (const [key, value] of searchParams.entries()) {
        if (key !== 'type' && key !== 'sortBy' && key !== 'order') {
            filters[key] = value;
        }
    }

    let dataToExport;
    let sheetName;
    let baseFilename;

    if (type === 'individual') {
      dataToExport = await exportAllIndividualAssets({ filters, sortBy, order });
      sheetName = 'Data Aset Individual';
      baseFilename = 'Laporan_Aset_Individual';
    } else { // Default ke summary
      dataToExport = await exportAssetSummary({ filters, sortBy, order });
      sheetName = 'Ringkasan Aset';
      baseFilename = 'Laporan_Aset_Ringkasan';
    }

    if (!dataToExport || dataToExport.length === 0) {
      return NextResponse.json(
        { message: "Tidak ada data yang cocok untuk diekspor." },
        { status: 404 }
      );
    }

    // Proses pembuatan CSV
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    // Konversi worksheet langsung menjadi string CSV
    const csvString = XLSX.utils.sheet_to_csv(worksheet);
    const csvStringWithBOM = "\uFEFF" + csvString;


    // Set header dan kirim file menggunakan objek Response standar
    const timestamp = new Date().toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\//g, '-');
    const filename = `${baseFilename}_${timestamp}.csv`; // Ganti ekstensi file menjadi .csv

    // Buat header untuk respons file
    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    // Ganti Content-Type menjadi text/csv
    headers.set("Content-Type", "text/csv");
    // Beri tahu browser untuk mengekspos header Content-Disposition
    headers.set("Access-Control-Expose-Headers", "Content-Disposition");

    return new Response(csvStringWithBOM, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error("Gagal melakukan ekspor aset:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server saat ekspor." },
      { status: 500 }
    );
  }
}

