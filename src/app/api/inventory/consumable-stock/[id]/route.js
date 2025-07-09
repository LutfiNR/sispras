/**
 * @file Mendefinisikan endpoint API untuk satu resource stok barang habis pakai spesifik.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { authorizeRole } from '@/lib/services/roleValidation';
import connectToDatabase from '@/database/database';

// Impor fungsi dari service layer
import { getConsumableStockById } from '@/lib/services/consumableServices';

/**
 * Menangani GET untuk mengambil detail satu item stok.
 */
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    authorizeRole(session); // Pengguna yang login boleh melihat detail stok

    const { id } = params;
    if (!id) {
        return NextResponse.json({ success: false, message: 'ID Stok tidak ditemukan.' }, { status: 400 });
    }

    const stockItem = await getConsumableStockById(id);
    return NextResponse.json({ success: true, data: stockItem });

  } catch (error) {
    const status = error.isNotFound ? 404 : error.status || 500;
    const message = error.message || "Terjadi kesalahan pada server.";
    
    console.error(`Error in GET /api/consumable-stock/${params.id}:`, error);
    
    return NextResponse.json({ success: false, message }, { status });
  }
}
