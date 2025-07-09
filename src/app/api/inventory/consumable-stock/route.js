/**
 * @file Mendefinisikan endpoint API untuk resource stok barang habis pakai.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { authorizeRole } from '@/lib/services/roleValidation';
import connectToDatabase from '@/database/database';

// Impor fungsi dari service layer
import { getPaginatedConsumableStock } from '@/lib/services/consumableServices';

/**
 * Menangani GET untuk mengambil daftar stok barang habis pakai dengan filter dan paginasi.
 * @param {Request} request - Objek request masuk.
 * @returns {Promise<NextResponse>} Respons JSON dengan daftar stok dan metadata paginasi.
 */
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    authorizeRole(session); // Pengguna yang login boleh melihat daftar stok

    const { searchParams } = new URL(request.url);
    
    // Mengumpulkan semua filter dari URL
    const filters = {};
    const allowedFilters = ['q', 'product', 'low_stock'];
    allowedFilters.forEach(key => {
        if (searchParams.has(key)) {
            filters[key] = searchParams.get(key);
        }
    });

    // Panggil service untuk mendapatkan data
    const result = await getPaginatedConsumableStock({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        sortBy: searchParams.get('sortBy'),
        order: searchParams.get('order'),
        filters,
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    console.error("Error in GET /api/consumable-stock:", error);
    const status = error.status || 500;
    const message = error.message || "Terjadi kesalahan pada server.";
    return NextResponse.json({ success: false, message }, { status });
  }
}
