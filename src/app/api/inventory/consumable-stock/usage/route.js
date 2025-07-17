/**
 * @file Mendefinisikan endpoint API untuk mencatat pengambilan stok (usage).
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { authorizeRole } from '@/lib/services/roleValidation';
import connectToDatabase from '@/database/database';

// Impor fungsi dari service layer
import { recordUsage } from '@/lib/services/consumableServices';

/**
 * Menangani POST untuk mencatat pengambilan stok (barang keluar).
 * @param {Request} request - Objek request masuk.
 * @returns {Promise<NextResponse>} Respons JSON.
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    // Semua pengguna yang sudah login boleh mencatat pengambilan barang
    authorizeRole(session);

    const data = await request.json();
    console.log(data);
    
    // Panggil service untuk menjalankan logika bisnis, teruskan ID pengguna
    const result = await recordUsage(data, session.user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Pengambilan stok berhasil dicatat.',
      data: result
    }, { status: 201 });

  } catch (error) {
    // Penanganan error yang lebih terpusat
    // Service akan melempar error dengan pesan yang jelas jika stok tidak cukup
    const status = error.isValidationError ? 400 : 500;
    const message = error.message || "Terjadi kesalahan pada server.";
    const errors = error.isValidationError ? error.errors : undefined;

    console.error("Error in POST /api/consumable-stock/usage:", error);
    
    return NextResponse.json({ success: false, message, errors }, { status });
  }
}
