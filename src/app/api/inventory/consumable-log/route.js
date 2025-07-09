/**
 * @file Mendefinisikan endpoint API untuk riwayat transaksi (log) barang habis pakai.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { authorizeRole } from '@/lib/services/roleValidation';
import connectToDatabase from '@/database/database';

// Impor fungsi dari service layer
import { getPaginatedConsumableLogs } from '@/lib/services/consumableServices';

/**
 * Menangani GET untuk mengambil riwayat transaksi barang habis pakai.
 * @param {Request} request - Objek request masuk.
 * @returns {Promise<NextResponse>} Respons JSON dengan daftar log dan metadata paginasi.
 */
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    authorizeRole(session); // Memastikan pengguna sudah login

    const { searchParams } = new URL(request.url);
    
    // Mengumpulkan semua filter dari URL secara dinamis
    const filters = {};
    const allowedFilters = ['q', 'type', 'user', 'stock_item', 'startDate', 'endDate'];
    allowedFilters.forEach(key => {
        if (searchParams.has(key)) {
            filters[key] = searchParams.get(key);
        }
    });

    // Panggil service untuk mendapatkan data dengan semua parameter
    const result = await getPaginatedConsumableLogs({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        sortBy: searchParams.get('sortBy'),
        order: searchParams.get('order'),
        filters,
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    console.error("Error in GET /api/consumable-log:", error);
    const status = error.status || 500;
    const message = error.message || "Terjadi kesalahan pada server.";
    return NextResponse.json({ success: false, message }, { status });
  }
}
