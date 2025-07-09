/**
 * @file Mendefinisikan endpoint API untuk operasi pada satu aset spesifik (GET by ID, PUT, DELETE).
 * @path /api/assets/[id]
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { authorizeRole } from '@/lib/services/roleValidation';
import { getAssetById, updateAssetById, deleteAssetById } from '@/lib/services/assetServices';
import connectToDatabase from '@/database/database';

/**
 * GET: Mengambil data satu aset berdasarkan ID.
 */
export async function GET(request, { params }) {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID Aset tidak ditemukan.' }, { status: 400 });
    }

  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    authorizeRole(session); // Memastikan pengguna terautentikasi


    const asset = await getAssetById(id);
    return NextResponse.json({ success: true, data: asset });

  } catch (error) {
    // Tangani error, termasuk jika aset tidak ditemukan oleh service
    const status = error.isNotFound ? 404 : error.status || 500;
    const message = error.message || "Terjadi kesalahan pada server.";

    console.error(`Error in GET /api/assets/${params.id}:`, error.message);

    return NextResponse.json({ success: false, message }, { status });
  }
}

/**
 * PUT: Memperbarui data satu aset berdasarkan ID.
 */
export async function PUT(request, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID Aset tidak ditemukan.' }, { status: 400 });
  }
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const validationResponse = authorizeRole(session);
    if (!validationResponse.success) {
      return NextResponse.json(
        { message: validationResponse.messages },
        { status: validationResponse.status }
      );
    }

    const body = await request.json();
    const updatedAsset = await updateAssetById(id, body);

    return NextResponse.json({
      success: true,
      message: 'Aset berhasil diperbarui.',
      data: updatedAsset
    });

  } catch (error) {
    // Tangani berbagai jenis error (validasi, not found, dll)
    const status = error.isValidationError ? 400 : error.isNotFound ? 404 : 500;
    const message = error.message || "Terjadi kesalahan pada server.";
    const errors = error.isValidationError ? error.errors : undefined;

    console.error(`Error in PUT /api/assets/${params.id}:`, error.message);

    return NextResponse.json({ success: false, message, errors }, { status });
  }
}

/**
 * DELETE: Menghapus satu aset berdasarkan ID.
 */
export async function DELETE(request, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID Aset tidak ditemukan.' }, { status: 400 });
  }
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const validationResponse = authorizeRole(session);
    if (!validationResponse.success) {
      return NextResponse.json(
        { message: validationResponse.messages },
        { status: validationResponse.status }
      );
    }

    await deleteAssetById(id);
    return NextResponse.json({ success: true, message: 'Aset berhasil dihapus.' });

  } catch (error) {
    const status = error.isNotFound ? 404 : error.isConflict ? 409 : 500;
    const message = error.message || "Terjadi kesalahan pada server.";

    console.error(`Error in DELETE /api/assets/${params.id}:`, error.message);

    return NextResponse.json({ success: false, message }, { status });
  }
}
