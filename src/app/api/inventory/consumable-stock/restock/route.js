/**
 * @file Mendefinisikan endpoint API untuk mencatat penambahan stok (restock).
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { authorizeRole } from '@/lib/services/roleValidation';
import connectToDatabase from '@/database/database';

// Impor fungsi dari service layer
import { recordRestock } from '@/lib/services/consumableServices';

/**
 * Menangani POST untuk mencatat penambahan stok (barang masuk).
 * @param {Request} request - Objek request masuk.
 * @returns {Promise<NextResponse>} Respons JSON.
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    // Memastikan pengguna yang melakukan aksi adalah admin atau manager
    authorizeRole(session, ['admin', 'manager']);

    const data = await request.json();
    
    // Panggil service untuk menjalankan logika bisnis, teruskan ID pengguna
    const result = await recordRestock(data, session.user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Stok berhasil ditambahkan.',
      data: result
    }, { status: 201 });

  } catch (error) {
    // Penanganan error yang lebih terpusat
    const status = error.isValidationError ? 400 : 500;
    const message = error.message || "Terjadi kesalahan pada server.";
    const errors = error.isValidationError ? error.errors : undefined;

    console.error("Error in POST /api/consumable-stock/restock:", error);
    
    return NextResponse.json({ success: false, message, errors }, { status });
  }
}
